import { test } from '@playwright/test';
import { resolveLoginData } from '../../../src/config/runtimeConfig';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';

test('Student verifies course participants', async ({ page }) => {
  const { username, password } = resolveLoginData('student');
  const suite = loadYamlSuite('tests/suites/pilot_moodle/studentParticipantsSteps.yaml');
  const precondition = suite.profiles?.td_studentVerifyCourseParticipants?.preconditions?.[0];
  if (!precondition || precondition.refProfile !== 'td_studentNavigateToMyCourses') {
    throw new Error('The My courses precondition is missing.');
  }
  precondition.data = { ...precondition.data, username, password };
  await (await CommandDispatcher.fromSuite(suite)).executeProfile(page, 'td_studentVerifyCourseParticipants');
});
