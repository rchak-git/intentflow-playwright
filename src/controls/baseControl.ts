import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import type { UiMapEntry } from '../types/uiMapTypes';
import { resolveUiEntryLocator } from '../engine/locatorFactory';

export class BaseControl {
  protected page: Page;
  protected locator: Locator;
  protected uiEntry: UiMapEntry;

  constructor(page: Page, uiEntry: UiMapEntry) {
    this.page = page;
    this.uiEntry = uiEntry;
    this.locator = resolveUiEntryLocator(page, uiEntry);
  }

  // Helper to fetch sub-locators for complex components (like tables or multi-part widgets)
  public getSubLocator(key: string): Locator {
    return resolveUiEntryLocator(this.page, this.uiEntry, key);
  }

  public async verify(assertion: string, expected?: string): Promise<void> {
    switch (assertion) {
      case 'VISIBLE':
        await expect(this.locator).toBeVisible();
        break;
      case 'HIDDEN':
        await expect(this.locator).toBeHidden();
        break;
      case 'ENABLED':
        await expect(this.locator).toBeEnabled();
        break;
      case 'DISABLED':
        await expect(this.locator).toBeDisabled();
        break;
      default:
        throw new Error(`Unsupported assertion "${assertion}" for this control.`);
    }
  }

  protected async executeWithRetry<T>(action: () => Promise<T>, retries = 2): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await action();
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          console.log(`[IntentFlow] Action failed. Retrying (${attempt + 1}/${retries})...`);
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }
    throw lastError;
  }
}