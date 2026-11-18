import { expect, test } from '@playwright/test';
import { resolveLoginData } from '../../../src/config/runtimeConfig';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';

test('Student enters and clears the profile description without saving', async ({ page }) => {
  let profileSubmitted = false;
  page.on('request', request => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/user/edit.php') {
      profileSubmitted = true;
    }
  });
  const { username, password } = resolveLoginData('student');
  const suite = loadYamlSuite('tests/suites/Moodle/moodleEditProfileSteps.yaml');
  const precondition = suite.profiles?.td_studentEnterAndClearDescription?.preconditions?.[0];
  if (!precondition || precondition.refProfile !== 'td_studentLogin') {
    throw new Error('The student login precondition is missing.');
  }
  precondition.data = { ...precondition.data, username, password };
  await (await CommandDispatcher.fromSuite(suite)).executeProfile(page, 'td_studentEnterAndClearDescription');
  expect(profileSubmitted).toBe(false);
});
