// src/controls/tableControl.ts
import { Page, Locator, expect } from '@playwright/test';
import { BaseControl } from './baseControl';
import type { UiMapEntry, WebTableUiMapEntry } from '../types/uiMapTypes';
import { TABLE_STRATEGY_DEFAULTS, TableStrategyDefinition } from '../config/controlDefaults';
import type { StepParams, SubIntent, Scalar } from '../types/intentSchema';
import { BooleanStateSchema } from '../types/intentSchema';

export class TableControl extends BaseControl {
  private strategyConfig: TableStrategyDefinition;

  constructor(page: Page, uiEntry: UiMapEntry, params?: StepParams) {
    super(page, uiEntry, params);
    const strategyKey = (uiEntry.strategy as 'htmlTable' | 'divGrid') || 'htmlTable';
    this.strategyConfig = TABLE_STRATEGY_DEFAULTS[strategyKey] || TABLE_STRATEGY_DEFAULTS.htmlTable;
  }

  /**
   * Encapsulated Hydration Guard:
   * 1. Ensures parent iframe is attached & scrolled into view.
   * 2. Scrolls main grid container into view.
   * 3. Scrolls target row & waits for target cell to be attached/visible.
   */
 // src/controls/tableControl.ts

protected async ensureTableAndRowHydrated(targetLocator?: Locator, params?: StepParams): Promise<void> {
  const targetParams = params || this.params;
  const rowSelector = this.uiEntry.rowSelector || this.strategyConfig.rowSelector;

  // STEP 1: Progressively scroll main page until iframe attaches and becomes visible
  await this.ensureFrameReady();

  // STEP 2: Scroll main grid container inside the iframe viewport
  await this.locator.scrollIntoViewIfNeeded().catch(() => {});

  // STEP 3: If anchorText is present, scroll the specific row
  if (targetParams?.anchorText) {
    const targetRow = this.locator.locator(rowSelector).filter({ hasText: targetParams.anchorText }).first();
    await targetRow.waitFor({ state: 'attached', timeout: 15000 }).catch(() => {});
    await targetRow.scrollIntoViewIfNeeded().catch(() => {});
  }

  // STEP 4: If target cell locator is passed, wait for visibility
  if (targetLocator) {
    await targetLocator.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  }
}
  /**
   * Targets a specific row locator using anchorText filter.
   */
  public getRowLocator(params?: StepParams): Locator {
    const tableRoot = this.locator;
    const rowSelector = this.uiEntry.rowSelector || this.strategyConfig.rowSelector;
    let rows = tableRoot.locator(rowSelector);

    if (params?.anchorText) {
      rows = rows.filter({ hasText: params.anchorText });
    }

    return rows;
  }

  /**
   * Targets a cell or nested child element inside a row using column header mapping,
   * 1-based index normalization, or scoped subSelectors.
   */
  public getCellLocator(params?: StepParams): Locator {
    const targetParams = params || this.params;
    const rowLocator = this.getRowLocator(targetParams).first();
    const cellSelector = this.strategyConfig?.cellSelector || 'td, th';
    const tableEntry = this.uiEntry as WebTableUiMapEntry;

    // Standardize column key lookup (supports 'column' or 'targetColumn')
    const colName = targetParams?.column || targetParams?.targetColumn;

    if (colName && tableEntry.columns && colName in tableEntry.columns) {
      const colDef = tableEntry.columns[colName];

      // 1. Direct subSelector targeting if defined on the column
      if (typeof colDef === 'object' && colDef.subSelector) {
        return rowLocator.locator(colDef.subSelector);
      }

      // 2. Convert 1-based index from UI Map to 0-based index (.nth)
      const rawIdx = typeof colDef === 'number' ? colDef : colDef.index;
      const zeroBasedIdx = Math.max(0, rawIdx - 1);
      const cellLocator = rowLocator.locator(cellSelector).nth(zeroBasedIdx);

      // 3. Resolve childWidget inside column if passed in step params
      if (targetParams?.childWidget && tableEntry.subSelectors?.[targetParams.childWidget]) {
        return cellLocator.locator(tableEntry.subSelectors[targetParams.childWidget]);
      }

      // 4. Fallback for controlType 'LINK' if no subSelector was provided
      if (typeof colDef === 'object' && colDef.controlType === 'LINK') {
        return cellLocator.locator('a');
      }

      return cellLocator;
    }

    // Default fallback: first cell in the row
    return rowLocator.locator(cellSelector).first();
  }

  /**
   * Executes actions (clicks, sub-control clicks) on a table or nested row control.
   */
  public override async action(params?: StepParams): Promise<void> {
    if (params) this.setParams(params);
    const targetParams = params || this.params;
    const subIntent: SubIntent = targetParams?.subIntent || 'click';

    const isScoped = Boolean(targetParams?.anchorText || targetParams?.column || targetParams?.targetColumn || targetParams?.childWidget);
    const targetLocator = isScoped ? this.getCellLocator(targetParams) : this.locator;

    // Run table, frame, & row hydration sequence
    await this.ensureTableAndRowHydrated(isScoped ? targetLocator : undefined, targetParams);

    await this.executeWithRetry(async () => {
      switch (subIntent) {
        case 'hover':
          await targetLocator.hover({ force: targetParams?.force, timeout: targetParams?.timeout });
          break;

        case 'dblClick':
          await targetLocator.dblclick({ force: targetParams?.force, timeout: targetParams?.timeout });
          break;

        case 'clickSubControl':
        case 'click':
        default:
          await targetLocator.click({ force: targetParams?.force, timeout: targetParams?.timeout });
          break;
      }
    });
  }

