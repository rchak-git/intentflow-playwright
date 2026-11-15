import type { UiMapEntry } from '../../types/uiMapTypes';

export const PilotMoodleLoginUiMap: Record<string, UiMapEntry> = {
  pilot_moodle_login_usernameTextbox: {
    widgetType: 'TEXTBOX',
    strategy: 'label',
    text: 'Username',
    exact: true
  },
  pilot_moodle_login_passwordTextbox: {
    widgetType: 'TEXTBOX',
    strategy: 'label',
    text: 'Password',
    exact: true
  },
  pilot_moodle_login_submitButton: {
    widgetType: 'BUTTON',
    strategy: 'role',
    role: 'button',
    name: 'Log in',
    exact: true
  },
  pilot_moodle_login_errorLabel: {
    widgetType: 'LABEL',
    strategy: 'role',
    role: 'alert'
  },
  pilot_moodle_home_headingLabel: {
    widgetType: 'LABEL',
    strategy: 'css',
    selector: 'header h1'
  }
};
