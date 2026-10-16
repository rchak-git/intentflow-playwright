import type { Page } from '@playwright/test';
import { BaseControl } from './baseControl';
import type { UiMapEntry } from '../types/uiMapTypes';

export class ButtonControl extends BaseControl {
    constructor(page: Page, uiEntry: UiMapEntry) {
        super(page, uiEntry);
    }

    public async click(): Promise<void> {
        await this.executeWithRetry(async () => {
            await this.locator.click();
        });
    }
}