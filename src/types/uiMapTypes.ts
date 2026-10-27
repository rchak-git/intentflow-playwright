// src/types/uiMapTypes.ts

export const WIDGET_TYPES = [
  'TEXTBOX',
  'BUTTON',
  'CHECKBOX',
  'SELECT',
  'LABEL',
  'LINK',
  'CONTAINER',
  'WEB_TABLE',
  'SEARCH',
  'PAGE',
  'GENERIC',
] as const;

export type WidgetType = typeof WIDGET_TYPES[number];

// Semantic locator strategy definitions
export type SemanticLocatorStrategy =
  | {
      strategy: 'role';
      role: 
        | 'button' 
        | 'link' 
        | 'textbox' 
        | 'checkbox' 
        | 'combobox' 
        | 'cell' 
        | 'row' 
        | 'grid' 
        | 'region' 
        | 'heading' 
        | 'dialog' 
        | 'tab'
        | 'alert'    // <-- Added
        | 'status'   // <-- Added
        | 'banner'   // <-- Added
        | 'group';   // <-- Added
      name?: string | RegExp;
      exact?: boolean;
    }
  | { strategy: 'label'; text: string | RegExp; exact?: boolean }
  | { strategy: 'text'; text: string | RegExp; exact?: boolean }
  | {strategy: 'placeholder';text: string | RegExp;exact?: boolean}
  | { strategy: 'css'; selector: string };

export type LocatorDefinition = string | SemanticLocatorStrategy;

export interface ColumnDefinition {
  index: number;
  controlType?: 'TEXT' | 'TEXTBOX' | 'CHECKBOX' | 'SELECT' | 'BUTTON';
  subSelector?: string;
}

// A UiMapEntry can be EITHER a direct semantic entry (no 'main' required) 
// OR a complex multi-locator entry (using 'main', 'row', 'cell', etc.)
// src/types/uiMapTypes.ts
export interface UiMapEntry {
  widgetType: WidgetType;
  strategy?: string;
  selector?: string;
  text?: string;
  exact?: boolean;
  role?: string;
  name?: string;

  // Web Table Extensions
  rowSelector?: string;
  columns?: Record<string, number | ColumnDefinition>;
}