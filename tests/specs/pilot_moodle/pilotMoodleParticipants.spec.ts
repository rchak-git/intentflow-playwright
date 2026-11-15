import { test } from '@playwright/test';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';

const suitePath = 'tests/suites/pilot_moodle/pilotMoodleParticipantsSteps.yaml';

test('Admin verifies course participants list', async ({ page }) => {
  const username = process.env.MOODLE_ADMIN_USERNAME;
  const password = process.env.MOODLE_ADMIN_PASSWORD;
  if (!username || !password) {
    throw new Error('Set MOODLE_ADMIN_USERNAME and MOODLE_ADMIN_PASSWORD before running this test.');
  }

  const suite = loadYamlSuite(suitePath);
  const profile = suite.profiles?.td_pilotAdminVerifyCourseParticipants;
  const login = profile?.preconditions?.find(
    precondition => precondition.refProfile === 'td_pilotSuccessfulAdminLogin'
  );
  if (!login || !suite.profiles?.td_pilotSuccessfulAdminLogin) {
    throw new Error('The pilot admin login precondition is missing.');
  }
  login.data = { ...login.data, username, password };

  const dispatcher = await CommandDispatcher.fromSuite(suite);
  await dispatcher.executeProfile(page, 'td_pilotAdminVerifyCourseParticipants', suite);
});
