import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BaseControl } from './baseControl';
import type { UiMapEntry } from '../types/uiMapTypes';
import type { Assertion } from '../types/intentSchema';

export class TextBoxControl extends BaseControl {
  constructor(page: Page, uiEntry: UiMapEntry) {
    super(page, uiEntry);
  }

  public async populate(value: string): Promise<void> {
    await this.executeWithRetry(async () => {
      await this.locator.fill(value);
      await this.locator.blur();
    });
  }

  // Override getValue to capture input field value instead of innerText
  public override async getValue(): Promise<string> {
    return (await this.locator.inputValue()).trim();
  }

  public override async verify(assertion?: Assertion, expected?: string): Promise<void> {
    switch (assertion) {
      case 'TEXT_EQUALS':
        if (expected === undefined) throw new Error(`Assertion TEXT_EQUALS requires a value.`);
        await expect(this.locator).toHaveValue(expected);
        break;

      case 'CONTAIN_TEXT':
        if (expected === undefined) throw new Error(`Assertion CONTAIN_TEXT requires a value.`);
        await expect(this.locator).toHaveValue(new RegExp(expected));
        break;

      default:
        // Fall back to BaseControl for generic assertions (VISIBLE, NOT_VISIBLE, ENABLED, DISABLED)
        await super.verify(assertion, expected);
        break;
    }
  }
}