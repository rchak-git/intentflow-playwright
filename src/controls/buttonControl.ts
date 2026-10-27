import type { Page } from '@playwright/test';
import { BaseControl } from './baseControl';
import type { UiMapEntry } from '../types/uiMapTypes';
import type { ActionParams } from '../types/intentSchema';


export class ButtonControl extends BaseControl {
 constructor(page: Page, uiEntry: UiMapEntry, params?: ActionParams) {
    super(page, uiEntry, params);
  }

  // Populate is not supported on standard buttons
  public async populate(value: string): Promise<void> {
    throw new Error(`Populate intent is not supported on ButtonControl [${this.uiEntry.widgetType}].`);
  }
}