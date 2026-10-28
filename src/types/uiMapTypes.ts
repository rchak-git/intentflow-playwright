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

export type RoleType =
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
  | 'alert'
  | 'status'
  | 'banner'
  | 'group'
  | 'searchbox';

// Discriminated Union for Semantic Locator Strategies
export type SemanticLocatorStrategy =
  | {
      strategy: 'role';
      role: RoleType;
      name?: string | RegExp;
      exact?: boolean;
    }
  | { strategy: 'label'; text: string | RegExp; exact?: boolean }
  | { strategy: 'text'; text: string | RegExp; exact?: boolean }
  | { strategy: 'placeholder'; text: string | RegExp; exact?: boolean }
  | { strategy: 'css'; selector: string }
  | { strategy: 'htmlTable'; selector: string };

export type LocatorDefinition = string | SemanticLocatorStrategy;

export interface ColumnDefinition {
  index: number;
  controlType?: 'TEXT' | 'TEXTBOX' | 'CHECKBOX' | 'SELECT' | 'BUTTON'|'LABEL';
  subSelector?: string;
}

// Base Entry Shared Across All Controls
export interface BaseUiMapEntry {
  widgetType: WidgetType;
  strategy?: string;
  exact?: boolean;
}

// Specialized Web Table Contract
export interface WebTableUiMapEntry extends BaseUiMapEntry {
  widgetType: 'WEB_TABLE';
  strategy: 'htmlTable' | 'css';
  selector: string;
  rowSelector?: string;
  columns?: Record<string, number | ColumnDefinition>;
  subSelectors?: Record<string, string>; // Standardized child element map (Design Lock Rule 2 & 3)
}

// Standard Control Contract
export interface StandardUiMapEntry extends BaseUiMapEntry {
  selector?: string;
  text?: string | RegExp;
  role?: RoleType | string;
  name?: string | RegExp;
  rowSelector?: never; // Prevents accidental table attributes on standard controls
}

// Combined Union Type
export type UiMapEntry = WebTableUiMapEntry | StandardUiMapEntry;

export type GlobalUiMap = Record<string, UiMapEntry>;