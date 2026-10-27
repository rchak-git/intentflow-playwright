import { expect, Page } from '@playwright/test';
import type { UiMapEntry } from '../types/uiMapTypes';
import { unknown } from 'zod';
import { BaseControl } from './baseControl';
import type { Assertion, ActionParams } from '../types/intentSchema';

export class PageControl extends BaseControl {
 
constructor(page: Page, uiEntry: UiMapEntry, params?: ActionParams) {
    super(page, uiEntry, params);
  }

  public async verifyPageLevel(assertion: string, expectedValue?: string): Promise<void> {
    switch (assertion) {
      case 'CONTAIN_TEXT':
      case 'CONTAINS_TEXT':
        if (!expectedValue) {
          throw new Error(`Assertion "${assertion}" requires an expected string value.`);
        }
        // Checks whether text exists anywhere within the entire page body
        await expect(this.page.locator('body')).toContainText(expectedValue);
        break;

      case 'EQUALS':
        if (!expectedValue) {
          throw new Error(`Assertion "${assertion}" requires an expected string value.`);
        }
        await expect(this.page).toHaveURL(expectedValue);
        break;
      case 'TITLE_EQUALS':
        if (!expectedValue) throw new Error('Assertion TITLE_EQUALS requires expected string value.');
        await expect(this.page).toHaveTitle(expectedValue);
        break;

      case 'URL_CONTAINS':
        if (!expectedValue) throw new Error('Assertion URL_CONTAINS requires expected string value.');
        await expect(this.page).toHaveURL(new RegExp(expectedValue));
        break;
      default:
        throw new Error(`Unsupported page-level assertion "${assertion}".`);
    }
  }
}