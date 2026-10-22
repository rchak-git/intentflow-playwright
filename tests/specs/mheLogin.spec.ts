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

    await page.goto('https://mhufrostlor-qa.learningmate.com/delivery-player/#/dashboard');
    await dispatcher.executeProfile(page, 'loginFormInitialCheck', suite);
  });

  test('Authenticate Student User Flow', async ({ page }) => {
    const dispatcher = await CommandDispatcher.fromSuite(suite);

    await page.goto('https://mhufrostlor-qa.learningmate.com/delivery-player/#/dashboard');
    await dispatcher.executeProfile(page, 'validStudentLogin', suite);
  });

  test('Verify Invalid Password Login Error Flow', async ({ page }) => {
    const dispatcher = await CommandDispatcher.fromSuite(suite);

    await page.goto('https://mhufrostlor-qa.learningmate.com/delivery-player/#/login');
    await dispatcher.executeProfile(page, 'invalidStudentLogin', suite);
  });

  test('TC_LOGIN_002: Verify validation error when submitting login form with missing password', async ({ page }) => {
  const dispatcher = await CommandDispatcher.fromSuite(suite);
  await page.goto('https://mhufrostlor-qa.learningmate.com/delivery-player/#/dashboard');
  await dispatcher.executeProfile(page, 'missingPasswordLogin', suite);
});
  
});

test.describe('MHE Login Test Suite Execution', () => {
  test('Execute invalid student login profile and inspect captured context', async ({ page }, testInfo) => {
    // 1. Load YAML Suite definition
    const suite = loadYamlSuite('tests/suites/mheLoginSuite.yaml');

    // 2. Initialize CommandDispatcher
    const dispatcher = await CommandDispatcher.fromSuite(suite);

    // 3. Navigate to application target (or mock server)
    await page.goto('https://mhufrostlor-qa.learningmate.com/delivery-player/#/dashboard'); // replace with your URL

    try {
      // 4. Run invalid login profile
      await dispatcher.executeProfile(page, 'invalidStudentLogin', suite);
    } finally {
      // 5. Attach stored runtime values into Playwright report & log to console
      const capturedUsername = globalContextStore.get('capturedUsername');

      console.log(`[Test Report] Captured Context Username: ${capturedUsername}`);

      await testInfo.attach('Runtime-Context-Dump', {
        body: JSON.stringify({
          capturedUsername: capturedUsername ?? 'N/A',
          timestamp: new Date().toISOString()
        }, null, 2),
        contentType: 'application/json'
      });
    }
  });
});