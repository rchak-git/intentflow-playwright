import { UiMapEntry } from '../../types/uiMapTypes';

export const moodleLoginUiMap: Record<string, UiMapEntry> = {
  loginFormRegion: {
    widgetType: 'CONTAINER',
    strategy: 'css',
    selector: 'form#login',
  },
  usernameInput: {
    widgetType: 'TEXTBOX',
    strategy: 'label',
    text: 'Username',
    exact: true,
  },
  passwordInput: {
    widgetType: 'TEXTBOX',
    strategy: 'label',
    text: 'Password',
    exact: true,
  },
  loginButton: {
    widgetType: 'BUTTON',
    strategy: 'role',
    role: 'button',
    name: 'Log in',
    exact: true,
  },
  errorAlert: {
    widgetType: 'GENERIC',
    strategy: 'role',
    role: 'alert',
  },
  PAGE: {
    widgetType: 'PAGE',
    strategy: 'css',
    selector: 'body',
  },
};