// src/controls/selectControl.ts
import { test, expect, Page } from '@playwright/test';
import { BaseControl } from './baseControl';
import type { StepParams, Scalar } from '../types/intentSchema';
import { SELECT_CONTROL_DEFAULTS } from '../config/controlDefaults';

export class SelectControl extends BaseControl {
  /**
   * Helper guard to determine if a dropdown is disabled via standard HTML,
   * ARIA states, or UI framework CSS classes.
   */
  private async checkIsDisabled(): Promise<boolean> {
    const nativeDisabled = await this.locator.isDisabled();
    const ariaDisabled = (await this.locator.getAttribute('aria-disabled')) === 'true';
    const classAttr = await this.locator.getAttribute('class');
    const classDisabled = classAttr?.split(/\s+/).includes('disabled') ?? false;

    return nativeDisabled || ariaDisabled || classDisabled;
  }

  /**
   * Selects an option in a standard <select> dropdown, automatically polling
   * until the dropdown transitions out of any disabled state.
   */
  public override async populate(value?: Scalar | Scalar[], params?: StepParams): Promise<void> {
    if (params) this.setParams(params);
    const targetParams = params || this.params;
    const rawValue = String(value !== undefined ? value : targetParams?.value ?? '').trim();

    await this.executeWithRetry(async () => {
      // 1. Internal Actionability Guard: Wait for Moodle client-side JS to un-disable the dropdown
      const timeout = targetParams?.timeout || 10000;
      const startTime = Date.now();

      while (await this.checkIsDisabled()) {
        if (Date.now() - startTime > timeout) {
          throw new Error(`[IntentFlow] Dropdown [${this.uiEntry.selector}] remained disabled after ${timeout}ms.`);
        }
        await this.page.waitForTimeout(100); // Poll every 100ms
      }

      // 2. Try direct visible text (Label) matching
      try {
        await this.locator.selectOption({ label: rawValue }, { timeout: 2000 });
        return;
      } catch {
        // Fall back to next strategy
      }

      // 3. Try direct value attribute matching
      try {
        await this.locator.selectOption({ value: rawValue }, { timeout: 2000 });
        return;
      } catch {
        // Fall back to DOM option search
      }

      // 4. Fallback: Search nested <option> elements by partial text/value match
      const optionSelector = SELECT_CONTROL_DEFAULTS.optionSelector || 'option';
      const options = this.locator.locator(optionSelector);
      const count = await options.count();

      for (let i = 0; i < count; i++) {
        const text = (await options.nth(i).innerText()).trim();
        const optValue = await options.nth(i).getAttribute('value');

        if (
          (text && text.toLowerCase().includes(rawValue.toLowerCase())) ||
          (optValue && optValue.toLowerCase().includes(rawValue.toLowerCase()))
        ) {
          const matchedValue = optValue !== null ? optValue : text;
          await this.locator.selectOption(matchedValue, { timeout: 3000 });
          return;
        }
      }

      throw new Error(`[IntentFlow] Could not find option matching "${rawValue}" in dropdown [${this.uiEntry.selector}].`);
    });
  }

  /**
   * Verifies the state, value, or visible label of the dropdown element.
   */
  /**
   * Verifies the state, value, or visible label of the dropdown element.
   */
  public override async verify(
    subIntent: string = 'equals',
    expectedValue?: Scalar | Scalar[],
    params?: StepParams
  ): Promise<void> {
    if (params) this.setParams(params);
    const targetParams = params || this.params;
    const expected = String(expectedValue !== undefined ? expectedValue : targetParams?.value ?? '').trim();

    await this.executeWithRetry(async () => {
      switch (subIntent.toLowerCase()) {
        case 'equals':
        case 'value': {
          // Checks if the selected value or visible text equals expected
          const selectedVal = await this.getValue();
          const selectedText = await this.getSelectedOptionText();
          
          const matchesValue = selectedVal === expected;
          const matchesText = selectedText.toLowerCase().includes(expected.toLowerCase());
          
          expect(
            matchesValue || matchesText, 
            `[IntentFlow] Expected dropdown [${this.uiEntry.selector}] selection to match "${expected}", but got value="${selectedVal}", text="${selectedText}"`
          ).toBeTruthy();
          break;
        }

        case 'enabled':
          expect(await this.checkIsDisabled(), `[IntentFlow] Expected dropdown [${this.uiEntry.selector}] to be enabled.`).toBeFalsy();
          break;

        case 'disabled':
          expect(await this.checkIsDisabled(), `[IntentFlow] Expected dropdown [${this.uiEntry.selector}] to be disabled.`).toBeTruthy();
          break;

        default:
          await super.verify(subIntent as any, expectedValue, targetParams);
      }
    });
  }
  

  /**
   * Retrieves the HTML value attribute of the currently selected option.
   */
  public override async getValue(): Promise<string> {
    return (await this.locator.inputValue()).trim();
  }

  /**
   * Retrieves the visible inner text of the currently selected option.
   */
  public async getSelectedOptionText(): Promise<string> {
    return (await this.locator.evaluate((el: HTMLSelectElement) => {
      return el.options[el.selectedIndex]?.text ?? '';
    })).trim();
  }
}