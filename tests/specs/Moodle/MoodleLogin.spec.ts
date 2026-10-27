// tests/specs/Moodle/MoodleLogin.spec.ts
import { test } from '@playwright/test';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';

test.describe('Moodle Sandbox - Authentication & Portability Test', () => {
  let dispatcher: CommandDispatcher;
  let suiteSpec: any;

  test.beforeAll(async () => {
    // If your suite YAML was also moved into tests/suites/Moodle/
    suiteSpec = await loadYamlSuite('tests/suites/Moodle/moodleLoginSuite.yaml');
    // Otherwise, if it's still in tests/suites/:
    // suiteSpec = await loadYamlSuite('tests/suites/moodleLoginSuite.yaml');
    
    dispatcher = await CommandDispatcher.fromSuite(suiteSpec);
  });

  test('TC_MOODLE_001 - Verify Student Login on Moodle Stack', async ({ page }) => {
    await page.goto('https://sandbox.moodledemo.net/login/index.php');
    await page.waitForLoadState('networkidle');
    await dispatcher.executeProfile(page, 'validStudentLogin', suiteSpec);
    console.log("Wait here");
  });
});