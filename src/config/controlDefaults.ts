// src/config/controlDefaults.ts
import type { LocatorDefinition } from '../types/uiMapTypes';


export interface TableStrategyDefinition {
  rowSelector: string;
  cellSelector: string;
  headerSelector: string;
}

export const TABLE_STRATEGY_DEFAULTS: Record<'htmlTable' | 'divGrid', TableStrategyDefinition> = {
  // Strategy 1: Standard HTML <table> / <thead> / <tbody> / <tr> / <td>
  htmlTable: {
    rowSelector: 'tbody tr',
    cellSelector: 'td',
    headerSelector: 'thead th'
  },

  // Strategy 2: Angular Flexbox / CSS Grid (div.row, [role="row"])
  divGrid: {
    rowSelector: '.table-row, [role="row"]',
    cellSelector: '.table-col, [role="cell"], div',
    headerSelector: '.table-header, [role="columnheader"]'
  }
};

export const SEARCH_CONTROL_DEFAULTS: Record<string, LocatorDefinition> = {
  clearBtn: {
    strategy: 'css',
    selector: 'button, .clear-btn, mat-icon[aria-label*="Clear"], svg'
  },
  optionItem: {
    strategy: 'css',
    selector: 'mat-option, .autocomplete-option, .search-result-item'
  }
};