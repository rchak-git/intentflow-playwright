// src/config/controlDefaults.ts
import type { LocatorDefinition } from '../types/uiMapTypes';

export interface TableStrategyDefinition {
  rowSelector: string;
  cellSelector: string;
  headerSelector: string;
}

export interface SelectStrategyDefinition {
  defaultStrategy: 'auto' | 'visibleText' | 'value' | 'index';
  optionSelector: string;
  fallbackStrategies: string[];
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
  searchBtn: {
    strategy: 'css',
    selector: 'button[type="submit"], .search-btn, mat-icon[aria-label*="Search"]'
  },
  optionItem: {
    strategy: 'css',
    selector: 'mat-option, .autocomplete-option, .search-result-item'
  }
};

export const SELECT_CONTROL_DEFAULTS: SelectStrategyDefinition = {
  // Primary strategy for native HTML <select> controls
  defaultStrategy: 'auto', 
  optionSelector: 'option',
  // Execution fallback chain if primary fails
  fallbackStrategies: ['visibleText', 'value', 'index']
};