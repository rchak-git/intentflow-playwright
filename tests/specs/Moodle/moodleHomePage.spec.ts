import { test } from '@playwright/test';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import { SuiteSpec } from '../../../src/types/intentSchema';

// Top-level path constant
const SUITE_PATH = 'tests/suites/Moodle/moodleHomePageSteps.yaml';

test.describe('Moodle Home Page Workflows', () => {
  let suite: SuiteSpec;

  test.beforeAll(() => {
    // Read and parse the YAML suite once at describe-block initialization
    suite = loadYamlSuite(SUITE_PATH);
  });

  test('Authenticated user logs out via User Menu', async ({ page }) => {
    const dispatcher = await CommandDispatcher.fromSuite(suite);
    await dispatcher.executeProfile(page, 'td_studentLogout', suite);
  });

  test('Navigate to My Courses page', async ({ page }) => {
    const dispatcher = await CommandDispatcher.fromSuite(suite);
    await dispatcher.executeProfile(page, 'td_navigateToMyCourses', suite);
  });

  test('Navigate to Grades page via User Menu', async ({ page }) => {
    const dispatcher = await CommandDispatcher.fromSuite(suite);
    await dispatcher.executeProfile(page, 'td_navigateToStudentGrades', suite);
  });
});