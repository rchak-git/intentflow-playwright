import { test } from '@playwright/test';
import * as path from 'path';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';

const suitePath = path.resolve(process.cwd(), 'tests/suites/Mhe/mheHomePageSteps.yaml');
const suite = loadYamlSuite(suitePath);

test.describe('MheHomePage test scenarios', () => {
  test('Search and navigate to course dashboard from Home Directory', async ({ page }) => {
    const dispatcher = await CommandDispatcher.fromSuite(suite);
    await dispatcher.executeProfile(page, 'td_searchAndOpenCourseDashboard', suite);
  });
});