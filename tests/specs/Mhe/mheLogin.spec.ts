import { test } from '@playwright/test';
import * as path from 'path';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';

// Synchronously load the MHE YAML suite at module evaluation time
const suitePath = path.resolve(process.cwd(), 'tests/suites/Mhe/mhe_LoginSteps.yaml');
const suite = loadYamlSuite(suitePath);

test.describe('MHE User Authentication Test Scenarios', () => {
  test('Successful login into MHE Delivery Player with valid credentials', async ({ page }) => {
    const dispatcher = await CommandDispatcher.fromSuite(suite);
    await dispatcher.executeProfile(page, 'default', suite);
    debugger;
  });
});