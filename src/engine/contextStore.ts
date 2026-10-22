export class ContextStore {
  private store: Map<string, unknown> = new Map();

  /**
   * Saves a value into the store under a specific key.
   */
  public set(key: string, value: unknown): void {
    this.store.set(key, value);
  }

  /**
   * Retrieves a value from the store by key.
   */
  public get<T = unknown>(key: string): T | undefined {
    return this.store.get(key) as T;
  }

  /**
   * Checks whether a key exists in the context store.
   */
  public has(key: string): boolean {
    return this.store.has(key);
  }

  /**
   * Resets all stored runtime values between scenario runs to prevent data leakage.
   */
  public clear(): void {
    this.store.clear();
  }

  /**
   * Interpolates ${context:key} placeholders inside target strings or objects.
   * Example: "Order #${context:orderId}" -> "Order #CONF-8849"
   */
  public resolve<T>(target: T): T {
    if (typeof target === 'string') {
      return this.resolveString(target) as T;
    }

    if (Array.isArray(target)) {
      return target.map((item) => this.resolve(item)) as T;
    }

    if (target !== null && typeof target === 'object') {
      const resolvedObj: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(target as Record<string, unknown>)) {
        resolvedObj[key] = this.resolve(value);
      }
      return resolvedObj as T;
    }

    return target;
  }

  /**
   * Replaces ${context:key} matches inside a string.
   */
  private resolveString(input: string): string {
    const contextTokenRegex = /\${context:([a-zA-Z0-9_.-]+)}/g;

    return input.replace(contextTokenRegex, (match, key) => {
      if (!this.has(key)) {
        throw new Error(
          `[ContextStore Error] Unable to resolve token "${match}". Key "${key}" was not found in the context store.`
        );
      }
      const val = this.get(key);
      return String(val);
    });
  }
}

// Export a singleton instance for global engine access
export const globalContextStore = new ContextStore();