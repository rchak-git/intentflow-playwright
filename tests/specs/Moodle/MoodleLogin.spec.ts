import { test } from '@playwright/test';
import * as path from 'path';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';

// Synchronously load the YAML suite at module evaluation time
const suitePath = path.resolve(process.cwd(), 'tests/suites/Moodle/moodleLoginSteps.yaml');
const suite = loadYamlSuite(suitePath);

test.describe('Moodle User Authentication test scenarios', () => {

  test('Successful login with valid student credentials', async ({ page }) => {
    const dispatcher = await CommandDispatcher.fromSuite(suite);
    await dispatcher.executeProfile(page, 'td_successfulStudentLogin', suite);
  });

  test('Successful login with valid admin credentials', async ({ page }) => {
    const dispatcher = await CommandDispatcher.fromSuite(suite);
    await dispatcher.executeProfile(page, 'td_successfulAdminLogin', suite);
  });

  test('Unsuccessful login with invalid password', async ({ page }) => {
    const dispatcher = await CommandDispatcher.fromSuite(suite);
    await dispatcher.executeProfile(page, 'td_unsuccessfulLoginWithInvalidPassword', suite);
  });

  test('Guest login access', async ({ page }) => {
    const dispatcher = await CommandDispatcher.fromSuite(suite);
    await dispatcher.executeProfile(page, 'td_guestLogin', suite);
  });

});