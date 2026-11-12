import type { UiMapEntry } from '../../types/uiMapTypes';

export const AngularRadioGroupUiMap: Record<string, UiMapEntry> = {
  radio_angular_favoriteSeasonRadioGroup: {
  widgetType: 'RADIO_GROUP',
  strategy: 'css',
  selector: 'mat-radio-group', // Or target the specific group: 'mat-radio-group[aria-labelledby="example-radio-group-label"]'
  subSelectors: {
    option: 'mat-radio-button',
    label: '.mdc-label'
  }
},
  text_favoriteSeasonOutput: {
  widgetType: 'TEXTBOX', // or BASE / LABEL
  strategy: 'css',
  // Scope specifically to the example wrapper or exact text node:
  selector: 'radio-ng-model-example div:has-text("Your favorite season is:")' 
  // OR: selector: 'div.example-selected-value'
}

};