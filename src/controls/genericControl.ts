import type { Page } from '@playwright/test';
import { BaseControl } from './baseControl';
import type { UiMapEntry } from '../types/uiMapTypes';
import type { Assertion,ActionParams } from '../types/intentSchema';

export class GenericControl extends BaseControl {
 constructor(page: Page, uiEntry: UiMapEntry, params?: ActionParams) {
    super(page, uiEntry, params);
  }

  // Generic controls do not support populate
  public async populate(value: string): Promise<void> {
    throw new Error(`Populate intent is not supported on generic/read-only control [${this.uiEntry.widgetType}].`);
  }

  // Delegates verification directly to BaseControl
  public override async verify(assertion?: Assertion, expected?: string): Promise<void> {
    await super.verify(assertion, expected);
  }
}