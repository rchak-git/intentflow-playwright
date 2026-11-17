import { test } from '@playwright/test';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';
import { resolveLoginData } from '../../../src/config/runtimeConfig';

test('Admin verifies participants through recursive setup', async ({ page }) => {
  const { username, password } = resolveLoginData('admin');

  const suite = loadYamlSuite('tests/suites/recursive_moodle/recursiveParticipantsSteps.yaml');
  const precondition = suite.profiles?.td_recursiveAdminVerifyParticipants?.preconditions?.[0];
  if (!precondition || precondition.refProfile !== 'setup_recursiveAdminParticipantsPage') {
    throw new Error('The recursive participants setup precondition is missing.');
  }
  precondition.data = { ...precondition.data, username, password };

  const dispatcher = await CommandDispatcher.fromSuite(suite);
  await dispatcher.executeProfile(page, 'td_recursiveAdminVerifyParticipants');
});
