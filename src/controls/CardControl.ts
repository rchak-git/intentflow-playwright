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

    // 1. Anchor to the specific card container on the page using anchorText
    let cardContainer = this.locator;
    if (anchorText) {
      cardContainer = cardContainer.filter({ hasText: anchorText });
    }

    // 2. If a childWidget key is passed and subSelectors exist, locate inside anchored container
    if (childWidget && 'subSelectors' in this.uiEntry && this.uiEntry.subSelectors?.[childWidget]) {
      return cardContainer.locator(this.uiEntry.subSelectors[childWidget]);
    }

    // 3. Fallback to the card container locator itself
    return cardContainer;
  }

  public override async action(params?: StepParams): Promise<void> {
    if (params) this.setParams(params);
    const targetParams = params || this.params;
    const subIntent: SubIntent = targetParams?.subIntent || 'click';
    const targetLocator = this.getCardLocator(targetParams);

    await this.executeWithRetry(async () => {
      switch (subIntent) {
        case 'hover':
          await targetLocator.hover({ force: targetParams?.force, timeout: targetParams?.timeout });
          break;

        case 'clickSubControl':
        case 'click':
        default:
          await targetLocator.click({ force: targetParams?.force, timeout: targetParams?.timeout });
          break;
      }
    });
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
        const isVisible = BooleanStateSchema.parse(rawVal ?? true);
        if (isVisible) {
          await expect(targetLocator).toBeVisible();
        } else {
          await expect(targetLocator).toBeHidden();
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