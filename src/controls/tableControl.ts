// src/controls/tableControl.ts
import { Page, Locator, expect } from '@playwright/test';
import { BaseControl } from './baseControl';
import { UiMapEntry } from '../types/uiMapTypes';
import { TABLE_STRATEGY_DEFAULTS, TableStrategyDefinition } from '../config/controlDefaults';
import type { ActionParams } from '../types/intentSchema';

export interface TableActionParams {
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
   * Targets a specific row by visible text or zero-based row index
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
   * Targets a cell inside a row using column index or column mapping header
   */
  public getCellLocator(params: TableActionParams): Locator {
    const rowLocator = this.getRowLocator(params.rowByText, params.rowIndex);
    const cellSelector = this.strategyConfig.cellSelector;

   let colIdx = params.columnIndex ?? 0;
  if (params.columnHeader && this.uiEntry.columns && params.columnHeader in this.uiEntry.columns) {

  const colDef = this.uiEntry.columns[params.columnHeader];
  colIdx = typeof colDef === 'number' ? colDef : colDef.index;
      }

    const cellLocator = rowLocator.locator(cellSelector).nth(colIdx);

    return params.subSelector ? cellLocator.locator(params.subSelector) : cellLocator;
  }

  /**
   * Interacts with a specific cell or sub-control inside the cell
   */
  public async action(valueOrParams?: any, extraParams?: any): Promise<void> {
    const actualParams: TableActionParams = 
      typeof valueOrParams === 'object' && valueOrParams !== null ? valueOrParams : extraParams || {};

    if (!actualParams.rowByText && actualParams.rowIndex === undefined) {
      throw new Error('TableControl action requires params (e.g., rowByText, columnHeader, subSelector)');
    }

    const targetLocator = this.getCellLocator(actualParams);
    await targetLocator.click();
  }

  /**
   * Verifies table cell attributes using canonical assertion keywords
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