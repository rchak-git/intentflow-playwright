import { test } from '@playwright/test';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';

test.describe('Moodle Course & Participants Suite', () => {
  test('Authenticated user verifies and opens course card', async ({ page }) => {
    const suiteSpec = loadYamlSuite('tests/suites/Moodle/moodleCourseSteps.yaml');
    const dispatcher = await CommandDispatcher.fromSuite(suiteSpec);

    await dispatcher.executeProfile(page, 'td_openCourseFromCard', suiteSpec);
  });

  test('Authenticated user views course participants table', async ({ page }) => {
    const suiteSpec = loadYamlSuite('tests/suites/Moodle/moodleCourseSteps.yaml');
    const dispatcher = await CommandDispatcher.fromSuite(suiteSpec);

    await dispatcher.executeProfile(page, 'td_navigateToCourseParticipants', suiteSpec);
  });
});