// src/controls/buttonControl.ts
import type { Page } from '@playwright/test';
import { BaseControl } from './baseControl';
import type { UiMapEntry } from '../types/uiMapTypes';
import type { StepParams, Scalar } from '../types/intentSchema';

export class ButtonControl extends BaseControl {
  constructor(page: Page, uiEntry: UiMapEntry, params?: StepParams) {
    super(page, uiEntry, params);
  }

  /**
   * Populate intent is explicitly unsupported on Button controls.
   */
  public override async populate(value?: Scalar | Scalar[], params?: StepParams): Promise<void> {
    if (params) this.setParams(params);
    throw new Error(`[IntentFlow] 'populate' intent is not supported on ButtonControl [${this.uiEntry.widgetType}].`);
  }

  /**
   * Captures button label/text using inherited BaseControl getValue().
   */
  public override async getValue(): Promise<string> {
    return super.getValue();
  }
}