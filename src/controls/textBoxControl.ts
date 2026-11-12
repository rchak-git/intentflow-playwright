// src/controls/textBoxControl.ts
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BaseControl } from './baseControl';
import type { UiMapEntry } from '../types/uiMapTypes';
import type { StepParams, SubIntent, Scalar } from '../types/intentSchema';

export class TextBoxControl extends BaseControl {
  constructor(page: Page, uiEntry: UiMapEntry, params?: StepParams) {
    super(page, uiEntry, params);
  }

  /**
   * Populates input control.
   * Handles subIntent 'setValue' (default) and 'append'.
   */
  public override async populate(value?: Scalar | Scalar[], params?: StepParams): Promise<void> {
    if (params) this.setParams(params);

    const targetParams = params || this.params;
    const subIntent: SubIntent = targetParams?.subIntent || 'setValue';
    const textToFill = String(value !== undefined ? value : targetParams?.value ?? '');

    await this.executeWithRetry(async () => {
      if (subIntent === 'append') {
        // Append text to existing value without clearing
        const currentValue = await this.locator.inputValue();
        await this.locator.fill(currentValue + textToFill, { timeout: targetParams?.timeout });
      } else {
        // Standard setValue (clears input and fills text)
        await this.locator.fill(textToFill, { timeout: targetParams?.timeout });
      }
    });
  }

  /**
   * Overrides getValue to extract input field value rather than DOM innerText.
   */
  public override async getValue(): Promise<string> {
    return (await this.locator.inputValue()).trim();
  }

  /**
   * Overrides verify to check input values via toHaveValue() instead of toHaveText().
   */
  public override async verify(subIntent: SubIntent = 'equals', expectedValue?: Scalar | Scalar[], params?: StepParams): Promise<void> {
    if (params) this.setParams(params);

    const targetSubIntent = params?.subIntent || subIntent;
    const rawVal = params?.value !== undefined ? params.value : expectedValue;

    // Delegate 'state' checks directly to BaseControl (visible, hidden, enabled, disabled)
    if (targetSubIntent === 'state') {
      await super.verify(subIntent, expectedValue, params);
      return;
    }

    if (rawVal === undefined) {
      throw new Error(`[IntentFlow] TextBox verification '${targetSubIntent}' requires an expected value.`);
    }

    const valStr = String(rawVal);

    switch (targetSubIntent) {
    case 'contains': {
  const targetLocator = this.locator.first(); // Use .first() to prevent strict mode violations if multiple containers exist
  
  // Try checking inner/visible text first for div/span elements, falling back to input value
  const tagName = await targetLocator.evaluate(el => el.tagName.toLowerCase());
  
  if (tagName === 'input' || tagName === 'textarea') {
    await expect(targetLocator).toHaveValue(new RegExp(valStr, 'i'));
  } else {
    await expect(targetLocator).toContainText(valStr);
  }
  break;
}

      case 'equals':
      default:
        await expect(this.locator).toHaveValue(valStr);
        break;
    }
  }
}