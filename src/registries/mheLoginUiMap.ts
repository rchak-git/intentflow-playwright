import type { UiMapEntry } from '../types/uiMapTypes';


export const mheLoginUiMap: Record<string, UiMapEntry> = {
  loginFormRegion: {
    widgetType: 'CONTAINER',
    strategy: 'role',
    role: 'region',
    name: 'Login form'
  },
  usernameInput: {
    widgetType: 'TEXTBOX',
    strategy: 'label',
    text: 'Username',
    exact: true
  },
  passwordInput: {
    widgetType: 'TEXTBOX',
    strategy: 'label',
    text: 'Password',
    exact: true
  },
  forgotPasswordLink: {
    widgetType: 'LINK',
    strategy: 'role',
    role: 'link',
    name: 'Forgot password',
    exact: true
  },
  loginSubmitBtn: {
  widgetType: 'BUTTON',
  strategy: 'role',
  role: 'button',
  name: 'Login',
  exact: false
},
  errorMessageBanner: {
    widgetType: 'GENERIC',
    strategy: 'text',
    text: 'Invalid username or password'
  },
  validationErrorBanner: {
    widgetType: 'GENERIC',
    strategy: 'role',
    role: 'alert'
  }
};