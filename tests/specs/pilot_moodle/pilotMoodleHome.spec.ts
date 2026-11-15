import { test } from '@playwright/test';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';

const suitePath = 'tests/suites/pilot_moodle/pilotMoodleHomeSteps.yaml';

function loadSuiteWithLogin(profileName: string, account: 'student' | 'admin') {
  const usernameVariable = account === 'admin' ? 'MOODLE_ADMIN_USERNAME' : 'MOODLE_DEMO_USERNAME';
  const passwordVariable = account === 'admin' ? 'MOODLE_ADMIN_PASSWORD' : 'MOODLE_DEMO_PASSWORD';
  const loginProfile = account === 'admin' ? 'td_pilotSuccessfulAdminLogin' : 'td_pilotSuccessfulStudentLogin';
  const username = process.env[usernameVariable];
  const password = process.env[passwordVariable];
  if (!username || !password) {
    throw new Error(`Set ${usernameVariable} and ${passwordVariable} before running this test.`);
  }

  const suite = loadYamlSuite(suitePath);
  const profile = suite.profiles?.[profileName];
  const login = profile?.preconditions?.find(
    precondition => precondition.refProfile === loginProfile
  );
  if (!login || !suite.profiles?.[loginProfile]) {
    throw new Error(`The ${account} login precondition is missing for '${profileName}'.`);
  }
  login.data = { ...login.data, username, password };
  return suite;
}

test.describe('Pilot Moodle home page interactions', () => {
  test('Authenticated admin logs out via User Menu', async ({ page }) => {
    const suite = loadSuiteWithLogin('td_pilotAdminLogout', 'admin');
    const dispatcher = await CommandDispatcher.fromSuite(suite);
    await dispatcher.executeProfile(page, 'td_pilotAdminLogout', suite);
  });

  test('Authenticated user logs out via User Menu', async ({ page }) => {
    const suite = loadSuiteWithLogin('td_pilotStudentLogout', 'student');
    const dispatcher = await CommandDispatcher.fromSuite(suite);
    await dispatcher.executeProfile(page, 'td_pilotStudentLogout', suite);
  });

  test('Navigate to My Courses page', async ({ page }) => {
    const suite = loadSuiteWithLogin('td_pilotNavigateToMyCourses', 'student');
    const dispatcher = await CommandDispatcher.fromSuite(suite);
    await dispatcher.executeProfile(page, 'td_pilotNavigateToMyCourses', suite);
  });
});
