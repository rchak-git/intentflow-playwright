// src/config/controlDefaults.ts
import type { LocatorDefinition } from '../types/uiMapTypes';

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