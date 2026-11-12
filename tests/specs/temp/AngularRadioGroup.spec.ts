import { test } from '@playwright/test';
import * as path from 'path';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';

const suitePath = path.resolve(process.cwd(), 'tests/suites/temp/AngularRadioGroupSteps.yaml');
const suite = loadYamlSuite(suitePath);

test.describe('Angular Material Radio Group ngModel Two-Way Binding test scenarios', () => {
  test('Verify initial state, select a new season, and validate dynamic output', async ({ page }) => {
    const dispatcher = await CommandDispatcher.fromSuite(suite);
    await dispatcher.executeProfile(page, 'verifyAndSelectFavoriteSeasonProfile', suite);
  });
});