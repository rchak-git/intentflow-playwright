// src/controls/searchControl.ts
import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { BaseControl } from './baseControl';
import type { LocatorDefinition, UiMapEntry } from '../types/uiMapTypes';
import { SEARCH_CONTROL_DEFAULTS } from '../config/controlDefaults';
import type { StepParams, SubIntent, Scalar } from '../types/intentSchema';

export class SearchControl extends BaseControl {
  private subLocators: Record<string, LocatorDefinition | undefined>;

  constructor(
    page: Page, 
    uiEntry: UiMapEntry, 
    params?: StepParams,
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

  /**
   * Populates search box and optionally selects an autocomplete option.
   */
  public override async populate(value?: Scalar | Scalar[], params?: StepParams): Promise<void> {
    if (params) this.setParams(params);

    const targetParams = params || this.params;
    const textToSearch = String(value !== undefined ? value : targetParams?.value ?? '');
    const optionText = targetParams?.anchorText || targetParams?.childWidget;

    await this.executeWithRetry(async () => {
      // 1. Fill search box input
      await this.locator.waitFor({ state: 'visible', timeout: targetParams?.timeout ?? 10000 });
      await this.locator.fill(textToSearch, { timeout: targetParams?.timeout });

      // 2. Select dropdown option if anchorText or childWidget is passed
      if (optionText) {
        const optionDef = this.subLocators.optionItem;
        const optionSelector = typeof optionDef === 'object' && 'selector' in optionDef 
          ? optionDef.selector 
          : 'mat-option, .autocomplete-option, .search-result-item';

        const optionLocator = this.page
          .locator(optionSelector)
          .filter({ hasText: optionText })
          .first();

        await optionLocator.waitFor({ state: 'visible', timeout: targetParams?.timeout ?? 5000 });
        await optionLocator.click({ force: targetParams?.force });
      }
    });
  }

  /**
   * Handles search action directives (subIntent: 'clear', 'click', or 'pressKey').
   */
  public override async action(params?: StepParams): Promise<void> {
    if (params) this.setParams(params);

    const targetParams = params || this.params;
    const subIntent: SubIntent = targetParams?.subIntent || 'click';

    await this.executeWithRetry(async () => {
      if (subIntent === 'clear') {
        const clearDef = this.subLocators.clearBtn;
        const clearSelector = typeof clearDef === 'object' && 'selector' in clearDef
          ? clearDef.selector
          : 'button, .clear-btn, mat-icon[aria-label*="Clear"], svg';

        const clearBtn = this.locator
          .locator('..')
          .locator(clearSelector)
          .first();

        if (await clearBtn.isVisible().catch(() => false)) {
          await clearBtn.click({ timeout: targetParams?.timeout, force: targetParams?.force });
        } else {
          await this.locator.fill('');
        }
        return;
      }

      if (subIntent === 'click') {
        const searchDef = this.subLocators.searchBtn;
        const searchSelector = typeof searchDef === 'object' && 'selector' in searchDef
          ? searchDef.selector
          : 'button[type="submit"], .search-btn, mat-icon[aria-label*="Search"]';

        const searchBtn = this.locator
          .locator('..')
          .locator(searchSelector)
          .first();

        if (await searchBtn.isVisible().catch(() => false)) {
          await searchBtn.click({ timeout: targetParams?.timeout, force: targetParams?.force });
        } else {
          await this.locator.press('Enter');
        }
        return;
      }

      // Default back to base action for generic key presses or hovers
      await super.action(targetParams);
    });
  }

  /**
   * Extracts current input value.
   */
  public override async getValue(): Promise<string> {
    return (await this.locator.inputValue()).trim();
  }

  /**
   * Overrides verify to validate search input content.
   */
  public override async verify(
    subIntent: SubIntent = 'equals',
    expectedValue?: Scalar | Scalar[],
    params?: StepParams
  ): Promise<void> {
    if (params) this.setParams(params);

    const targetSubIntent = params?.subIntent || subIntent;
    const rawVal = params?.value !== undefined ? params.value : expectedValue;

    if (targetSubIntent === 'state') {
      await super.verify(subIntent, expectedValue, params);
      return;
    }

    const valStr = rawVal !== undefined ? String(rawVal) : '';

    switch (targetSubIntent) {
      case 'contains':
        await expect(this.locator).toHaveValue(new RegExp(valStr));
        break;

      case 'equals':
      default:
        await expect(this.locator).toHaveValue(valStr);
        break;
    }
  }
}