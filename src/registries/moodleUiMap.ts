// src/registries/moodleUiMap.ts
import type { UiMapEntry } from '../types/uiMapTypes';

export const moodleUiMap: Record<string, UiMapEntry> = {
  loginLink: {
    widgetType: 'BUTTON',
    strategy: 'role',
    role: 'link',
    name: 'Log in',
    exact: true, // <-- Distinguishes the capitalized header link from the lowercase body link
  },
  usernameInput: {
    widgetType: 'TEXTBOX',
    strategy: 'role',
    role: 'textbox',
    name: 'Username',
  },
  passwordInput: {
    widgetType: 'TEXTBOX',
    strategy: 'role',
    role: 'textbox',
    name: 'Password',
  },
  loginButton: {
    widgetType: 'BUTTON',
    strategy: 'role',
    role: 'button',
    name: 'Log in',
    exact: true, // <-- Ensures it matches the primary 'Log in' button and ignores 'Log in as guest'
  },
  userMenu: {
    widgetType: 'BUTTON',
    main: '.userinitials', // Kept as a CSS string fallback
  },

  // Future-proof example: A complex Web Table component using multiple named locators
  courseTable: {
    widgetType: 'WEB_TABLE',
    main: 'table.courses-table',       // Main table element
    row: 'tr.course-row',              // Row sub-locator
    cell: 'td.course-name',            // Cell sub-locator
    actionButton: 'button.enroll-btn', // Nested action sub-locator
  },
};