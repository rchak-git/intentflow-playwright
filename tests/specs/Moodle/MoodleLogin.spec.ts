import { test } from '@playwright/test';
import * as path from 'path';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';

test.describe('Moodle', () => {
  let suite: ReturnType<typeof loadYamlSuite>;

  test.beforeAll(() => {
    const suitePath = path.resolve(
      process.cwd(),
      'tests/suites/Moodle/MoodleLoginSuite.yaml',
    );
    suite = loadYamlSuite(suitePath);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login/index.php');
  });

  test('Moodle_ValidLogin: Verify Student Login into Moodle Portal', async ({ page }) => {
    const dispatcher = await CommandDispatcher.fromSuite(suite);
    await dispatcher.executeProfile(page, 'validStudentLogin', suite);
  });
});
