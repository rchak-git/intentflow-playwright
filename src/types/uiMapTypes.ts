// src/types/uiMapTypes.ts

export const WIDGET_TYPES = [
  'TEXTBOX',
  'BUTTON',
  'CHECKBOX',
  'RADIO_GROUP',
  'SELECT',
  'CUSTOM_SELECT',
  'LABEL',
  'LINK',
  'CONTAINER',
  'WEB_TABLE',
  'TABLE',
  'SEARCH',
  'PAGE',
  'GENERIC',
  'CARD'
] as const;

export type WidgetType = typeof WIDGET_TYPES[number];

export type RoleType =
  | 'button'
  | 'link'
  | 'textbox'
  | 'checkbox'
  | 'radio'
  | 'radiogroup'
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
  | { strategy: 'testId'; selector: string }
  | { strategy: 'xpath'; selector: string }
  | { strategy: 'css'; selector: string }
  | { strategy: 'htmlTable'; selector: string };

export type LocatorDefinition = string | SemanticLocatorStrategy;

export interface ColumnDefinition {
  index: number;
  controlType?: 'TEXT' | 'TEXTBOX' | 'CHECKBOX' | 'SELECT' | 'BUTTON' | 'LABEL' | 'LINK' | undefined;
  subSelector?: string;
}

/** Specialized child selectors for portal/overlay controls like CUSTOM_SELECT */
export interface CustomSelectSubSelectors {
  /** Optional query targeting portal/overlay containers (e.g. '.cdk-overlay-container') */
  overlayPanel?: string;
  /** Optional custom option selector (defaults to '[role="option"], mat-option, li') */
  option?: string;
  [key: string]: string | undefined;
}

/** Specialized child selectors for RADIO_GROUP controls */
export interface RadioGroupSubSelectors {
  /** Relative selector to locate individual radio option input elements */
  option?: string;
  /** Relative selector to locate option labels */
  label?: string;
  [key: string]: string | undefined;
}

// Single Base Entry Shared Across All Controls
export interface BaseUiMapEntry {
  widgetType: WidgetType;
  strategy?: string;
  exact?: boolean;
  description?: string;
  /** Optional CSS or XPath selector targeting a parent iframe context */
  frameSelector?: string;
}

// Specialized Web Table Contract
export interface WebTableUiMapEntry extends BaseUiMapEntry {
  widgetType: 'WEB_TABLE' | 'TABLE';
  strategy: 'htmlTable' | 'css' | string;
  selector: string;
  rowSelector?: string;
  columns?: Record<string, number | ColumnDefinition>;
  subSelectors?: Record<string, string>; // Standardized child element map
}

// Specialized Composite Card / Container Contract
export interface CardUiMapEntry extends BaseUiMapEntry {
  widgetType: 'CARD' | 'CONTAINER';
  strategy?: string;
  selector: string;
  rowSelector?: string; // Optional to satisfy generic UiMapEntry inspection
  subSelectors?: Record<string, string>; // Standardized child element map for cards
}

// Specialized Custom Select Dropdown Contract
export interface CustomSelectUiMapEntry extends BaseUiMapEntry {
  widgetType: 'CUSTOM_SELECT';
  selector?: string;
  text?: string | RegExp;
  role?: RoleType | string;
  name?: string | RegExp;
  rowSelector?: string;
  subSelectors?: CustomSelectSubSelectors;
}

// Specialized Radio Group Contract
export interface RadioGroupUiMapEntry extends BaseUiMapEntry {
  widgetType: 'RADIO_GROUP';
  selector?: string;
  text?: string | RegExp;
  role?: RoleType | string;
  name?: string | RegExp;
  rowSelector?: string;
  subSelectors?: RadioGroupSubSelectors;
}

// Standard Control Contract
export interface StandardUiMapEntry extends BaseUiMapEntry {
  selector?: string;
  text?: string | RegExp;
  role?: RoleType | string;
  name?: string | RegExp;
  rowSelector?: string; // Optional to prevent union property access errors across control classes
  subSelectors?: Record<string, string>;
}

// Combined Union Type
export type UiMapEntry =
  | WebTableUiMapEntry
  | CardUiMapEntry
  | CustomSelectUiMapEntry
  | RadioGroupUiMapEntry
  | StandardUiMapEntry;

export type GlobalUiMap = Record<string, UiMapEntry>;