  /**
   * Verifies table row counts, global text, and cell values across paradigms.
   */
  public override async verify(
    subIntent: SubIntent = 'equals',
    expectedValue?: Scalar | Scalar[],
    params?: StepParams
  ): Promise<void> {
    if (params) this.setParams(params);

    const targetParams = params || this.params;
    const targetSubIntent = targetParams?.subIntent || subIntent;
    const rawVal = targetParams?.value !== undefined ? targetParams.value : expectedValue;

    // Handle Paradigm 1: Count Verification
    if (targetSubIntent === 'count') {
      await this.ensureTableAndRowHydrated(undefined, targetParams);
      const rowSelector = this.uiEntry.rowSelector || this.strategyConfig.rowSelector;
      const rowsLocator = this.locator.locator(rowSelector);
      const expectedCount = Number(rawVal);
      await expect(rowsLocator).toHaveCount(expectedCount);
      return;
    }

    // Handle State Check
    if (targetSubIntent === 'state') {
      await this.ensureFrameReady();
      const stateValue = String(rawVal || 'visible').toLowerCase();
      if (stateValue === 'visible') await expect(this.locator).toBeVisible();
      else if (stateValue === 'hidden') await expect(this.locator).toBeHidden();
      else throw new Error(`[IntentFlow] Unknown state value "${stateValue}" for TableControl.`);
      return;
    }

    // Paradigm 2 (cellText) vs Global Contains/Equals
    const isRowScoped = Boolean(targetParams?.anchorText || targetParams?.column || targetParams?.targetColumn);
    const targetLocator = isRowScoped ? this.getCellLocator(targetParams) : this.locator;

    // Hydrate frame, table container, target row, and cell
    await this.ensureTableAndRowHydrated(isRowScoped ? targetLocator : undefined, targetParams);

    const expectedStr = rawVal !== undefined ? String(rawVal) : '';

    switch (targetSubIntent) {
      case 'allRowCheckboxesState': {
        const rowSelector = this.uiEntry.rowSelector || this.strategyConfig.rowSelector;
        const rows = this.locator.locator(rowSelector);
        const rowCount = await rows.count();
        expect(rowCount, 'Table should contain at least one row to check row checkbox state').toBeGreaterThan(0);

        const tableEntry = this.uiEntry as WebTableUiMapEntry;
        const selectColDef = tableEntry.columns?.['select'];
        const subSelector = (typeof selectColDef === 'object' && selectColDef?.subSelector)
          ? selectColDef.subSelector
          : 'input[type="checkbox"]';

        const expectedChecked = rawVal !== undefined ? BooleanStateSchema.parse(rawVal) : true;

        for (let i = 0; i < rowCount; i++) {
          const rowCheckbox = rows.nth(i).locator(subSelector);
          if (expectedChecked) {
            await expect(rowCheckbox, `Row ${i + 1} checkbox should be checked`).toBeChecked();
          } else {
            await expect(rowCheckbox, `Row ${i + 1} checkbox should not be checked`).not.toBeChecked();
          }
        }
        break;
      }
      case 'cellText':
      case 'equals':
        await expect(targetLocator).toHaveText(expectedStr, { timeout: 15000 });
        break;

      case 'contains':
      default:
        await expect(targetLocator).toContainText(expectedStr, { timeout: 15000 });
        break;
    }
  }

  /**
   * Primary extraction interface called by CommandDispatcher during 'EXTRACT' steps.
   */
  public override async getValue(): Promise<any> {
    const isCellScoped = Boolean(this.params?.column || this.params?.targetColumn || this.params?.anchorText);
    const targetLocator = isCellScoped ? this.getCellLocator(this.params) : this.locator;

    await this.ensureTableAndRowHydrated(isCellScoped ? targetLocator : undefined, this.params);

    if (isCellScoped) {
      return (await targetLocator.innerText()).trim();
    }

    return await this.extractTableData();
  }

  /**
   * Paradigm 4: Extracts dynamic table data into an array of row objects.
   */
  public async extractTableData(): Promise<Record<string, string>[]> {
    const rowSelector = this.uiEntry.rowSelector || this.strategyConfig.rowSelector;
    const cellSelector = this.strategyConfig.cellSelector;
    const tableEntry = this.uiEntry as WebTableUiMapEntry;

    const rows = this.locator.locator(rowSelector);
    const rowCount = await rows.count();
    const extractedData: Record<string, string>[] = [];

    const colKeys = tableEntry.columns ? Object.keys(tableEntry.columns) : [];

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const cells = row.locator(cellSelector);
      const cellCount = await cells.count();
      const rowObj: Record<string, string> = {};

      for (let j = 0; j < cellCount; j++) {
        const text = (await cells.nth(j).innerText()).trim();
        const colName = colKeys[j] || `col_${j}`;
        rowObj[colName] = text;
      }
      extractedData.push(rowObj);
    }

    return extractedData;
  }
}