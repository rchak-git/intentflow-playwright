import type { Page } from '@playwright/test';
import { BaseControl } from './baseControl';
import type { UiMapEntry } from '../types/uiMapTypes';

export class ButtonControl extends BaseControl {
  constructor(page: Page, uiEntry: UiMapEntry) {
    super(page, uiEntry);
  }

  // Populate is not supported on standard buttons
  public async populate(value: string): Promise<void> {
    throw new Error(`Populate intent is not supported on ButtonControl [${this.uiEntry.widgetType}].`);
  }
}