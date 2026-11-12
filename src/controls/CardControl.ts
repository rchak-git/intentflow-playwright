import { BaseControl } from './baseControl';
import { Locator, expect } from '@playwright/test';
import type { StepParams, SubIntent, Scalar } from '../types/intentSchema';
import { BooleanStateSchema } from '../types/intentSchema';

export class CardControl extends BaseControl {
  /**
   * Resolves the target card container and optional child sub-control locator.
   */
private getCardLocator(params?: StepParams): Locator {
    const anchorText = params?.anchorText || this.params?.anchorText;
    const childWidget = params?.childWidget || this.params?.childWidget;

    // 1. Always resolve the root card container from uiEntry.selector
    // (avoids BaseControl pre-resolving this.locator to the childWidget subSelector)
    let cardContainer =
      'selector' in this.uiEntry && this.uiEntry.selector
        ? this.page.locator(this.uiEntry.selector)
        : this.locator;

    if (anchorText) {
      cardContainer = cardContainer.filter({ hasText: anchorText });
    }

    // 2. Locate childWidget inside the anchored card container
    if (childWidget && 'subSelectors' in this.uiEntry && this.uiEntry.subSelectors?.[childWidget]) {
      return cardContainer.locator(this.uiEntry.subSelectors[childWidget]);
    }

    // 3. Fallback to the card container locator itself
    return cardContainer;
  }

 public override async action(params?: StepParams): Promise<void> {
    if (params) this.setParams(params);
    const targetParams = params || this.params;
    const rawSubIntent: SubIntent = targetParams?.subIntent || 'click';

    // Normalize 'clickSubControl' to 'click' so BaseControl handles click, jsClick, hover, etc. uniformly
    const normalizedSubIntent: SubIntent =
      rawSubIntent === 'clickSubControl' ? 'click' : rawSubIntent;

    const originalLocator = this.locator;
    try {
      this.locator = this.getCardLocator(targetParams);
      await super.action({ ...targetParams, subIntent: normalizedSubIntent });
    } finally {
      this.locator = originalLocator;
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
      case 'state': {
        const stateStr = String(rawVal ?? 'visible').toLowerCase();
        if (stateStr === 'visible' || stateStr === 'true') {
          await expect(targetLocator).toBeVisible();
        } else if (stateStr === 'hidden' || stateStr === 'false') {
          await expect(targetLocator).toBeHidden();
        } else if (stateStr === 'enabled') {
          await expect(targetLocator).toBeEnabled();
        } else if (stateStr === 'disabled') {
          await expect(targetLocator).toBeDisabled();
        } else {
          throw new Error(`[IntentFlow] Unsupported card state assertion: '${rawVal}'`);
        }
        break;
      }

      case 'equals':
        await expect(targetLocator).toHaveText(expectedStr);
        break;

      case 'contains':
      default:
        await expect(targetLocator).toContainText(expectedStr);
        break;
    }
  }

  public override async getValue(): Promise<string> {
    return (await this.getCardLocator(this.params).innerText()).trim();
  }
}