// src/controls/customSelectControl.ts

import { BaseControl } from './baseControl';
import { Locator, expect } from '@playwright/test';
import type { StepParams, SubIntent, Scalar } from '../types/intentSchema';
import type { CustomSelectUiMapEntry } from '../types/uiMapTypes';

export class CustomSelectControl extends BaseControl {
  declare protected uiEntry: CustomSelectUiMapEntry;

  /**
   * Resolves the click trigger element safely across Angular and React controls.
   */
  private getTriggerLocator(): Locator {
    const base = this.locator.first();
    // Targets Angular MDC trigger OR React combobox inputs/buttons
    const triggerChild = base.locator('.mat-mdc-select-trigger, .react-select__control, [role="combobox"]').first();
    return triggerChild;
  }

  /**
   * Scopes option items inside active/visible portal containers.
   */
  private getOptionLocator(optionText: string): Locator {
    const subSelectors = this.uiEntry.subSelectors;
    const optionCss = subSelectors?.option || 'mat-option, [role="option"], .react-select__option, li';
    const overlayCss = subSelectors?.overlayPanel || '.cdk-overlay-container, .cdk-overlay-pane, [role="listbox"], .react-select__menu';

    return this.page
      .locator(overlayCss)
      .locator(optionCss)
      .filter({ hasText: optionText })
      .first();
  }

  /**
   * Evaluates if an active, visible option listbox exists in the DOM overlay.
   */
  private async isPanelOpen(): Promise<boolean> {
    const overlayCss = this.uiEntry.subSelectors?.overlayPanel || '.cdk-overlay-container, .cdk-overlay-pane, [role="listbox"], .react-select__menu';
    const optionCss = this.uiEntry.subSelectors?.option || 'mat-option, [role="option"], .react-select__option';
    
    const visibleOption = this.page.locator(`${overlayCss} ${optionCss}`).first();
    return await visibleOption.isVisible().catch(() => false);
  }

  /**
   * Clicks the trigger element safely to open the overlay.
   */
  private async clickTrigger(params?: StepParams): Promise<void> {
    const baseLocator = this.locator.first();
    const trigger = this.getTriggerLocator();
    const count = await trigger.count().catch(() => 0);
    const target = count > 0 ? trigger : baseLocator;

    await target.scrollIntoViewIfNeeded().catch(() => {});
    await target.click({ force: params?.force, timeout: params?.timeout || 5000 });
  }

  /**
   * Handles the 'POPULATE' verb: Opens panel & selects specified value option.
   */
  public override async populate(value?: Scalar | Scalar[], params?: StepParams): Promise<void> {
    if (params) this.setParams(params);
    const targetParams = params || this.params;
    const rawVal = targetParams?.value !== undefined ? targetParams.value : value;
    const optionToSelect = rawVal !== undefined ? String(rawVal) : '';

    await this.executeWithRetry(async () => {
      await this.ensureFrameReady();

      const isOpen = await this.isPanelOpen();
      if (!isOpen) {
        await this.clickTrigger(targetParams);
      }

      if (optionToSelect) {
        const optionLocator = this.getOptionLocator(optionToSelect);
        await optionLocator.waitFor({ state: 'visible', timeout: targetParams?.timeout || 10000 });
        await optionLocator.scrollIntoViewIfNeeded().catch(() => {});
        await optionLocator.click({ force: targetParams?.force, timeout: targetParams?.timeout });
      }
    });
  }

  /**
   * Handles generic 'ACTION' verbs & explicit sub-intents ('open' / 'close').
   */
  public override async action(params?: StepParams): Promise<void> {
    if (params) this.setParams(params);
    const targetParams = params || this.params;
    const subIntent = targetParams?.subIntent as SubIntent;

    if (subIntent === 'open' || subIntent === 'close') {
      await this.executeSubIntent(subIntent, targetParams);
      return;
    }

    await this.executeWithRetry(async () => {
      await this.ensureFrameReady();
      await this.clickTrigger(targetParams);
    });
  }

  /**
   * Execution logic for explicit 'open' and 'close' sub-intents.
   */
  public async executeSubIntent(subIntent: SubIntent, params?: StepParams): Promise<void> {
    if (params) this.setParams(params);
    const targetParams = params || this.params;

    await this.executeWithRetry(async () => {
      await this.ensureFrameReady();

      switch (subIntent) {
        case 'open': {
          const isOpen = await this.isPanelOpen();
          if (!isOpen) {
            await this.clickTrigger(targetParams);
            const overlayCss = this.uiEntry.subSelectors?.overlayPanel || '.cdk-overlay-container, [role="listbox"], .react-select__menu';
            const optionCss = this.uiEntry.subSelectors?.option || 'mat-option, [role="option"], .react-select__option';
            await this.page
              .locator(`${overlayCss} ${optionCss}`)
              .first()
              .waitFor({ state: 'visible', timeout: targetParams?.timeout || 5000 });
          }
          break;
        }

        case 'close': {
          const isOpen = await this.isPanelOpen();
          if (isOpen) {
            await this.page.keyboard.press('Escape');
            await this.page.waitForTimeout(300);
          }
          break;
        }

        default:
          throw new Error(`[CustomSelectControl] Unsupported action subIntent: '${subIntent}'`);
      }
    });
  }

  /**
   * Verifies the selected value or option menu states.
   */
  public override async verify(
    subIntent: SubIntent = 'contains',
    expectedValue?: Scalar | Scalar[],
    params?: StepParams
  ): Promise<void> {
    if (params) this.setParams(params);
    const targetParams = params || this.params;
    const rawVal = targetParams?.value !== undefined ? targetParams.value : expectedValue;
    const expectedStr = rawVal !== undefined ? String(rawVal) : '';

    await this.executeWithRetry(async () => {
      await this.ensureFrameReady();

      switch (subIntent) {
        case 'contains':
        case 'equals': {
          // Checks Angular MDC value, react-select single-value container, or falls back to host
          const valueContainer = this.locator.first().locator('.mat-mdc-select-value, .react-select__single-value, .mat-select-value').first();
          const target = (await valueContainer.count()) > 0 ? valueContainer : this.locator.first();
          await expect(target).toContainText(expectedStr, { timeout: targetParams?.timeout });
          break;
        }

        case 'optionsContains': {
          const isOpen = await this.isPanelOpen();
          if (!isOpen) {
            await this.clickTrigger(targetParams);
          }

          const optionLocator = this.getOptionLocator(expectedStr);
          await optionLocator.waitFor({ state: 'visible', timeout: targetParams?.timeout || 10000 });
          await expect(optionLocator).toBeVisible({ timeout: targetParams?.timeout });
          break;
        }

        case 'state': {
          const stateVal = String(rawVal).toLowerCase();
          const target = this.locator.first();
          if (stateVal === 'visible') await expect(target).toBeVisible();
          if (stateVal === 'hidden') await expect(target).toBeHidden();
          if (stateVal === 'enabled') await expect(target).toBeEnabled();
          if (stateVal === 'disabled') await expect(target).toBeDisabled();
          break;
        }

        default: {
          const valueContainer = this.locator.first().locator('.mat-mdc-select-value, .react-select__single-value, .mat-select-value').first();
          const target = (await valueContainer.count()) > 0 ? valueContainer : this.locator.first();
          await expect(target).toContainText(expectedStr, { timeout: targetParams?.timeout });
        }
      }
    });
  }

  /**
   * Extracts the currently selected option display text.
   */
  public override async getValue(): Promise<string> {
    await this.ensureFrameReady();
    return (await this.locator.first().innerText()).trim();
  }
}