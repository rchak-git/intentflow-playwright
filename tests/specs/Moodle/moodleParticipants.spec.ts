import { test } from '@playwright/test';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import { SuiteSpec } from '../../../src/types/intentSchema';

// Top-level path constant
const SUITE_PATH = 'tests/suites/Moodle/moodleParticipantSteps.yaml';

test.describe('Moodle Course Participants Table Workflows', () => {
  let suite: SuiteSpec;

  test.beforeAll(() => {
    // Synchronously parse suite at describe initialization
    suite = loadYamlSuite(SUITE_PATH);
  });

  test('Verify Course Participants list visibility and users', async ({ page }) => {
    const dispatcher = await CommandDispatcher.fromSuite(suite);
    await dispatcher.executeProfile(page, 'td_verifyCourseParticipantsList', suite);
  });

  test('Validate Participants table summary (count, visibility, content)', async ({ page }) => {
    const dispatcher = await CommandDispatcher.fromSuite(suite);
    await dispatcher.executeProfile(page, 'td_verifyParticipantsTableSummary', suite);
  });

  test('Assert column values anchored to dynamic rows (Paradigm 2 WebTable)', async ({ page }) => {
    const dispatcher = await CommandDispatcher.fromSuite(suite);
    await dispatcher.executeProfile(page, 'td_assertColumnValuesAnchoredToRow', suite);
  });

  test('Select participant checkbox and initiate bulk action', async ({ page }) => {
    const dispatcher = await CommandDispatcher.fromSuite(suite);
    await dispatcher.executeProfile(page, 'td_selectParticipantAndTriggerBulkAction', suite);
  });

  test('Extract table data into dynamic store context', async ({ page }) => {
    const dispatcher = await CommandDispatcher.fromSuite(suite);
    await dispatcher.executeProfile(page, 'td_extractRowValuesAndStoreDynamicTableState', suite);
  });

  test('Verify Select All header checkbox functionality', async ({ page }) => {
    const dispatcher = await CommandDispatcher.fromSuite(suite);
    await dispatcher.executeProfile(page, 'td_selectAllParticipantsTestSuite', suite);
  });
});