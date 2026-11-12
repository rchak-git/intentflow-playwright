// src/controls/genericControl.ts
import type { Page } from '@playwright/test';
import { BaseControl } from './baseControl';
import type { UiMapEntry } from '../types/uiMapTypes';
import type { StepParams, Scalar } from '../types/intentSchema';

export class GenericControl extends BaseControl {
  constructor(page: Page, uiEntry: UiMapEntry, params?: StepParams) {
    super(page, uiEntry, params);
  }

  /**
   * Populate intent is explicitly unsupported on generic/read-only elements.
   */
  public override async populate(value?: Scalar | Scalar[], params?: StepParams): Promise<void> {
    if (params) this.setParams(params);
    throw new Error(`[IntentFlow] 'populate' intent is not supported on generic/read-only control [${this.uiEntry.widgetType}].`);
  }

  /**
   * Captures inner text representation using inherited BaseControl getValue().
   */
  public override async getValue(): Promise<string> {
    return super.getValue();
  }
}