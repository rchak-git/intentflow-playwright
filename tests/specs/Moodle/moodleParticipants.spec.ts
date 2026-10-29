import { test } from '@playwright/test';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import * as path from 'path';

test.describe('TC_MOODLE_002 - Participants Table Profile Verification Suite', () => {
  let dispatcher: CommandDispatcher;
  let suiteSpec: any;

  test.beforeAll(async () => {
    // Single suite load for the entire describe block using absolute path resolution
    const yamlPath = path.resolve(__dirname, '../../suites/Moodle/moodleParticipantsPage.yaml');
    suiteSpec = await loadYamlSuite(yamlPath);
    dispatcher = await CommandDispatcher.fromSuite(suiteSpec);
  });

  // 1. Verify Base Participants Table Navigation & Visibility
  test('TC_MOODLE_002_01 - Verify Participants Table is Visible', async ({ page }) => {
    await dispatcher.executeProfile(page, 'verifyParticipantsTableProfile', suiteSpec);
  });

  // 2. Verify Single User Integrity: Sam Student (Standard Profile)
  test('TC_MOODLE_002_02 - Verify Sam Student Row Data Integrity', async ({ page }) => {
    await dispatcher.executeProfile(page, 'verifySamStudentProfile', suiteSpec);
  });

  // 3. Verify Single User Integrity: Sam Student (AI-Generated Intent Profile)
  test('TC_MOODLE_002_03 - Verify Sam Student Data Integrity via AI-Generated Profile', async ({ page }) => {
    await dispatcher.executeProfile(page, 'verifySamStudentIntegrityProfile', suiteSpec);
  });

  // 4. Verify Single User Integrity: Terri Teacher
  test('TC_MOODLE_002_04 - Verify Terri Teacher Row Data Integrity', async ({ page }) => {
    await dispatcher.executeProfile(page, 'verifyTerriTeacherProfile', suiteSpec);
  });

  // 5. Verify Entire Roster (Sam Student + Terri Teacher)
  test('TC_MOODLE_002_05 - Verify Full Roster Cell Data Integrity', async ({ page }) => {
    await dispatcher.executeProfile(page, 'verifyFullRosterProfile', suiteSpec);
  });

  // 6. Verify Keyword Search Filter (AI-Generated Filter Profile)
  test('TC_MOODLE_002_06 - Verify Filter Participants Table by Keyword Search', async ({ page }) => {
    await dispatcher.executeProfile(page, 'filterParticipantsTableByKeywordSearch', suiteSpec);
    debugger;
  });
});