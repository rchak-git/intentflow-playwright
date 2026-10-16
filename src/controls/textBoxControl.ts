import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BaseControl } from './baseControl';
import type { UiMapEntry } from '../types/uiMapTypes';

export class TextBoxControl extends BaseControl {
    constructor(page: Page, uiEntry: UiMapEntry) {
        super(page, uiEntry);
    }

    public async populate(value: string): Promise<void> {
        await this.executeWithRetry(async () => {
            await this.locator.fill(value);
        });
    }

    public async click(): Promise<void> {
        await this.executeWithRetry(async () => {
            await this.locator.click();
        });
    }

    public async verify(assertion: string, expected?: string): Promise<void> {
        switch (assertion) {
            case 'TEXT_EQUALS':
                if (expected === undefined) throw new Error(`Assertion TEXT_EQUALS requires a value.`);
                await expect(this.locator).toHaveText(expected);
                break;
            case 'CONTAIN_TEXT':
                if (expected === undefined) throw new Error(`Assertion CONTAIN_TEXT requires a value.`);
                await expect(this.locator).toContainText(expected);
                break;
            default:
                // Fall back to BaseControl for standard assertions (VISIBLE, HIDDEN, ENABLED, DISABLED)
                await super.verify(assertion, expected);
                break;
        }
    }
}