// tests/specs/Moodle/MoodleLogin.spec.ts
import { test } from '@playwright/test';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';

test.describe('Moodle Sandbox - Authentication & Portability Test', () => {
  let dispatcher: CommandDispatcher;
  let suiteSpec: any;

  test.beforeAll(async () => {
    suiteSpec = await loadYamlSuite('tests/suites/Moodle/moodleLoginSuite.yaml');
    dispatcher = await CommandDispatcher.fromSuite(suiteSpec);
  });

  test('TC_MOODLE_001 - Verify Student Login on Moodle Stack', async ({ page }) => {
    // Navigation and field interaction are managed directly by the Intent Engine
    await dispatcher.executeProfile(page, 'validAdminLogin', suiteSpec);
    debugger;
  });
});