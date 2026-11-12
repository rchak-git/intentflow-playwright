import type { UiMapEntry } from '../../types/uiMapTypes';

export const MheLoginUiMap: Record<string, UiMapEntry> = {
  mhe_login_usernameLabel: {
    widgetType: 'LABEL',
    strategy: 'css',
    selector: 'label[for="username"]',
    exact: true
  },
  mhe_login_usernameTextbox: {
    widgetType: 'TEXTBOX',
    strategy: 'css',
    selector: '#username',
    exact: true
  },
  mhe_login_passwordLabel: {
    widgetType: 'LABEL',
    strategy: 'css',
    selector: 'label[for="password"]',
    exact: true
  },
  mhe_login_passwordTextbox: {
    widgetType: 'TEXTBOX',
    strategy: 'css',
    selector: '#password',
    exact: true
  },
  mhe_login_forgotPasswordLink: {
    widgetType: 'LINK',
    strategy: 'xpath',
    selector: "//a[contains(@class, 'forgot-link') and normalize-space(text())='Forgot password?']",
    exact: true
  },
  mhe_login_loginButton: {
    widgetType: 'BUTTON',
    strategy: 'xpath',
    selector: "//button[contains(@class, 'btn-action') and normalize-space(text())='Login']",
    exact: true
  }
};