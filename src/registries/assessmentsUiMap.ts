// src/uiMap/assessmentsUiMap.ts
import type { UiMapEntry } from '../types/uiMapTypes';

export const assessmentsUiMap: Record<string, UiMapEntry> = {
  // Navigation Bar Tabs in Course Player Window
  assessmentsTab: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'link',
    name: 'Assessments',
  },

  // Search Control
  assessmentSearchInput: {
    widgetType: 'TEXTBOX',
    strategy: 'role',
    role: 'searchbox',
    name: 'Search Assessment',
  },

  // Web Table Definition
  assessmentsTable: {
    widgetType: 'WEB_TABLE',
    strategy: 'css',
    selector: 'table',
    rowSelector: 'tbody tr',
    columns: {
      Assessments: { index: 1, controlType: 'TEXT' },
      Status: { index: 2, controlType: 'LABEL' },
      StartDate: { index: 3, controlType: 'TEXT' },
      EndDate: { index: 4, controlType: 'TEXT' },
      Actions: {
        index: 5,
        controlType: 'BUTTON',
        subSelector: 'button[aria-label="Action Menu"]', // Angular Material 3-dot trigger
      },
    },
  },

  // Contextual popup menu items
  editActionMenuItem: {
    widgetType: 'BUTTON',
    strategy: 'role',
    role: 'button',
    name: 'Edit',
  },
};