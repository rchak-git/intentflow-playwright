import { test } from '@playwright/test';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';

test.describe('Moodle Course & Participants Suite', () => {
  test('Authenticated user views course participants table', async ({ page }) => {
    // 1. Load the course suite YAML (recursively resolves parent includes)
    const suiteSpec = loadYamlSuite('tests/suites/Moodle/moodleCourseSteps.yaml');

    // 2. Instantiate CommandDispatcher (merges MoodleHomePageUiMap & MoodleCourseUiMap)
    const dispatcher = await CommandDispatcher.fromSuite(suiteSpec);

    // 3. Run target scenario profile
    await dispatcher.executeProfile(page, 'td_navigateToParticipants', suiteSpec);
    debugger;
  });
});