import { test } from '@playwright/test';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import { SuiteSpec } from '../../../src/types/intentSchema';

const SUITE_PATH = 'tests/suites/temp/angularMaterialCardSteps.yaml';

test.describe('Angular Material Card Control Suite', () => {
  let suite: SuiteSpec;

  test.beforeAll(() => {
    suite = loadYamlSuite(SUITE_PATH);
  });

  test('Verify mat-card metadata and click nested MDC action buttons', async ({ page }) => {
    page.goto ("https://material.angular.dev/components/card/overview")
    const dispatcher = await CommandDispatcher.fromSuite(suite);
    await dispatcher.executeProfile(page, 'td_verifyAndInteractWithShibaCard', suite);
  });
});