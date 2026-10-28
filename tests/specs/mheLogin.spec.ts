import { test } from '@playwright/test';
import * as path from 'path';
import { CommandDispatcher } from '../../src/engine/commandDispatcher';
import { loadYamlSuite } from '../../src/engine/yamlLoader';
import { globalContextStore } from '../../src/engine/contextStore';

test.describe('McGraw Hill AUT - Login Suite', () => {
  const suitePath = path.resolve(process.cwd(), 'tests/suites/mheLoginSuite.yaml');
  const suite = loadYamlSuite(suitePath);

  test('Verify Initial Login Form Controls State', async ({ page }) => {
    const dispatcher = await CommandDispatcher.fromSuite(suite);
    await dispatcher.executeProfile(page, 'loginFormInitialCheck', suite);
  });

  test('Authenticate Student User Flow', async ({ page }) => {
    const dispatcher = await CommandDispatcher.fromSuite(suite);
    await dispatcher.executeProfile(page, 'validStudentLogin', suite);
    debugger;
  });

  test('Verify Invalid Password Login Error Flow', async ({ page }) => {
    const dispatcher = await CommandDispatcher.fromSuite(suite);
    await dispatcher.executeProfile(page, 'invalidStudentLogin', suite);
    debugger;
  });

  test('TC_LOGIN_002: Verify validation error when submitting login form with missing password', async ({ page }) => {
    const dispatcher = await CommandDispatcher.fromSuite(suite);
    await dispatcher.executeProfile(page, 'missingPasswordLogin', suite);
  });
});

test.describe('MHE Login Test Suite Execution', () => {
  test('Execute invalid student login profile and inspect captured context', async ({ page }, testInfo) => {
    const suite = loadYamlSuite('tests/suites/mheLoginSuite.yaml');
    const dispatcher = await CommandDispatcher.fromSuite(suite);

    try {
      await dispatcher.executeProfile(page, 'invalidStudentLogin', suite);
    } finally {
      const capturedUsername = globalContextStore.get('capturedUsername');

      console.log(`[Test Report] Captured Context Username: ${capturedUsername}`);

      await testInfo.attach('Runtime-Context-Dump', {
        body: JSON.stringify(
          {
            capturedUsername: capturedUsername ?? 'N/A',
            timestamp: new Date().toISOString(),
          },
          null,
          2
        ),
        contentType: 'application/json',
      });
    }
  });
});