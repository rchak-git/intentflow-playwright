import type { UiMapEntry } from '../../types/uiMapTypes';

export const RadioGroupUiMap: Record<string, UiMapEntry> = {
  radio_colorRadioGroup: {
    widgetType: 'RADIO_GROUP',
    strategy: 'css',
    selector: 'input[type="radio"][name="color"]',
    subSelectors: {
      option: 'input[type="radio"]',
      label: 'label'
    }
  }
};