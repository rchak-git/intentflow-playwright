import { Page, expect } from '@playwright/test';
import { BaseControl } from './baseControl';
import { UiMapEntry } from '../types/uiMapTypes';
import type { ActionParams } from '../types/intentSchema';

export interface CheckboxActionParams {
  value?: 'ON' | 'OFF' | boolean;
  actionType?: 'click' | 'check' | 'uncheck';
}

export class CheckboxControl extends BaseControl {
  constructor(page: Page, uiEntry: UiMapEntry, params?: ActionParams) {
    super(page, uiEntry, params);
  }

  public async action(params?: CheckboxActionParams | string | boolean): Promise<void> {
    let targetState: boolean | undefined;

    if (typeof params === 'boolean') {
      targetState = params;
    } else if (typeof params === 'string') {
      const normalized = params.toUpperCase();
      if (normalized === 'ON' || normalized === 'TRUE') targetState = true;
      if (normalized === 'OFF' || normalized === 'FALSE') targetState = false;
    } else if (params && typeof params === 'object') {
      if (typeof params.value === 'boolean') {
        targetState = params.value;
      } else if (typeof params.value === 'string') {
        const normalized = params.value.toUpperCase();
        if (normalized === 'ON' || normalized === 'TRUE') targetState = true;
        if (normalized === 'OFF' || normalized === 'FALSE') targetState = false;
      }
    }

    const isChecked = await this.locator.isChecked().catch(async () => {
      const ariaChecked = await this.locator.getAttribute('aria-checked');
      return ariaChecked === 'true';
    });

    if (targetState === undefined) {
      await this.locator.click();
    } else if (targetState && !isChecked) {
      await this.locator.check({ force: true }).catch(() => this.locator.click());
    } else if (!targetState && isChecked) {
      await this.locator.uncheck({ force: true }).catch(() => this.locator.click());
    }
  }

  public async verify(assertion: string = 'ENABLED', expectedValue?: string | boolean): Promise<void> {
    switch (assertion.toUpperCase()) {
      case 'CHECKED':
        await expect(this.locator).toBeChecked();
        break;
      case 'UNCHECKED':
        await expect(this.locator).not.toBeChecked();
        break;
      case 'VISIBLE':
        await expect(this.locator).toBeVisible();
        break;
      case 'ENABLED':
        await expect(this.locator).toBeEnabled();
        break;
      case 'DISABLED':
        await expect(this.locator).toBeDisabled();
        break;
      default:
        await expect(this.locator).toBeVisible();
    }
  }
}