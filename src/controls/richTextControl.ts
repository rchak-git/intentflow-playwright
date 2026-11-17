import { expect } from '@playwright/test';
import type { Scalar, StepParams, SubIntent } from '../types/intentSchema';
import { BaseControl } from './baseControl';

export class RichTextControl extends BaseControl {
  private async ensureEditable(timeout?: number): Promise<void> {
    await this.ensureFrameReady();
    await expect(this.locator).toHaveJSProperty('isContentEditable', true, { timeout });
  }

  public override async populate(value?: Scalar | Scalar[], params?: StepParams): Promise<void> {
    if (params) this.setParams(params);
    const targetParams = params ?? this.params;
    const text = value !== undefined ? value : targetParams?.value;
    if (targetParams?.subIntent && targetParams.subIntent !== 'setValue') {
      throw new Error(`[IntentFlow] RICH_TEXT does not support populate/${targetParams.subIntent}.`);
    }
    if (typeof text !== 'string') {
      throw new Error('[IntentFlow] RICH_TEXT requires a plain-text string value.');
    }
    await this.ensureEditable(targetParams?.timeout);
    await this.locator.fill(text, { timeout: targetParams?.timeout });
  }

  public override async verify(subIntent: SubIntent = 'equals', expectedValue?: Scalar | Scalar[], params?: StepParams): Promise<void> {
    if (params) this.setParams(params);
    const targetSubIntent = params?.subIntent ?? subIntent;
    if (targetSubIntent === 'state') {
      await super.verify(subIntent, expectedValue, params);
      return;
    }
    if (targetSubIntent !== 'equals' && targetSubIntent !== 'contains') {
      throw new Error(`[IntentFlow] RICH_TEXT does not support verify/${targetSubIntent}.`);
    }
    const value = params?.value !== undefined ? params.value : expectedValue;
    if (typeof value !== 'string') {
      throw new Error('[IntentFlow] RICH_TEXT verification requires a plain-text string value.');
    }
    await this.ensureEditable(params?.timeout);
    if (targetSubIntent === 'equals') {
      await expect(this.locator).toHaveText(value, { useInnerText: true, timeout: params?.timeout });
    } else {
      await expect(this.locator).toContainText(value, { useInnerText: true, timeout: params?.timeout });
    }
  }

  public override async getValue(): Promise<string> {
    await this.ensureEditable();
    return (await this.locator.innerText()).trim();
  }
}
