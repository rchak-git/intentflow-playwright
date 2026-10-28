// src/controls/tableControl.ts
import { Page, Locator, expect } from '@playwright/test';
import { BaseControl } from './baseControl';
import { UiMapEntry } from '../types/uiMapTypes';
import { TABLE_STRATEGY_DEFAULTS, TableStrategyDefinition } from '../config/controlDefaults';
import type { ActionParams } from '../types/intentSchema';
import type { WebTableUiMapEntry } from '../types/uiMapTypes';

export interface TableActionParams extends ActionParams {
  rowByText?: string;
  rowIndex?: number;
  columnHeader?: string;
  columnIndex?: number;
  subSelector?: string;
  actionType?: 'click' | 'check' | 'uncheck' | 'getText';
}

export class TableControl extends BaseControl {
  private strategyConfig: TableStrategyDefinition;

  constructor(page: Page, uiEntry: UiMapEntry, params?: ActionParams) {
    super(page, uiEntry, params);
    const strategyKey = (uiEntry.strategy as 'htmlTable' | 'divGrid') || 'htmlTable';
    this.strategyConfig = TABLE_STRATEGY_DEFAULTS[strategyKey];
  }

  /**
   * Targets a specific row by visible text (matchText / rowByText) or zero-based row index
   */
  public getRowLocator(rowByText?: string, rowIndex?: number): Locator {
    const tableRoot = this.locator;
    const rowSelector = this.uiEntry.rowSelector || this.strategyConfig.rowSelector;
    let rows = tableRoot.locator(rowSelector);

    if (rowByText) {
      rows = rows.filter({ hasText: rowByText });
    }

    if (typeof rowIndex === 'number') {
      return rows.nth(rowIndex);
    }

    return rows.first();
  }

  /**
   * Targets a cell inside a row using column index, column mapping header, or subTarget lookup
   */
  public getCellLocator(params: TableActionParams): Locator {
    // Standardized matchText anchor (Design Lock) with legacy rowByText fallback
    const targetText = params.matchText ?? params.rowByText;
    const rowLocator = this.getRowLocator(targetText, params.rowIndex);
    const cellSelector = this.strategyConfig.cellSelector;

    // Safely cast uiEntry to WebTableUiMapEntry to access `columns` and `subSelectors`
    const tableEntry = this.uiEntry as WebTableUiMapEntry;

    let colIdx = params.columnIndex ?? 0;
    if (params.columnHeader && tableEntry.columns && params.columnHeader in tableEntry.columns) {
      const colDef = tableEntry.columns[params.columnHeader];
      colIdx = typeof colDef === 'number' ? colDef : colDef.index;
    }

    const cellLocator = rowLocator.locator(cellSelector).nth(colIdx);

    // Resolve child element via subTarget (Design Lock) or legacy subSelector
    const childKey = params.subTarget || params.subSelector;
if (childKey) {
  const subCss = tableEntry.subSelectors?.[childKey] || childKey;
  return cellLocator.locator(subCss);
}

    return cellLocator;
  }

  /**
   * Standardized click action (Design Lock)
   */
  public override async click(params?: TableActionParams): Promise<void> {
    const targetParams = params || {};
    const targetLocator = this.getCellLocator(targetParams);
    await targetLocator.click();
  }

  /**
   * Interacts with a specific cell or sub-control inside the cell (Preserved)
   */
  public async action(valueOrParams?: any, extraParams?: any): Promise<void> {
    const actualParams: TableActionParams = 
      typeof valueOrParams === 'object' && valueOrParams !== null ? valueOrParams : extraParams || {};

    if (!actualParams.matchText && !actualParams.rowByText && actualParams.rowIndex === undefined) {
      throw new Error('TableControl action requires params (e.g., matchText, rowByText, columnHeader, subSelector/subTarget)');
    }

    const targetLocator = this.getCellLocator(actualParams);
    await targetLocator.click();
  }

  /**
   * Verifies table cell attributes using canonical assertion keywords (Preserved)
   */
  public async verify(assertion: string = 'CONTAIN_TEXT', expectedValue?: any, params?: any): Promise<void> {
    const targetParams: TableActionParams | undefined = 
      typeof params === 'object' && params !== null ? params : undefined;

    const targetLocator = targetParams ? this.getCellLocator(targetParams) : this.locator;
    const expectedStr = typeof expectedValue === 'string' ? expectedValue : String(expectedValue ?? '');

    switch (assertion.toUpperCase()) {
      case 'TEXT_EQUALS':
        await expect(targetLocator).toHaveText(expectedStr);
        break;

      case 'CONTAIN_TEXT':
        let tempValues = await targetLocator.locator('xpath=ancestor::tr').locator('td').allInnerTexts();
        await expect(targetLocator).toContainText(expectedStr);
        break;

      case 'VISIBLE':
        await expect(targetLocator).toBeVisible();
        break;

      case 'NOT_VISIBLE':
        await expect(targetLocator).toBeHidden();
        break;

      case 'ENABLED':
        await expect(targetLocator).toBeEnabled();
        break;

      case 'DISABLED':
        await expect(targetLocator).toBeDisabled();
        break;

      case 'EMPTY':
        await expect(targetLocator).toBeEmpty();
        break;

      default:
        await expect(targetLocator).toContainText(expectedStr);
    }
  }
}