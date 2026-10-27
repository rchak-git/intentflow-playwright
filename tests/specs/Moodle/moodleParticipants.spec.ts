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
  });
});