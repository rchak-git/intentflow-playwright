import { expect, test } from '@playwright/test';
import { resolveLoginData, resolveRuntimeConfig } from '../../../src/config/runtimeConfig';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import type { SuiteSpec } from '../../../src/types/intentSchema';
import type { UiMapEntry } from '../../../src/types/uiMapTypes';

test('uses the configured base URL and forwards selected credentials through recursive setup', async ({ page }) => {
  const { baseURL } = resolveRuntimeConfig();
  const origin = new URL(baseURL).origin;
  await page.route(`${origin}/intentflow-config-test`, route => route.fulfill({
    contentType: 'text/html',
    body: '<input id="username"><input id="password"><button id="submit">Submit</button>',
  }));
  const { username, password } = resolveLoginData('student', ['student', 'admin'], {
    env: {
      INTENTFLOW_ENV: 'UAT',
      INTENTFLOW_LOGIN_PROFILE: 'admin',
      UAT_ADMIN_USERNAME: 'example-user',
      UAT_ADMIN_PASSWORD: 'example-password',
    },
  });
  const uiMap: Record<string, UiMapEntry> = {
    username: { widgetType: 'TEXTBOX', strategy: 'css', selector: '#username' },
    password: { widgetType: 'TEXTBOX', strategy: 'css', selector: '#password' },
    submit: { widgetType: 'BUTTON', strategy: 'css', selector: '#submit' },
  };
  const suite: SuiteSpec = {
    uiMap: 'moodleUiMap',
    profiles: {
      root: {
        preconditions: [{ refProfile: 'middle', data: { username, password }, overrides: { login: 'adminLogin' } }],
        steps: [{ fieldKey: 'submit', intent: 'verify', params: { subIntent: 'state', value: 'visible' } }],
      },
      middle: {
        preconditions: [{ refProfile: 'login' }],
        steps: [{ fieldKey: 'submit', intent: 'action' }],
      },
      login: {
        steps: [{ fieldKey: 'submit', intent: 'action' }],
      },
      adminLogin: {
        steps: [
          { fieldKey: 'page', intent: 'action', params: { subIntent: 'navigate', value: '/intentflow-config-test' } },
          { fieldKey: 'username', intent: 'populate', params: { value: '${data:username}' } },
          { fieldKey: 'password', intent: 'populate', params: { value: '${data:password}' } },
        ],
      },
    },
  };
  await new CommandDispatcher(uiMap, suite).executeProfile(page, 'root');
  await expect(page).toHaveURL(`${origin}/intentflow-config-test`);
  await expect(page.locator('#username')).toHaveValue('example-user');
  await expect(page.locator('#password')).toHaveValue('example-password');
});
