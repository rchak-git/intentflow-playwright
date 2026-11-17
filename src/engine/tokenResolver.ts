// src/engine/tokenResolver.ts
import { randomUUID } from 'crypto';
import { globalContextStore } from './contextStore';

export class TokenResolver {
  private static DATA_TOKEN_REGEX =
    /^\$\{data:([a-zA-Z0-9_]+)(?:\s*\|\|\s*(?:'([^']*)'|"([^"]*)"|([^}\s]+)))?\}$/;

  // Matches ${date:today}, ${date:+3d}, ${date:-7d}, or ${date:+3d:YYYY-MM-DD}
  private static DATE_TOKEN_REGEX =
    /\$\{date:(today|[+-]\d+d)(?::([^}]+))?\}/g;

  // Matches ${generate:Asg_} or ${generate:uuid}
  private static GENERATE_TOKEN_REGEX =
    /\$\{generate:([^}]+)\}/g;

  // Matches ${env:VAR_NAME}
  private static ENV_TOKEN_REGEX =
    /\$\{env:([a-zA-Z0-9_]+)\}/g;

  public static resolve(
    val: any,
    dataRecord: Record<string, any> = {},
    contextName: string = 'Step'
  ): any {
    if (typeof val === 'string') {
      // 1. Resolve full-string ${data:key || 'default'} first (may itself contain ${date:...} or ${generate:...})
      if (val.startsWith('${data:')) {
        const match = val.match(this.DATA_TOKEN_REGEX);
        if (match) {
          const [, key, singleQuotedDefault, doubleQuotedDefault, rawDefault] = match;
          const defaultValue = singleQuotedDefault ?? doubleQuotedDefault ?? rawDefault;
          const profileValue = dataRecord?.[key];

          if (profileValue !== undefined && profileValue !== null && profileValue !== '') {
            return this.resolve(profileValue, dataRecord, contextName);
          }
          if (defaultValue !== undefined) {
            return this.resolve(defaultValue, dataRecord, contextName);
          }
          throw new Error(
            `[TokenResolverError] Unresolved mandatory data token "${val}" at ${contextName}. No value provided in profile dataset and no inline default fallback specified.`
          );
        }
      }

      let resolved = val;

      // 2. Resolve ${env:VAR_NAME}
      resolved = resolved.replace(this.ENV_TOKEN_REGEX, (_, envKey: string) => {
        const envVal = process.env[envKey];
        if (envVal === undefined) {
          throw new Error(
            `[TokenResolverError] Missing environment variable "${envKey}" at ${contextName}.`
          );
        }
        return envVal;
      });

      // 3. Resolve ${date:+3d} or ${date:+3d:YYYY-MM-DD}
      resolved = resolved.replace(this.DATE_TOKEN_REGEX, (_, offsetStr: string, format?: string) => {
        return this.computeRelativeDate(offsetStr, format || 'MM/DD/YYYY');
      });

      // 4. Resolve ${generate:Asg_} -> e.g. Asg_94200123 or ${generate:uuid}
      resolved = resolved.replace(this.GENERATE_TOKEN_REGEX, (_, spec: string) => {
        if (spec.toLowerCase() === 'uuid') {
          return randomUUID();
        }
        const uniqueSuffix = `${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;
        return `${spec}${uniqueSuffix}`;
      });

      // 5. Resolve ${store:key} via globalContextStore
      if (resolved.startsWith('${store:') && resolved.endsWith('}')) {
        const storeKey = resolved.slice(8, -1);
        return globalContextStore.get<string>(storeKey) ?? resolved;
      }

      return globalContextStore.resolve(resolved);
    }

    if (Array.isArray(val)) {
      return val.map((item) => this.resolve(item, dataRecord, contextName));
    }

    if (typeof val === 'object' && val !== null) {
      const resolvedObj: Record<string, any> = {};
      for (const [k, v] of Object.entries(val)) {
        resolvedObj[k] = this.resolve(v, dataRecord, `${contextName} -> '${k}'`);
      }
      return resolvedObj;
    }

    return val;
  }

  private static computeRelativeDate(offsetStr: string, format: string): string {
    const target = new Date();
    if (offsetStr !== 'today') {
      const days = parseInt(offsetStr.replace('d', ''), 10);
      target.setDate(target.getDate() + days);
    }

    const yyyy = String(target.getFullYear());
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');

    return format
      .replace('YYYY', yyyy)
      .replace('MM', mm)
      .replace('DD', dd);
  }
}