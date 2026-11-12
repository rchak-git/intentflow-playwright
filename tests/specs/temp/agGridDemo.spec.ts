// tests/specs/agGridDemo.spec.ts
import { test } from '@playwright/test';
import * as path from 'path';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';

const suitePath = path.resolve(process.cwd(), 'tests/suites/temp/AgGridTableSteps.yaml');
const suite = loadYamlSuite(suitePath);

test.describe('AG Grid Component Experiments', () => {
  test('Verify vehicle details in AG Grid div-based table', async ({ page }) => {
    // 1. Navigate to the target page
    await page.goto('https://www.ag-grid.com/javascript-data-grid/', { waitUntil: 'domcontentloaded' });

    // 2. Dispatch IntentFlow profile - BaseControl auto-scrolls the iframe 
    //    and TableControl auto-hydrates the rows seamlessly!
    const dispatcher = await CommandDispatcher.fromSuite(suite);
    await dispatcher.executeProfile(page, 'verifyVehicleDetailsInAgGridTableProfile', suite);
  });
});