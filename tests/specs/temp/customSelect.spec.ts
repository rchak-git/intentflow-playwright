import { test } from '@playwright/test';
import * as path from 'path';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';

const suitePath = path.resolve(process.cwd(), 'tests/suites/temp/customSelectSteps.yaml');
const suite = loadYamlSuite(suitePath);

test.describe('State Selection via Custom Dropdown test scenarios', () => {
  test('Verify and interact with state custom select control', async ({ page }) => {
    const dispatcher = await CommandDispatcher.fromSuite(suite);
    await dispatcher.executeProfile(page, 'verifyAndInteractWithStateCustomSelectControlProfile', suite);
  });
});