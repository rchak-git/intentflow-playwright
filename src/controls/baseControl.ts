import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import type { UiMapEntry } from '../types/uiMapTypes';
import type { Assertion } from '../types/intentSchema';
import { resolveUiEntryLocator } from '../engine/locatorFactory';
import { ActionParams } from '../types/intentSchema';
import { clear } from 'node:console';

export abstract class BaseControl {
  protected page: Page;
  protected locator: Locator;
  protected uiEntry: UiMapEntry;
  protected params?: ActionParams;

  constructor(page: Page, uiEntry: UiMapEntry, params?: ActionParams) {
    this.page = page;
    this.uiEntry = uiEntry;
    this.params = params;
    this.locator = resolveUiEntryLocator(page, uiEntry, undefined, params);
  }

  // Allows dynamic parameter updating prior to performing interactions
  public setParams(params?: ActionParams): void {
    if (params) {
      this.params = params;
      this.locator = resolveUiEntryLocator(this.page, this.uiEntry, undefined, params);
    }
  }

  // Common click interaction inherited by all UI controls
  public async click(params?: ActionParams): Promise<void> {
    if (params) {
      this.setParams(params);
    }
    await this.executeWithRetry(async () => {
      await this.locator.click({
        force: params?.force,
        timeout: params?.timeout,
      });
    });
  }

  // Returns primary value/text representation. Override in child controls as needed.
  public async getValue(): Promise<string> {
    return (await this.locator.innerText()).trim();
  }

  // Helper to fetch sub-locators for complex components
  public getSubLocator(key: string): Locator {
    return resolveUiEntryLocator(this.page, this.uiEntry, key, this.params);
  }

  // Common verification logic inherited by all UI controls
  public async verify(assertion?: Assertion, expectedValue?: string, params?: ActionParams): Promise<void> {
    if (params) {
      this.setParams(params);
    }

    switch (assertion) {
      case 'VISIBLE':
        await expect(this.locator).toBeVisible();
        break;

      case 'NOT_VISIBLE':
        await expect(this.locator).toBeHidden();
        break;

      case 'CONTAIN_TEXT':
        if (!expectedValue) throw new Error(`Assertion ${assertion} requires an expected string value.`);
        await expect(this.locator).toContainText(expectedValue);
        break;

      case 'TEXT_EQUALS':
        if (!expectedValue) throw new Error(`Assertion ${assertion} requires an expected string value.`);
        await expect(this.locator).toHaveText(expectedValue);
        break;

      case 'DISABLED':
        await expect(this.locator).toBeDisabled();
        break;

      case 'ENABLED':
        await expect(this.locator).toBeEnabled();
        break;

      default:
        throw new Error(`Unsupported assertion "${assertion}" for control type ${this.constructor.name}.`);
    }
  }

  // Helper for context store captures
  public async getInnerText(): Promise<string> {
    return (await this.locator.innerText()).trim();
  }

  // Resilience utility for flaky UI interactions
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