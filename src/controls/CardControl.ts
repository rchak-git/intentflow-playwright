import { BaseControl } from './baseControl';
import { Locator, expect } from '@playwright/test';
import type { StepParams, SubIntent, Scalar } from '../types/intentSchema';

export class CardControl extends BaseControl {
  /**
   * Resolves the target card container (optionally inside frameSelector)
   * and scopes down to the requested childWidget subSelector.
   */
  private getCardLocator(params?: StepParams): Locator {
    const anchorText = params?.anchorText || this.params?.anchorText;
    const childWidget = params?.childWidget || this.params?.childWidget;

    const rootScope =
      'frameSelector' in this.uiEntry && this.uiEntry.frameSelector
        ? this.page.frameLocator(this.uiEntry.frameSelector)
        : this.page;

    let cardContainer =
      'selector' in this.uiEntry && this.uiEntry.selector
        ? rootScope.locator(this.uiEntry.selector)
        : this.locator;

    if (anchorText) {
      cardContainer = cardContainer.filter({ hasText: anchorText });
    }

    if (childWidget && 'subSelectors' in this.uiEntry && this.uiEntry.subSelectors?.[childWidget]) {
      return cardContainer.locator(this.uiEntry.subSelectors[childWidget]);
    }

    return cardContainer;
  }

  public override async action(params?: StepParams): Promise<void> {
    if (params) this.setParams(params);
    const targetParams = params || this.params;
    const rawSubIntent: SubIntent = targetParams?.subIntent || 'click';
    const targetLocator = this.getCardLocator(targetParams);

    switch (rawSubIntent) {
      case 'click':
      case 'clickSubControl':
        await targetLocator.click({
          force: targetParams?.force,
          timeout: targetParams?.timeout,
        });
        break;

      case 'dblClick':
        await targetLocator.dblclick({
          force: targetParams?.force,
          timeout: targetParams?.timeout,
        });
        break;

      case 'hover':
        await targetLocator.hover({
          force: targetParams?.force,
          timeout: targetParams?.timeout,
        });
        break;

      case 'jsClick':
        await targetLocator.evaluate((el) => (el as HTMLElement).click());
        break;

      default: {
        const originalLocator = this.locator;
        try {
          this.locator = targetLocator;
          await super.action({ ...targetParams, subIntent: rawSubIntent });
        } finally {
          this.locator = originalLocator;
        }
        break;
      }
    }
  }

  public override async verify(
    subIntent: SubIntent = 'contains',
    expectedValue?: Scalar | Scalar[],
    params?: StepParams
  ): Promise<void> {
    if (params) this.setParams(params);
    const targetParams = params || this.params;
    const targetSubIntent = targetParams?.subIntent || subIntent;
    const targetLocator = this.getCardLocator(targetParams);
    const rawVal = targetParams?.value !== undefined ? targetParams.value : expectedValue;
    const expectedStr = rawVal !== undefined ? String(rawVal) : '';

    switch (targetSubIntent) {
      case 'count':
        await expect(targetLocator).toHaveCount(Number(rawVal), {
          timeout: targetParams?.timeout,
        });
        break;

      case 'state': {
        const stateStr = String(rawVal ?? 'visible').toLowerCase();
        // Check the first card when no anchorText is specified to avoid strict-mode errors on multi-card grids
        const stateTarget = targetParams?.anchorText ? targetLocator : targetLocator.first();

        if (stateStr === 'visible' || stateStr === 'true') {
          await expect(stateTarget).toBeVisible({ timeout: targetParams?.timeout });
        } else if (stateStr === 'hidden' || stateStr === 'false') {
          await expect(stateTarget).toBeHidden({ timeout: targetParams?.timeout });
        } else if (stateStr === 'enabled') {
          await expect(stateTarget).toBeEnabled({ timeout: targetParams?.timeout });
        } else if (stateStr === 'disabled') {
          await expect(stateTarget).toBeDisabled({ timeout: targetParams?.timeout });
        } else {
          throw new Error(`[IntentFlow] Unsupported card state assertion: '${rawVal}'`);
        }
        break;
      }

      case 'equals':
        await expect(targetLocator).toHaveText(expectedStr, { timeout: targetParams?.timeout });
        break;

      case 'contains':
      default:
        await expect(targetLocator).toContainText(expectedStr, { timeout: targetParams?.timeout });
        break;
    }
  }

  public override async getValue(): Promise<string> {
    return (await this.getCardLocator(this.params).innerText()).trim();
  }
}