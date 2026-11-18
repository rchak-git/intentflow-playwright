import { test } from '@playwright/test';
import { resolveLoginData } from '../../../src/config/runtimeConfig';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';

test('Student logs in', async ({ page }) => {
  const { username, password } = resolveLoginData('student');
  const suite = loadYamlSuite('tests/suites/Moodle/studentLoginSteps.yaml');
  const profile = suite.profiles?.td_studentLogin;
  if (!profile) throw new Error('The student login profile is missing.');
  profile.data = { ...profile.data, username, password };
  await (await CommandDispatcher.fromSuite(suite)).executeProfile(page, 'td_studentLogin');
});
