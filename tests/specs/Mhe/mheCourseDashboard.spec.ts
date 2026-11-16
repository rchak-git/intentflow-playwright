import { test } from '@playwright/test';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import { SuiteSpec } from '../../../src/types/intentSchema';

const SUITE_PATH = 'tests/suites/Mhe/mheCourseDashboardSteps.yaml';

test.describe('MHE Course Dashboard Navigation Workflows', () => {
  let suite: SuiteSpec;

  test.beforeAll(() => {
    suite = loadYamlSuite(SUITE_PATH);
  });

  test('Navigate to Assignments page from Course Dashboard', async ({ page }) => {
    const dispatcher = await CommandDispatcher.fromSuite(suite);
    await dispatcher.executeProfile(page, 'td_navigateToAssignments', suite);
  });
});