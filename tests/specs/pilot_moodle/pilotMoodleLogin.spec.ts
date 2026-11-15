import { test } from '@playwright/test';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';

const suitePath = 'tests/suites/pilot_moodle/pilotMoodleLoginSteps.yaml';

test.describe('Pilot Moodle login scenarios', () => {
  for (const { title, profileName, usernameVariable, passwordVariable } of [
    {
      title: 'Successful login with valid admin credentials',
      profileName: 'td_pilotSuccessfulAdminLogin',
      usernameVariable: 'MOODLE_ADMIN_USERNAME',
      passwordVariable: 'MOODLE_ADMIN_PASSWORD'
    },
    {
      title: 'Successful login with valid student credentials',
      profileName: 'td_pilotSuccessfulStudentLogin',
      usernameVariable: 'MOODLE_DEMO_USERNAME',
      passwordVariable: 'MOODLE_DEMO_PASSWORD'
    },
    {
      title: 'Unsuccessful login with invalid password',
      profileName: 'td_pilotInvalidPasswordLogin',
      usernameVariable: 'MOODLE_DEMO_USERNAME',
      passwordVariable: 'MOODLE_INVALID_PASSWORD'
    }
  ]) {
    test(title, async ({ page }) => {
      const username = process.env[usernameVariable];
      const password = process.env[passwordVariable];
      if (!username || !password) {
        throw new Error(`Set ${usernameVariable} and ${passwordVariable} before running this test.`);
      }

      const suite = loadYamlSuite(suitePath);
      const profile = suite.profiles?.[profileName];
      if (!profile) {
        throw new Error(`Profile '${profileName}' was not found in the pilot suite.`);
      }
      profile.data = { ...profile.data, username, password };

      const dispatcher = await CommandDispatcher.fromSuite(suite);
      await dispatcher.executeProfile(page, profileName, suite);
    });
  }
});
