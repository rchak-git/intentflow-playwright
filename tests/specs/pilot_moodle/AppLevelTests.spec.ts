import { test } from '@playwright/test';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';

const suitePath = 'tests/suites/pilot_moodle/AppLevelYamlSteps.yaml';

test('Authenticated student logs out via the user menu', async ({ page }) => {
  const username = process.env.MOODLE_DEMO_USERNAME;
  const password = process.env.MOODLE_DEMO_PASSWORD;
  if (!username || !password) {
    throw new Error('Set MOODLE_DEMO_USERNAME and MOODLE_DEMO_PASSWORD before running this test.');
  }

  const suite = loadYamlSuite(suitePath);
  const profile = suite.profiles?.td_pilotApplicationLogout;
  const login = profile?.preconditions?.find(
    precondition => precondition.refProfile === 'td_pilotSuccessfulStudentLogin'
  );
  if (!login || !suite.profiles?.td_pilotSuccessfulStudentLogin) {
    throw new Error('The pilot student login precondition is missing.');
  }
  login.data = { ...login.data, username, password };

  const dispatcher = await CommandDispatcher.fromSuite(suite);
  await dispatcher.executeProfile(page, 'td_pilotApplicationLogout', suite);
});
