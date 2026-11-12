import { test } from '@playwright/test';
import * as path from 'path';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';

const suitePath = path.resolve(process.cwd(), 'tests/suites/temp/ReactSelectSteps.yaml');
const suite = loadYamlSuite(suitePath);

test.describe('Verify and select a value in the custom color dropdown test scenarios', () => {
  test('Verify and select a value in the custom color dropdown', async ({ page }) => {
    const dispatcher = await CommandDispatcher.fromSuite(suite);
    await dispatcher.executeProfile(page, 'verifyAndSelectColorCustomSelectProfile', suite);
  });
});