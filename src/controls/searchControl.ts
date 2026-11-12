// src/controls/searchControl.ts
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BaseControl } from './baseControl';
import type { LocatorDefinition, UiMapEntry } from '../types/uiMapTypes';
import { SEARCH_CONTROL_DEFAULTS } from '../config/controlDefaults';
import type { StepParams, SubIntent, Scalar } from '../types/intentSchema';

type SubLocatorValue = string | LocatorDefinition | undefined;

export class SearchControl extends BaseControl {
  private subLocators: Record<string, SubLocatorValue>;

  constructor(
    page: Page,
    uiEntry: UiMapEntry,
    params?: StepParams,
    subLocators?: Record<string, SubLocatorValue>
  ) {
    super(page, uiEntry, SearchControl.stripAnchorText(params));

    const {
      widgetType: _wt,
      main: _main,
      strategy: _strategy,
      selector: _selector,
      role: _role,
      text: _text,
      label: _label,
      placeholder: _placeholder,
      testId: _testId,
      subSelectors,
      ...legacyTopLevelLocators
    } = uiEntry as UiMapEntry & Record<string, unknown>;

    this.subLocators = {
      ...SEARCH_CONTROL_DEFAULTS,
      ...(legacyTopLevelLocators as Record<string, SubLocatorValue>),
      ...(subSelectors as Record<string, SubLocatorValue> | undefined),
      ...subLocators,
    };
  }

  /**
   * Prevents BaseControl from appending `.filter({ hasText: anchorText })` to an <input> locator.
   */
  private static stripAnchorText(params?: StepParams): StepParams | undefined {
    if (!params) return undefined;
    const { anchorText: _ignored, ...rest } = params;
    return rest;
  }

  /**
   * Resolves a sub-locator entry whether defined as a plain CSS/XPath string or a LocatorDefinition object.
   */
  private resolveSubSelector(keys: string[], fallback: string): string {
    for (const key of keys) {
      const def = this.subLocators[key];
      if (typeof def === 'string' && def.trim()) {
        return def;
      }
      if (def && typeof def === 'object' && 'selector' in def && def.selector) {
        return def.selector;
      }
    }
    return fallback;
  }

  /**
   * Populates search box and optionally selects an autocomplete option from a dropdown/portal.
   */
  public override async populate(value?: Scalar | Scalar[], params?: StepParams): Promise<void> {
    if (params) this.setParams(SearchControl.stripAnchorText(params)!);

    const targetParams = params || this.params;
    const textToSearch = String(value !== undefined ? value : targetParams?.value ?? '');
    const optionText = params?.anchorText || params?.childWidget || targetParams?.childWidget;

    await this.executeWithRetry(async () => {
      await this.locator.waitFor({ state: 'visible', timeout: targetParams?.timeout ?? 10000 });

      if (optionText) {
        // Click first so the combobox scrolls into view and settles focus before typing
        await this.locator.click({ timeout: targetParams?.timeout });
        await this.locator.fill('', { timeout: targetParams?.timeout });
        await this.locator.pressSequentially(textToSearch, { delay: 35 });

        const optionSelector = this.resolveSubSelector(
          ['optionItem', 'option'],
          '[role="listbox"] [role="option"], mat-option, .autocomplete-option, .search-result-item'
        );

        const optionLocator = this.page
          .locator(optionSelector)
          .filter({ hasText: optionText })
          .first();

        // Guard: if page hydration/scroll closed the popup right after typing, re-click input to open it
        if (!(await optionLocator.isVisible().catch(() => false))) {
          await this.locator.click({ timeout: targetParams?.timeout });
        }

        await optionLocator.waitFor({ state: 'visible', timeout: targetParams?.timeout ?? 5000 });
        await optionLocator.click({ force: targetParams?.force });
      } else {
        await this.locator.fill(textToSearch, { timeout: targetParams?.timeout });
      }
    });
  }

  /**
   * Handles search action directives ('clear', 'click', or delegates generic actions to BaseControl).
   */
  public override async action(params?: StepParams): Promise<void> {
    if (params) this.setParams(SearchControl.stripAnchorText(params)!);

    const targetParams = params || this.params;
    const subIntent: SubIntent = targetParams?.subIntent || 'click';

    if (subIntent === 'clear') {
      await this.executeWithRetry(async () => {
        const clearSelector = this.resolveSubSelector(
          ['clearBtn', 'clearButton'],
          'button[aria-label*="Clear"], button, .clear-btn, mat-icon[aria-label*="Clear"], svg'
        );

        // Hover input first because MUI hides the Clear icon until the field is hovered/focused
        await this.locator.hover().catch(() => {});
        const clearBtn = this.locator.locator('..').locator(clearSelector).first();

        if (await clearBtn.isVisible().catch(() => false)) {
          await clearBtn.click({ timeout: targetParams?.timeout, force: targetParams?.force });
        } else {
          await this.locator.fill('');
        }
      });
      return;
    }

    if (subIntent === 'click') {
      await this.executeWithRetry(async () => {
        const searchSelector = this.resolveSubSelector(
          ['searchBtn', 'searchButton'],
          'button[type="submit"], .search-btn, mat-icon[aria-label*="Search"]'
        );

        const searchBtn = this.locator.locator('..').locator(searchSelector).first();

        if (await searchBtn.isVisible().catch(() => false)) {
          await searchBtn.click({ timeout: targetParams?.timeout, force: targetParams?.force });
        } else {
          await this.locator.press('Enter');
        }
      });
      return;
    }

    await super.action(targetParams);
  }

  /**
   * Extracts current input value.
   */
  public override async getValue(): Promise<string> {
    return (await this.locator.inputValue()).trim();
  }

  /**
   * Validates search input state or value.
   */
  public override async verify(
    subIntent: SubIntent = 'equals',
    expectedValue?: Scalar | Scalar[],
    params?: StepParams
  ): Promise<void> {
    if (params) this.setParams(SearchControl.stripAnchorText(params)!);

    const targetSubIntent = params?.subIntent || subIntent;
    const rawVal = params?.value !== undefined ? params.value : expectedValue;

    if (targetSubIntent === 'state') {
      await super.verify(subIntent, expectedValue, params);
      return;
    }

    const valStr = rawVal !== undefined ? String(rawVal) : '';

    switch (targetSubIntent) {
      case 'contains': {
        const escaped = valStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        await expect(this.locator).toHaveValue(new RegExp(escaped));
        break;
      }

      case 'equals':
      default:
        await expect(this.locator).toHaveValue(valStr);
        break;
    }
  }
}