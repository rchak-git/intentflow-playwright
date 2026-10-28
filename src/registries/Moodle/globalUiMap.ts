// src/registries/globalUiMap.ts
import type { UiMapEntry } from '../../types/uiMapTypes';

export const GLOBAL_UI_MAP: Record<string, UiMapEntry> = {
  // ==========================================
  // MOODLE: LOGIN DOMAIN
  // ==========================================
  moodle_login_loginFormRegion: {
    widgetType: 'CONTAINER',
    strategy: 'css',
    selector: 'form#login',
  },
  moodle_login_usernameInput: {
    widgetType: 'TEXTBOX',
    strategy: 'label',
    text: 'Username',
    exact: true,
  },
  moodle_login_passwordInput: {
    widgetType: 'TEXTBOX',
    strategy: 'label',
    text: 'Password',
    exact: true,
  },
  moodle_login_loginButton: {
    widgetType: 'BUTTON',
    strategy: 'role',
    role: 'button',
    name: 'Log in',
    exact: true,
  },
  moodle_login_errorAlert: {
    widgetType: 'GENERIC',
    strategy: 'role',
    role: 'alert',
  },

  // ==========================================
  // MOODLE: HOME DOMAIN
  // ==========================================
  moodle_home_homeHeader: {
    widgetType: 'LABEL',
    strategy: 'role',
    role: 'heading',
    name: 'Available courses',
    exact: true,
  },
  moodle_home_courseLink: {
    widgetType: 'LINK',
    strategy: 'css',
    selector: 'a:has-text("{text}")',
  },

  // ==========================================
  // MOODLE: COURSE DOMAIN
  // ==========================================
  moodle_course_participantsTab: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'menuitem',
    name: 'Participants',
  },

  // ==========================================
  // MOODLE: PARTICIPANTS DOMAIN
  // ==========================================
 moodle_participants_participantsTable: {
  widgetType: 'WEB_TABLE',
  strategy: 'htmlTable',
  selector: 'table.userenrolment, table#participants',
  rowSelector: 'tbody tr',
  columns: {
    "User": 0,
    "Email": 1,     // <-- Updated from 2 to 1
    "Roles": 2,
    "Groups": 3,
    "LastAccess": 4,
    "Status": 5     // <-- Updated to 5
  }
},

  // ==========================================
  // GLOBAL / PAGE SCOPE
  // ==========================================
  PAGE: {
    widgetType: 'PAGE',
    strategy: 'css',
    selector: 'body',
  },
};