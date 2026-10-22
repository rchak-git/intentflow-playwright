// src/controls/searchControl.ts
import type { Page, Locator } from '@playwright/test';
import { BaseControl } from './baseControl';
import type { LocatorDefinition,UiMapEntry } from '../types/uiMapTypes';
import { SEARCH_CONTROL_DEFAULTS } from '../config/controlDefaults';
import { Assertion } from '../types/intentSchema';


export interface SearchControlParams {
  subAction?: 'search' | 'clear';
  pressEnter?: boolean;
  selectOption?: string;
}

export class SearchControl extends BaseControl {
 
  private subLocators: Record<string, LocatorDefinition | undefined>;

  constructor(
    page: Page, 
    uiEntry: UiMapEntry, 
    subLocators?: Record<string, LocatorDefinition | undefined>
  ) {
    // 1. Pass page and uiEntry directly to BaseControl's constructor
    super(page, uiEntry);

    // 2. Extract any subLocators attached directly to the UiMapEntry (if present) and merge with defaults
    const entrySubLocators = { ...uiEntry };
    delete (entrySubLocators as any).widgetType;
    delete (entrySubLocators as any).main;
    delete (entrySubLocators as any).strategy;

    this.subLocators = { 
      ...SEARCH_CONTROL_DEFAULTS, 
      ...(entrySubLocators as Record<string, LocatorDefinition | undefined>), 
      ...subLocators 
    };
  }

  public async populate(value: string, params?: SearchControlParams): Promise<void> {
    await this.locator.waitFor({ state: 'visible', timeout: 10000 });
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

      await optionLocator.waitFor({ state: 'visible', timeout: 5000 });
      await optionLocator.click();
    }
  }

  public async action(params?: SearchControlParams): Promise<void> {
    const subAction = params?.subAction || 'clear';

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
        await clearBtn.click();
      } else {
        await this.locator.fill('');
      }
    }
  }

 public override async verify(assertion?:Assertion| string, expectedValue?: string): Promise<void> {
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

  // Fall back to BaseControl's built-in assertions
  await super.verify(assertion as any, expectedValue);
}

}