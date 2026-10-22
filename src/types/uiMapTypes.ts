// src/types/uiMapTypes.ts

export type WidgetType = 
  | 'TEXTBOX' 
  | 'BUTTON' 
  | 'CHECKBOX' 
  | 'DROPDOWN' 
  | 'LABEL' 
  | 'LINK' 
  | 'CONTAINER' 
  | 'REGION' 
  | 'DUAL_LISTBOX' 
  | 'GENERIC'
  | 'WEB_TABLE'
  | 'SEARCH'        // <-- Added
  | 'COURSE_CARD';

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

// A UiMapEntry can be EITHER a direct semantic entry (no 'main' required) 
// OR a complex multi-locator entry (using 'main', 'row', 'cell', etc.)
export type UiMapEntry =
  | ({ widgetType: WidgetType } & SemanticLocatorStrategy)
  | {
      widgetType: WidgetType;
      main: LocatorDefinition;
      alternate?: LocatorDefinition;
      [key: string]: LocatorDefinition | undefined;
    };