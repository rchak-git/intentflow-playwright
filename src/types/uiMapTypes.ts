// src/types/uiMapTypes.ts

export type WidgetType = 'TEXTBOX' | 'BUTTON' | 'DUAL_LISTBOX' | 'WEB_TABLE';

// Semantic locator strategy definitions
export type SemanticLocatorStrategy =
    | {
        strategy: 'role';
        role: 'button' | 'link' | 'textbox' | 'checkbox' | 'combobox' | 'cell' | 'row' | 'grid';
        name?: string | RegExp;
        exact?: boolean; // <-- Added exact support
    }
    | { strategy: 'label'; text: string | RegExp }
    | { strategy: 'text'; text: string | RegExp }
    | { strategy: 'placeholder'; text: string | RegExp }
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