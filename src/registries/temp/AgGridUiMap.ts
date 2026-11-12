// src/registries/AgGrid/AgGridUiMap.ts
import type { UiMapEntry } from '../../types/uiMapTypes';

export const AgGridTableUiMap: Record<string, UiMapEntry> = {
  aggrid_table: {
    widgetType: 'WEB_TABLE',
    strategy: 'css',
    frameSelector: 'iframe#loading-frame-getting-started-quick-start-example, iframe[title="Quick Start Example"]',
    selector: '.ag-root-wrapper, div[role="grid"]',
    rowSelector: 'div[role="row"].ag-row, div[role="row"]',
    columns: {
      make: { index: 1, controlType: 'TEXT', subSelector: 'div[col-id="make"]' },
      model: { index: 2, controlType: 'TEXT', subSelector: 'div[col-id="model"]' },
      price: { index: 3, controlType: 'TEXT', subSelector: 'div[col-id="price"]' },
      electric: { index: 4, controlType: 'CHECKBOX', subSelector: 'div[col-id="electric"] input[type="checkbox"]' }
    }
  }
};
