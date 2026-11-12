// temp/angularTableDemo.spec.ts
import { test } from '@playwright/test';
import * as path from 'path';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';

const suitePath = path.resolve(process.cwd(), 'tests/suites/temp/AngularTableScenarioSteps.yaml');
const suite = loadYamlSuite(suitePath);

test.describe('Angular Material Table Experiments', () => {
  test('Verify element details in Angular Material periodic table', async ({ page }) => {
    const dispatcher = await CommandDispatcher.fromSuite(suite);
    await dispatcher.executeProfile(page, 'verifyPeriodicTableElementDetailsProfile', suite);
  });
});