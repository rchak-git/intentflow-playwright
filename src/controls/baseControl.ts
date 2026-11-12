// src/controls/baseControl.ts
import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import type { UiMapEntry } from '../types/uiMapTypes';
import type { StepParams, SubIntent, Scalar, StateValue } from '../types/intentSchema';
import { resolveUiEntryLocator } from '../engine/locatorFactory';

export abstract class BaseControl {
  protected page: Page;
  protected locator: Locator;
  protected uiEntry: UiMapEntry;
  protected params?: StepParams;

  constructor(page: Page, uiEntry: UiMapEntry, params?: StepParams) {
    this.page = page;
    this.uiEntry = uiEntry;
    this.params = params;
    this.locator = this.resolveTargetLocator(params);
  }

  /**
   * Auto-scrolls and waits for the parent iframe to be attached and visible if frameSelector is specified.
   */
// src/controls/baseControl.ts

/**
 * Progressively scrolls the top-level page until the target iframe 
 * attaches and renders in the main document DOM.
 */
// src/controls/baseControl.ts

/**
 * Progressively scrolls the top-level page until the target iframe 
 * attaches and renders in the main document DOM.
 */
// src/controls/baseControl.ts

/**
 * Progressively scrolls the top-level page until the target iframe 
 * attaches and renders in the main document DOM.
 */
protected async ensureFrameReady(): Promise<void> {
  if (!this.uiEntry.frameSelector) return;

  const frameElement = this.page.locator(this.uiEntry.frameSelector).first();

  // Check if frame element exists in the DOM
  let isAttached = (await frameElement.count()) > 0;

  // Progressive scroll loop to trigger viewport lazy-loading
  let attempts = 0;
  const maxAttempts = 12; // Max ~4800px scroll depth

  while (!isAttached && attempts < maxAttempts) {
    attempts++;
    // Scroll top window down by 400px to trigger scroll/intersection observers
    await this.page.evaluate(() => window.scrollBy(0, 400));
    await this.page.waitForTimeout(300);

    isAttached = (await frameElement.count()) > 0;
  }

  // Once attached, bring the iframe container into the viewport center
  if (isAttached) {
    await frameElement.scrollIntoViewIfNeeded().catch(() => {});
    await frameElement.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  } else {
    console.warn(`[IntentFlow] Warning: frameSelector "${this.uiEntry.frameSelector}" not attached after progressive scroll.`);
  }
}




  // Allows dynamic parameter updating prior to performing interactions
  public setParams(params?: StepParams): void {
    if (params) {
      this.params = params;
      this.locator = this.resolveTargetLocator(params);
    }
  }

  /**
   * Resolves locator taking universal container coordinates (anchorText) 
   * and scoped childWidget elements into account.
   */
  protected resolveTargetLocator(params?: StepParams): Locator {
    let baseLoc = resolveUiEntryLocator(this.page, this.uiEntry, undefined, params);

    // Apply universal anchor filter ONLY if NOT a table (TableControl handles row-level anchorText filtering)
    const isTableWidget = this.uiEntry.widgetType === 'WEB_TABLE' || this.uiEntry.widgetType === 'TABLE';
    if (params?.anchorText && !isTableWidget) {
      baseLoc = baseLoc.filter({ hasText: params.anchorText });
    }

    // Apply universal childWidget scoping if specified
    if (params?.childWidget) {
      baseLoc = resolveUiEntryLocator(this.page, this.uiEntry, params.childWidget, params);
    }

    return baseLoc;
  }

  // Helper for child controls to normalize scalar or array values
  protected toArray(val?: Scalar | Scalar[]): Scalar[] {
    if (val === undefined || val === null) return [];
    return Array.isArray(val) ? val : [val];
  }

  /**
   * Default Populate Implementation.
   * Override in child controls (e.g., TextBoxControl, SelectControl).
   */
  public async populate(value?: Scalar | Scalar[], params?: StepParams): Promise<void> {
    if (params) this.setParams(params);
    await this.ensureFrameReady();
    throw new Error(`[IntentFlow] 'populate' intent is not supported for control type ${this.constructor.name}.`);
  }

