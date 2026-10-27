import { test } from '@playwright/test';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';

test.describe('Moodle Sandbox - Home Page Operations', () => {
  let dispatcher: CommandDispatcher;
  let suiteSpec: any;

  test.beforeAll(async () => {
    suiteSpec = await loadYamlSuite('tests/suites/Moodle/moodleHomePage.yaml');
    dispatcher = await CommandDispatcher.fromSuite(suiteSpec);
  });

  test('TC_MOODLE_HOME_001 - Verify Home Page and Navigate to Course', async ({ page }) => {
    await page.goto('https://sandbox.moodledemo.net/login/index.php');
    await page.waitForLoadState('networkidle');
    await dispatcher.executeProfile(page, 'navigateToCourseProfile', suiteSpec);
    debugger;
  });
});