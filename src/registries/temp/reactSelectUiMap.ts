import type { UiMapEntry } from '../../types/uiMapTypes';

export const ReactSelectUiMap: Record<string, UiMapEntry> = {
  react_select_colorSelect: {
    widgetType: 'CUSTOM_SELECT',
    strategy: 'css',
    selector: '.select__control',
    subSelectors: {
      overlayPanel: 'div[class*="-menu"]',
      option: 'div[class*="-option"]'
    }
  }
};