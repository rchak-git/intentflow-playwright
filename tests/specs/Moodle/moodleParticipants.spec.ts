import { test } from '@playwright/test';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import * as path from 'path';

test.describe('Moodle Course Participants Suite', () => {
  test('Verify Participants Roster WebTable using composition pattern', async ({ page }) => {
    // Load moodleParticipantsPage.yaml (which includes moodleCoursePage.yaml upstream)
    const yamlPath = path.resolve(__dirname, '../../suites/Moodle/moodleParticipantsPage.yaml');
    const suiteSpec = loadYamlSuite(yamlPath);

    const dispatcher = await CommandDispatcher.fromSuite(suiteSpec);
    await dispatcher.executeProfile(page, 'verifyParticipantsTableProfile');
    debugger;
  });
});



test.describe('TC_MOODLE_002 - Participants Table Profile Verification Suite', () => {
  let dispatcher: CommandDispatcher;
  let suiteSpec: any;

  test.beforeAll(async () => {
    // Load the page suite YAML containing our table scenarios and profiles
    suiteSpec = await loadYamlSuite('tests/suites/Moodle/moodleParticipantsPage.yaml');
    dispatcher = await CommandDispatcher.fromSuite(suiteSpec);
  });

  // 1. Verify Base Participants Table Navigation & Visibility
  test('TC_MOODLE_002_01 - Verify Participants Table is Visible', async ({ page }) => {
    await dispatcher.executeProfile(page, 'verifyParticipantsTableProfile', suiteSpec);
  });

  // 2. Verify Single User: Sam Student
  test('TC_MOODLE_002_02 - Verify Sam Student Row Data Integrity', async ({ page }) => {
    await dispatcher.executeProfile(page, 'verifySamStudentProfile', suiteSpec);
    debugger;
  });

  // 3. Verify Single User: Terri Teacher
  test('TC_MOODLE_002_03 - Verify Terri Teacher Row Data Integrity', async ({ page }) => {
    await dispatcher.executeProfile(page, 'verifyTerriTeacherProfile', suiteSpec);
  });

  // 4. Verify Entire Roster (Sam Student + Terri Teacher)
  test('TC_MOODLE_002_04 - Verify Full Roster Cell Data Integrity', async ({ page }) => {
    await dispatcher.executeProfile(page, 'verifyFullRosterProfile', suiteSpec);
  });
});