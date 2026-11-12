// src/registries/AngularMaterial/customSelect.map.ts
import type { UiMapEntry } from '../../types/uiMapTypes';

export const CustomSelectUiMap: Record<string, UiMapEntry> = {
  cust_select_stateSelect: {
    widgetType: 'CUSTOM_SELECT',
    strategy: 'xpath',
    // Scope to the specific demo card to resolve strict mode duplicates
    selector: '(//mat-select[@role="combobox"])[6]',
    subSelectors: {
      overlayPanel: '.cdk-overlay-container, .cdk-overlay-pane',
      option: 'mat-option, [role="option"]'
    }
  }
};