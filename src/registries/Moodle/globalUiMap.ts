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
      "Email": 1,
      "Roles": 2,
      "Groups": 3,
      "LastAccess": 4,
      "Status": 5
    }
  },

  moodle_participants_filterInput: {
    widgetType: 'TEXTBOX',
    strategy: 'placeholder',
    text: 'Search',
  },

  // ==========================================
  // GLOBAL / PAGE SCOPE
  // ==========================================
  PAGE: {
    widgetType: 'PAGE',
    strategy: 'css',
    selector: 'body',
  },

  // ==========================================
  // DUMMY UI ENTRIES (EXPERIMENT DISTRACTORS)
  // ==========================================

  // --- 1. LOGIN NEAR-COLLISIONS ---
  moodle_login_usernameField: {
    widgetType: 'TEXTBOX',
    strategy: 'css',
    selector: 'input#username',
  },
  moodle_login_userEmailInput: {
    widgetType: 'TEXTBOX',
    strategy: 'label',
    text: 'Email or Username',
  },
  moodle_login_submitButton: {
    widgetType: 'BUTTON',
    strategy: 'css',
    selector: 'button#loginbtn',
  },
  moodle_login_signInBtn: {
    widgetType: 'BUTTON',
    strategy: 'role',
    role: 'button',
    name: 'Sign In',
  },
  moodle_login_formContainer: {
    widgetType: 'CONTAINER',
    strategy: 'css',
    selector: 'div.login-container',
  },
  moodle_auth_loginButton: {
    widgetType: 'BUTTON',
    strategy: 'role',
    role: 'button',
    name: 'Log in',
  },

  // --- 2. HOME & DASHBOARD OVERLAPS ---
  moodle_home_availableCoursesHeader: {
    widgetType: 'LABEL',
    strategy: 'css',
    selector: 'h2.courses-title',
  },
  moodle_dashboard_courseCardLink: {
    widgetType: 'LINK',
    strategy: 'css',
    selector: 'div.course-card a',
  },
  moodle_home_courseCardTitle: {
    widgetType: 'LABEL',
    strategy: 'css',
    selector: '.course-name',
  },
  moodle_global_searchCourseInput: {
    widgetType: 'TEXTBOX',
    strategy: 'placeholder',
    text: 'Search courses',
  },

  // --- 3. COURSE & NAVIGATION PLURALIZATION TRAPS ---
  moodle_course_participantTab: {
    widgetType: 'LINK',
    strategy: 'css',
    selector: 'a[href*="user/index.php"]',
  },
  moodle_course_participantsLink: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'link',
    name: 'Participants',
  },
  moodle_course_rosterTab: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'menuitem',
    name: 'Class Roster',
  },
  moodle_navigation_participantsItem: {
    widgetType: 'LINK',
    strategy: 'css',
    selector: 'nav .participants-link',
  },

  // --- 4. PARTICIPANTS TABLE & FILTER ALIASES ---
  moodle_participants_userTable: {
    widgetType: 'WEB_TABLE',
    strategy: 'css',
    selector: 'table.participants-list',
  },
  moodle_participants_enrolledUsersTable: {
    widgetType: 'WEB_TABLE',
    strategy: 'htmlTable',
    selector: 'table#enrolled-users',
    columns: {
      "Name": 0,
      "EmailAddress": 1,
      "Role": 2,
    }
  },
  moodle_participants_searchInput: {
    widgetType: 'TEXTBOX',
    strategy: 'css',
    selector: 'input.user-search-input',
  },
  moodle_participants_filterByKeyword: {
    widgetType: 'TEXTBOX',
    strategy: 'placeholder',
    text: 'Filter',
  },
  moodle_participants_statusDropdown: {
    widgetType: 'TEXTBOX',
    strategy: 'css',
    selector: 'select#status-filter',
  },
};