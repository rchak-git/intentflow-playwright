// src/registries/studentDashboardUiMap.ts
import type { UiMapEntry } from '../types/uiMapTypes';

export const studentDashboardUiMap: Record<string, UiMapEntry> = {
  page: {
    widgetType: 'PAGE',
    strategy: 'css',
    selector: 'body'
  },

  courseSearchInput: {
    widgetType: 'SEARCH',
    strategy: 'role',
    role: 'searchbox',
    name: 'Search courses',
    exact: false
  },

  teacherCountBadge: {
    widgetType: 'LABEL',
    strategy: 'css',
    selector: 'div.course-col:has-text("Theme_MHUBlue")'
  },

  studentCountBadge: {
    widgetType: 'LABEL',
    strategy: 'css',
    selector: 'div.course-col:has-text("Theme_MHUBlue")'
  },

  manageUsersBtn: {
    widgetType: 'BUTTON',
    strategy: 'css',
    selector: 'div.course-col:has-text("Theme_MHUBlue") button:has-text("Manage users")'
  },
  // --- Assign Users Modal Table ---
 assignUsersTable: {
    widgetType: 'WEB_TABLE',
    strategy: 'htmlTable',
    selector: 'table.assign-users-table',
    rowSelector: 'tr.assign-user-row',
    columns: {
      'Select': 0,
      'Name': 1,
      'Created Date': 2,
      'Role': 3,
      'Status': 4
    }
  },
  updateUsersBtn: {
    widgetType: 'BUTTON',
    strategy: 'css',
    selector: 'button:has-text("Update users")'
  },

  // Modal Close Button (X or backdrop/close)
  modalCloseBtn: {
    widgetType: 'BUTTON',
    strategy: 'css',
    selector: '.modal-header button.close, button[aria-label="Close"]'
  },

 moodle_course_cardLink: {
    widgetType: 'LINK',
    strategy: 'css',
    selector: 'a[href*="lti/ui"]:has(img[alt="Theme_MHUBlue"])',
  },

  // Assessments Tab (In 2nd Window)
  moodle_coursePlayer_assessmentsTab: {
    widgetType: 'LINK',
    strategy: 'css',
    selector: 'a[routerlink="/assessment"]',
  },

  // Assessments Data Table
  moodle_assessments_dataTable: {
    widgetType: 'WEB_TABLE',
    strategy: 'css',
    selector: 'table.assessment-data-table',
  },

  // Kebab / Action Menu Button
  moodle_assessments_actionMenuButton: {
    widgetType: 'BUTTON',
    strategy: 'css',
    selector: 'button.more-options-btn[aria-label="Action Menu"]',
  },
};