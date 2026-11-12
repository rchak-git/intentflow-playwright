// src/controls/checkboxControl.ts
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BaseControl } from './baseControl';
import type { UiMapEntry } from '../types/uiMapTypes';
import type { StepParams, SubIntent, Scalar } from '../types/intentSchema';

export class CheckboxControl extends BaseControl {
  constructor(page: Page, uiEntry: UiMapEntry, params?: StepParams) {
    super(page, uiEntry, params);
  }

  /**
   * Populates checkbox state.
   * Handles value directives like true/false, 'true'/'false', 'on'/'off', 'check'/'uncheck'.
   */
  public override async populate(value?: Scalar | Scalar[], params?: StepParams): Promise<void> {
    if (params) this.setParams(params);

    const targetParams = params || this.params;
    const rawVal = value !== undefined ? value : targetParams?.value;
    const targetState = this.normalizeBooleanState(rawVal);

    if (targetState === undefined) {
      throw new Error(`[IntentFlow] CheckboxControl populate requires a boolean, 'true'/'false', 'on'/'off', or 'check'/'uncheck' value.`);
    }

    await this.executeWithRetry(async () => {
      await this.setCheckboxState(targetState, targetParams);
    });
  }

  /**
   * Action intent implementation for toggling or explicit interaction.
   * Uses subIntent 'toggle' by default if no explicit state value is provided.
   */
  public override async action(params?: StepParams): Promise<void> {
    if (params) this.setParams(params);

    const targetParams = params || this.params;
    const subIntent: SubIntent = targetParams?.subIntent || 'click';
    const targetState = this.normalizeBooleanState(targetParams?.value);

    await this.executeWithRetry(async () => {
      if (targetState !== undefined) {
        await this.setCheckboxState(targetState, targetParams);
      } else if (subIntent === 'toggle' || subIntent === 'click') {
        await this.locator.click({ force: targetParams?.force, timeout: targetParams?.timeout });
      } else {
        await super.action(targetParams);
      }
    });
  }

  /**
   * Overrides getValue to return 'true' or 'false' boolean string representation.
   */
  public override async getValue(): Promise<string> {
    const isChecked = await this.readIsChecked();
    return String(isChecked);
  }

  /**
   * Overrides verify to handle boolean check states ('equals'/'state' -> true/false).
   */
  public override async verify(
    subIntent: SubIntent = 'equals',
    expectedValue?: Scalar | Scalar[],
    params?: StepParams
  ): Promise<void> {
    if (params) this.setParams(params);

    const targetSubIntent = params?.subIntent || subIntent;
    const rawVal = params?.value !== undefined ? params.value : expectedValue;

    // Delegate generic state assertions (visible, hidden, enabled, disabled) to BaseControl
    if (targetSubIntent === 'state') {
      const stateStr = String(rawVal || '').toLowerCase();
      if (['visible', 'hidden', 'enabled', 'disabled'].includes(stateStr)) {
        await super.verify(subIntent, expectedValue, params);
        return;
      }
    }

    const expectedState = this.normalizeBooleanState(rawVal);
    if (expectedState === undefined) {
      throw new Error(`[IntentFlow] CheckboxControl verification requires a boolean, 'true'/'false', or 'check'/'uncheck' expected value.`);
    }

    if (expectedState) {
      await expect(this.locator).toBeChecked();
    } else {
      await expect(this.locator).not.toBeChecked();
    }
  }

  /**
   * Internal helper to set checkbox state with fallbacks for custom ARIA inputs.
   */
  private async setCheckboxState(targetState: boolean, params?: StepParams): Promise<void> {
    const isChecked = await this.readIsChecked();

    if (targetState && !isChecked) {
      await this.locator.check({ force: params?.force, timeout: params?.timeout }).catch(async () => {
        await this.locator.click({ force: params?.force, timeout: params?.timeout });
      });
    } else if (!targetState && isChecked) {
      await this.locator.uncheck({ force: params?.force, timeout: params?.timeout }).catch(async () => {
        await this.locator.click({ force: params?.force, timeout: params?.timeout });
      });
    }
  }

  /**
   * Internal helper to read checked status with ARIA fallback.
   */
  private async readIsChecked(): Promise<boolean> {
    return await this.locator.isChecked().catch(async () => {
      const ariaChecked = await this.locator.getAttribute('aria-checked');
      return ariaChecked === 'true';
    });
  }

  /**
   * Normalizes loose boolean/string inputs into boolean flags.
   */
  private normalizeBooleanState(val?: any): boolean | undefined {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') {
      const normalized = val.trim().toLowerCase();
      if (['on', 'true', 'check', 'checked', '1'].includes(normalized)) return true;
      if (['off', 'false', 'uncheck', 'unchecked', '0'].includes(normalized)) return false;
    }
    return undefined;
  }
}