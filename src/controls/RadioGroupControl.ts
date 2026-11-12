import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { BaseControl } from './baseControl';
import type { UiMapEntry } from '../types/uiMapTypes';
import type { StepParams, SubIntent, Scalar } from '../types/intentSchema';

export class RadioGroupControl extends BaseControl {
  constructor(page: Page, uiEntry: UiMapEntry, params?: StepParams) {
    super(page, uiEntry, params);
  }

  private getSelector(): string {
    if (!this.uiEntry.selector) {
      throw new Error(`[RadioGroupControl] Missing required 'selector' in UI map entry for control '${this.constructor.name}'.`);
    }
    return this.uiEntry.selector;
  }

  public override async populate(value?: Scalar | Scalar[], params?: StepParams): Promise<void> {
    if (params) this.setParams(params);
    await this.ensureFrameReady();

    const targetVal = params?.value !== undefined ? params.value : value;
    if (targetVal === undefined || targetVal === null) {
      throw new Error(`[RadioGroupControl] 'populate' intent requires a value parameter.`);
    }

    const valStr = String(targetVal).trim();
    const group = this.page.locator(this.getSelector()).first();

    // 1. Target by input value attribute
    const valueMatch = group.locator(`input[value="${valStr}" i], [value="${valStr}" i]`).first();
    if ((await valueMatch.count()) > 0) {
      await valueMatch.check({ force: true });
      return;
    }

    // 2. Target by text content / ARIA label within options
    const labelOrOptionMatch = group
      .locator('mat-radio-button, [role="radio"], label, .mdc-label')
      .filter({ hasText: new RegExp(`^${valStr}$`, 'i') })
      .first();

    if ((await labelOrOptionMatch.count()) > 0) {
      await labelOrOptionMatch.click({ force: true });
      return;
    }

    // 3. Fallback flexible match
    const flexibleMatch = group
      .locator('mat-radio-button, [role="radio"], label, .mdc-label')
      .filter({ hasText: new RegExp(valStr, 'i') })
      .first();

    if ((await flexibleMatch.count()) > 0) {
      await flexibleMatch.click({ force: true });
      return;
    }

    throw new Error(`[RadioGroupControl] Could not find radio option matching value or label: "${valStr}" in group '${this.getSelector()}'`);
  }

  public override async verify(
    subIntent: SubIntent = 'equals',
    expectedValue?: Scalar | Scalar[],
    params?: StepParams
  ): Promise<void> {
    if (params) this.setParams(params);
    await this.ensureFrameReady();

    const targetSubIntent = (params?.subIntent || subIntent) as string;
    const value = params?.value !== undefined ? params.value : expectedValue;
    const groupSelector = this.getSelector();
    const group = this.page.locator(groupSelector).first();

    switch (targetSubIntent) {
      case 'equals':
      case 'contains': {
        if (value === undefined || value === null) {
          throw new Error(`[RadioGroupControl] Verification '${targetSubIntent}' requires an expected value.`);
        }

        // Target checked radio across Angular Material and native inputs
        const checkedRadio = group
          .locator('mat-radio-button.mat-mdc-radio-checked, mat-radio-button[aria-checked="true"], mat-radio-button:has(input:checked), [role="radio"][aria-checked="true"], input[type="radio"]:checked')
          .first();

        // Wait for Angular ngModel hydration
        try {
          await checkedRadio.waitFor({ state: 'attached', timeout: 5000 });
        } catch (e) {
          throw new Error(`[RadioGroupControl] Verification failed: No radio option is checked in group '${groupSelector}'.`);
        }

        const labelElement = checkedRadio.locator('.mdc-label, label').first();
        let actualText = '';

        if ((await labelElement.count()) > 0) {
          actualText = (await labelElement.innerText()).trim();
        } else {
          actualText = (await checkedRadio.innerText()).trim();
        }

        if (!actualText) {
          actualText = (await checkedRadio.locator('input').getAttribute('value')) || '';
        }

        const expectedStr = String(value).trim();

        if (targetSubIntent === 'equals') {
          expect(actualText.toLowerCase()).toBe(expectedStr.toLowerCase());
        } else {
          expect(actualText.toLowerCase()).toContain(expectedStr.toLowerCase());
        }
        break;
      }

      case 'optionsContains': {
        if (value === undefined || value === null) {
          throw new Error(`[RadioGroupControl] Verification 'optionsContains' requires an expected value.`);
        }

        const expectedStr = String(value).trim();
        const textOption = group
          .locator('mat-radio-button, [role="radio"], label, .mdc-label')
          .filter({ hasText: new RegExp(expectedStr, 'i') });

        const valueOption = group.locator(`[value="${expectedStr}" i]`);
        const targetOption = textOption.or(valueOption).first();

        await targetOption.waitFor({ state: 'visible', timeout: 5000 });
        await expect(targetOption).toBeVisible();
        break;
      }

      default:
        await super.verify(subIntent, expectedValue, params);
        break;
    }
  }

  public override async action(params?: StepParams): Promise<void> {
    if (params) this.setParams(params);
    await this.ensureFrameReady();

    const subIntent = params?.subIntent || 'click';

    switch (subIntent as string) {
      case 'select': {
        if (params?.value === undefined) {
          throw new Error(`[RadioGroupControl] Action 'select' requires a 'value' parameter in params.`);
        }
        await this.populate(params.value, params);
        break;
      }

      default:
        await super.action(params);
        break;
    }
  }
}