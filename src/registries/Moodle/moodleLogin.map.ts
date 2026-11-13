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
  moodle_login_toggleSensitiveButton: {
    widgetType: 'BUTTON',
    strategy: 'role',
    role: 'button',
    text: 'Toggle sensitive',
    exact: true
  }
};