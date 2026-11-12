// src/controls/pageControl.ts
import { expect, Page } from '@playwright/test';
import { BaseControl } from './baseControl';
import type { UiMapEntry } from '../types/uiMapTypes';
import type { StepParams, SubIntent, Scalar } from '../types/intentSchema';

export class PageControl extends BaseControl {
  constructor(page: Page, uiEntry: UiMapEntry, params?: StepParams) {
    super(page, uiEntry, params);
  }

  /**
   * Populate is not supported on page-level target.
   */
  public override async populate(value?: Scalar | Scalar[], params?: StepParams): Promise<void> {
    if (params) this.setParams(params);
    throw new Error(`[IntentFlow] 'populate' intent is not supported at Page level.`);
  }

  /**
   * Overrides getValue to return page title or current URL depending on subIntent.
   */
  public override async getValue(): Promise<string> {
    const subIntent = this.params?.subIntent;
    if (subIntent === 'state' || subIntent === 'equals') {
      return this.page.url();
    }
    return await this.page.title();
  }

  /**
   * Page-level assertion engine called via fieldKey: 'page'.
   * Supports URL, Title, and Body text assertions using canonical subIntents,
   * while trapping body locator timeouts to prevent full DOM text dumping in error reports.
   */
  public async verifyPageLevel(subIntent: SubIntent | string = 'equals', expectedValue?: Scalar | Scalar[]): Promise<void> {
    const targetSubIntent = (this.params?.subIntent || subIntent) as string;
    const rawVal = this.params?.value !== undefined ? this.params.value : expectedValue;
    const valStr = rawVal !== undefined ? String(rawVal) : undefined;

    switch (targetSubIntent) {
      case 'contains': {
        if (!valStr) throw new Error(`[IntentFlow] Page verification 'contains' requires an expected value.`);

        // Smart route routing: If value is a path (/login/...) or absolute URL, assert URL pattern
        if (valStr.startsWith('/') || valStr.startsWith('http')) {
          await expect(this.page).toHaveURL(new RegExp(valStr));
          return;
        }

        // Body text verification with clean error boundary to prevent Playwright DOM sprawl
        try {
          await expect(this.page.locator('body')).toContainText(valStr, { timeout: 10000 });
        } catch (error) {
          const currentUrl = this.page.url();
          throw new Error(
            `[IntentFlow] Page verification failed for subIntent 'contains'.\n` +
            `  Expected text: "${valStr}"\n` +
            `  Current URL: ${currentUrl}\n` +
            `  Detail: Text was not found on page within 10s timeout.`
          );
        }
        break;
      }

      case 'equals':
        if (!valStr) throw new Error(`[IntentFlow] Page verification 'equals' requires an expected value.`);
        await expect(this.page).toHaveURL(valStr);
        break;

      case 'titleEquals':
      case 'title_equals':
        if (!valStr) throw new Error(`[IntentFlow] Page verification 'titleEquals' requires an expected value.`);
        await expect(this.page).toHaveTitle(valStr);
        break;

      case 'urlContains':
      case 'url_contains':
        if (!valStr) throw new Error(`[IntentFlow] Page verification 'urlContains' requires an expected value.`);
        await expect(this.page).toHaveURL(new RegExp(valStr));
        break;

      default:
        if (valStr) {
          await expect(this.page).toHaveURL(valStr);
        } else {
          throw new Error(`[IntentFlow] Unsupported page-level subIntent "${targetSubIntent}".`);
        }
        break;
    }
  }

  /**
   * Direct verify override delegating to verifyPageLevel.
   */
  public override async verify(subIntent: SubIntent = 'equals', expectedValue?: Scalar | Scalar[], params?: StepParams): Promise<void> {
    if (params) this.setParams(params);
    await this.verifyPageLevel(subIntent, expectedValue);
  }
}