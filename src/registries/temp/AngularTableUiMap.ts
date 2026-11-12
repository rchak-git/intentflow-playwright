// src/registries/Angular/AngularTableUiMap.ts
import type { UiMapEntry } from '../../types/uiMapTypes';

export const AngularTableUiMap: Record<string, UiMapEntry> = {
  ang_tableBasicExampleTable: {
    widgetType: 'WEB_TABLE',
    strategy: 'css',
    selector: 'table-basic-example table[mat-table]',
    rowSelector: 'tbody tr[mat-row]',
    columns: {
      position: { index: 1, controlType: 'TEXT', subSelector: '.cdk-column-position' },
      name: { index: 2, controlType: 'TEXT', subSelector: '.cdk-column-name' },
      weight: { index: 3, controlType: 'TEXT', subSelector: '.cdk-column-weight' },
      symbol: { index: 4, controlType: 'TEXT', subSelector: '.cdk-column-symbol' }
    }
  }
};