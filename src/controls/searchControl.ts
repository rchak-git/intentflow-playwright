// src/controls/searchControl.ts
import type { Page, Locator } from '@playwright/test';
import { BaseControl } from './baseControl';
import type { LocatorDefinition, UiMapEntry } from '../types/uiMapTypes';
import { SEARCH_CONTROL_DEFAULTS } from '../config/controlDefaults';
import { Assertion, ActionParams } from '../types/intentSchema';

// Extend ActionParams so SearchControl accepts framework params (e.g. timeout, force)
export interface SearchControlParams extends ActionParams {
  subAction?: 'search' | 'clear';
  pressEnter?: boolean;
  selectOption?: string;
}

export class SearchControl extends BaseControl {
  private subLocators: Record<string, LocatorDefinition | undefined>;

  constructor(
    page: Page, 
    uiEntry: UiMapEntry, 
    params?: ActionParams,
    subLocators?: Record<string, LocatorDefinition | undefined>
  ) {
    super(page, uiEntry, params);

    const entrySubLocators = { ...uiEntry };
    delete (entrySubLocators as any).widgetType;
    delete (entrySubLocators as any).main;
    delete (entrySubLocators as any).strategy;

    this.subLocators = { 
      ...SEARCH_CONTROL_DEFAULTS, 
      ...(entrySubLocators as unknown as Record<string, LocatorDefinition | undefined>), 
      ...subLocators 
    };
  }

  public async populate(value: string, params?: SearchControlParams): Promise<void> {
    if (params) this.setParams(params);
    const timeout = params?.timeout ?? 10000;

    await this.locator.waitFor({ state: 'visible', timeout });
    await this.locator.fill(value);

    if (params?.pressEnter) {
      await this.locator.press('Enter');
    }

    if (params?.selectOption) {
      const optionDef = this.subLocators.optionItem;
      const optionSelector = typeof optionDef === 'object' && 'selector' in optionDef 
        ? optionDef.selector 
        : 'mat-option, .autocomplete-option, .search-result-item';

      const optionLocator = this.page
        .locator(optionSelector)
        .filter({ hasText: params.selectOption })
        .first();

      await optionLocator.waitFor({ state: 'visible', timeout: params?.timeout ?? 5000 });
      await optionLocator.click({ force: params?.force });
    }
  }

  public async action(params?: SearchControlParams): Promise<void> {
    if (params) this.setParams(params);
    const subAction = params?.subAction || 'clear';

    if (subAction === 'search') {
      const searchDef = this.subLocators.searchBtn;
      const searchSelector = typeof searchDef === 'object' && 'selector' in searchDef
        ? searchDef.selector
        : 'button[type="submit"], .search-btn, mat-icon[aria-label*="Search"]';

      const searchBtn = this.locator
        .locator('..')
        .locator(searchSelector)
        .first();

      await searchBtn.click({ timeout: params?.timeout, force: params?.force });
      return;
    }

    if (subAction === 'clear') {
      const clearDef = this.subLocators.clearBtn;
      const clearSelector = typeof clearDef === 'object' && 'selector' in clearDef
        ? clearDef.selector
        : 'button, .clear-btn, mat-icon[aria-label*="Clear"], svg';

      const clearBtn = this.locator
        .locator('..')
        .locator(clearSelector)
        .first();

      if (await clearBtn.isVisible().catch(() => false)) {
        await clearBtn.click({ timeout: params?.timeout, force: params?.force });
      } else {
        await this.locator.fill('');
      }
    }
  }

  public override async verify(assertion?: Assertion | string, expectedValue?: string): Promise<void> {
    if (assertion === 'TEXT_EQUALS' || assertion === 'VALUE_EQUALS') {
      const actualValue = await this.locator.inputValue();
      if (actualValue !== expectedValue) {
        throw new Error(`[SearchControl] Expected input value "${expectedValue}", but found "${actualValue}"`);
      }
      return;
    }

    if (assertion === 'EMPTY') {
      const actualValue = await this.locator.inputValue();
      if (actualValue.trim() !== '') {
        throw new Error(`[SearchControl] Expected search box to be empty, but found "${actualValue}"`);
      }
      return;
    }

    await super.verify(assertion as any, expectedValue);
  }
}