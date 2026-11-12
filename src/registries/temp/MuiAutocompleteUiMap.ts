import type { UiMapEntry } from '../../types/uiMapTypes';

export const MuiAutocompleteUiMap: Record<string, UiMapEntry> = {
  // Anchors the first combobox directly under the "Combo box" demo heading (#combo-box)
  react_mui_movieSearchBox: {
    widgetType: 'SEARCH',
    strategy: 'xpath',
    selector: '(//h2[@id="combo-box"]/following::input[@role="combobox"])[1]',
    subSelectors: {
      optionItem: '[role="listbox"] [role="option"]',
      clearBtn: 'button[aria-label="Clear"]'
    }
  }
};