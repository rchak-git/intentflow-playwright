import { config } from 'dotenv';
import path from 'node:path';

type EnvironmentName = 'QA' | 'UAT';

export function loadLocalEnv(filePath = path.resolve(process.cwd(), '.env')): void {
  const result = config({ path: filePath });
  if (result.error && (result.error as NodeJS.ErrnoException).code !== 'ENOENT') {
    throw result.error;
  }
}

function selectedEnvironment(env: NodeJS.ProcessEnv): EnvironmentName | undefined {
  const value = env.INTENTFLOW_ENV?.trim().toUpperCase();
  if (!value) return undefined;
  if (value !== 'QA' && value !== 'UAT') {
    throw new Error('[IntentFlow Config] INTENTFLOW_ENV must be QA or UAT.');
  }
  return value;
}

export function resolveRuntimeConfig(env: NodeJS.ProcessEnv = process.env): {
  baseURL: string;
  channel?: 'chrome' | 'msedge';
} {
  const environment = selectedEnvironment(env);
  const baseURL = environment ? env[`${environment}_BASE_URL`]?.trim() : 'https://sandbox.moodledemo.net';
  if (!baseURL) {
    throw new Error(`[IntentFlow Config] ${environment}_BASE_URL is required.`);
  }
  let url: URL;
  try {
    url = new URL(baseURL);
  } catch {
    throw new Error(`[IntentFlow Config] ${environment}_BASE_URL must be an absolute HTTP or HTTPS URL.`);
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error(`[IntentFlow Config] ${environment}_BASE_URL must be an HTTP or HTTPS URL without credentials.`);
  }

  const browser = env.INTENTFLOW_BROWSER?.trim().toLowerCase();
  if (browser && browser !== 'chrome' && browser !== 'edge') {
    throw new Error('[IntentFlow Config] INTENTFLOW_BROWSER must be chrome or edge.');
  }
  return { baseURL, channel: browser === 'chrome' ? 'chrome' : browser === 'edge' ? 'msedge' : undefined };
}

export function resolveLoginData(
  defaultId: string,
  allowedIds: readonly string[] = [defaultId],
  options: { invalidPassword?: boolean; env?: NodeJS.ProcessEnv } = {}
): { id: string; username: string; password: string } {
  const env = options.env ?? process.env;
  const id = (env.INTENTFLOW_LOGIN_PROFILE || defaultId).trim().toLowerCase();
  if (!/^[a-z][a-z0-9_]*$/.test(id)) {
    throw new Error('[IntentFlow Config] Login profile IDs must start with a letter and contain only letters, numbers, and underscores.');
  }
  if (!allowedIds.some(allowed => allowed.toLowerCase() === id)) {
    throw new Error(`[IntentFlow Config] Login profile '${id}' is not allowed for this scenario. Allowed: ${allowedIds.join(', ')}.`);
  }

  const environment = selectedEnvironment(env);
  let usernameKey: string;
  let passwordKey: string;
  if (environment) {
    usernameKey = `${environment}_${id.toUpperCase()}_USERNAME`;
    passwordKey = `${environment}_${id.toUpperCase()}_${options.invalidPassword ? 'INVALID_PASSWORD' : 'PASSWORD'}`;
  } else {
    const legacyUsernames: Record<string, string> = {
      student: 'MOODLE_DEMO_USERNAME',
      admin: 'MOODLE_ADMIN_USERNAME',
    };
    const legacyPasswords: Record<string, string> = {
      student: 'MOODLE_DEMO_PASSWORD',
      admin: 'MOODLE_ADMIN_PASSWORD',
    };
    if (!legacyUsernames[id]) {
      throw new Error(`[IntentFlow Config] Set INTENTFLOW_ENV to use login profile '${id}'.`);
    }
    usernameKey = legacyUsernames[id];
    passwordKey = options.invalidPassword ? 'MOODLE_INVALID_PASSWORD' : legacyPasswords[id];
  }
  const username = env[usernameKey];
  const password = env[passwordKey];
  if (!username || !password) {
    throw new Error(`[IntentFlow Config] Set ${usernameKey} and ${passwordKey} for login profile '${id}'.`);
  }
  return { id, username, password };
}
