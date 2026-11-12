import type { UiMapEntry } from '../../types/uiMapTypes';

export const MoodleLoginPageUiMap: Record<string, UiMapEntry> = {
  moodle_login_usernameTextbox: {
    widgetType: 'TEXTBOX',
    strategy: 'label',
    text: 'Username',
    exact: true
  },
  moodle_login_passwordTextbox: {
    widgetType: 'TEXTBOX',
    strategy: 'label',
    text: 'Password',
    exact: true
  },
  moodle_login_toggleSensitiveButton: {
    widgetType: 'BUTTON',
    strategy: 'role',
    role: 'button',
    text: 'Toggle sensitive',
    exact: true
  },
  moodle_login_forgotPasswordLink: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'link',
    text: 'Forgot password?',
    exact: true
  },
  moodle_login_loginButton: {
    widgetType: 'BUTTON',
    strategy: 'role',
    role: 'button',
    text: 'Log in',
    exact: true
  },
  moodle_login_loginAsGuestButton: {
    widgetType: 'BUTTON',
    strategy: 'role',
    role: 'button',
    text: 'Log in as guest',
    exact: true
  },
  moodle_login_languageDropdownLink: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'button',
    text: 'English (United States) ‎(en_us)‎',
    exact: true
  },
  moodle_login_cookiesNoticeButton: {
    widgetType: 'BUTTON',
    strategy: 'role',
    role: 'button',
    text: 'Cookies notice',
    exact: true
  }
};