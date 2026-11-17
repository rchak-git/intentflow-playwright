import { test } from '@playwright/test';
import { resolveLoginData } from '../../../src/config/runtimeConfig';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';

test('Student opens My courses', async ({ page }) => {
  const { username, password } = resolveLoginData('student');
  const suite = loadYamlSuite('tests/suites/pilot_moodle/studentMyCoursesSteps.yaml');
  const precondition = suite.profiles?.td_studentNavigateToMyCourses?.preconditions?.[0];
  if (!precondition || precondition.refProfile !== 'td_studentLogin') {
    throw new Error('The student login precondition is missing.');
  }
  precondition.data = { ...precondition.data, username, password };
  await (await CommandDispatcher.fromSuite(suite)).executeProfile(page, 'td_studentNavigateToMyCourses');
});