  /**
   * Universal Action Implementation.
   * Sub-intents (hover, dblClick, pressKey, clear) execute here; defaults to click.
   */
  public async action(params?: StepParams): Promise<void> {
    if (params) this.setParams(params);
    await this.ensureFrameReady();

    const subIntent: SubIntent = params?.subIntent || 'click';

    // Opt-in wait: Only pause for network idle if explicitly requested in YAML params
    if (params?.waitForNetwork) {
      await this.page.waitForLoadState('networkidle', { timeout: params?.timeout || 3000 }).catch(() => {});
    }

    await this.executeWithRetry(async () => {
      switch (subIntent) {
        case 'click':
          await this.locator.click({ force: params?.force, timeout: params?.timeout });
          break;

        case 'jsClick':
          // Dispatches native JS click directly on the underlying DOM node
          await this.locator.evaluate((element: HTMLElement) => element.click());
          break;

        case 'hover':
          await this.locator.hover({ force: params?.force, timeout: params?.timeout });
          break;

        case 'dblClick':
          await this.locator.dblclick({ force: params?.force, timeout: params?.timeout });
          break;

        case 'pressKey':
          if (typeof params?.value === 'string') {
            await this.locator.press(params.value);
          } else {
            throw new Error(`[IntentFlow] 'pressKey' subIntent requires a key string value in params.value.`);
          }
          break;

        case 'clear':
          await this.locator.clear({ force: params?.force, timeout: params?.timeout });
          break;

        default:
          await this.locator.click({ force: params?.force, timeout: params?.timeout });
          break;
      }
    });
  }

  /**
   * Standardized Verification Mechanism.
   * Handles equals, contains, and state assertions across scalar & array values.
   */
  public async verify(subIntent: SubIntent = 'equals', expectedValue?: Scalar | Scalar[], params?: StepParams): Promise<void> {
    if (params) this.setParams(params);
    await this.ensureFrameReady();

    const targetSubIntent = params?.subIntent || subIntent;
    const value = params?.value !== undefined ? params.value : expectedValue;

    switch (targetSubIntent) {
      case 'state': {
        const stateValue = String(value || 'visible').toLowerCase() as StateValue;
        switch (stateValue) {
          case 'visible':
            await expect(this.locator).toBeVisible();
            break;
          case 'hidden':
            await expect(this.locator).toBeHidden();
            break;
          case 'enabled':
            await expect(this.locator).toBeEnabled();
            break;
          case 'disabled':
            await expect(this.locator).toBeDisabled();
            break;
          default:
            throw new Error(`[IntentFlow] Unknown state value "${stateValue}". Allowed values: visible, hidden, enabled, disabled.`);
        }
        break;
      }

      case 'contains': {
        if (value === undefined) throw new Error(`[IntentFlow] Verification 'contains' requires an expected value.`);
        const valStr = String(value);
        await expect(this.locator).toContainText(valStr);
        break;
      }

      case 'equals':
      default: {
        if (value === undefined) throw new Error(`[IntentFlow] Verification 'equals' requires an expected value.`);
        const valStr = String(value);
        await expect(this.locator).toHaveText(valStr);
        break;
      }
    }
  }

  /**
   * Custom SDET Escape Hatch Handler Dispatcher.
   */
  public async executeCustomHandler(handlerName: string, params?: StepParams): Promise<void> {
    if (params) this.setParams(params);
    await this.ensureFrameReady();
    console.log(`[IntentFlow] Executing custom handler "${handlerName}" on control ${this.constructor.name}`);
  }

  // Returns primary value/text representation. Override in child controls as needed.
  public async getValue(): Promise<string> {
    await this.ensureFrameReady();
    return (await this.locator.innerText()).trim();
  }

  // Helper to fetch sub-locators for complex components
  public getSubLocator(key: string): Locator {
    return resolveUiEntryLocator(this.page, this.uiEntry, key, this.params);
  }

  // Resilience utility for flaky UI interactions
  protected async executeWithRetry<T>(action: () => Promise<T>, retries = 0): Promise<T> {
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