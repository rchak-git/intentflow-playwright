import { test } from '@playwright/test';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import { SuiteSpec } from '../../../src/types/intentSchema';

const SUITE_PATH = 'tests/suites/temp/muiAutocompleteSteps.yaml';

test.describe('React Material UI Search / Autocomplete Control Suite', () => {
  let suite: SuiteSpec;

  test.beforeAll(() => {
    suite = loadYamlSuite(SUITE_PATH);
  });

  test('Search, select option from portaled listbox, and clear React MUI combobox', async ({ page }) => {
    page.goto("https://mui.com/material-ui/react-autocomplete/");
    const dispatcher = await CommandDispatcher.fromSuite(suite);
    await dispatcher.executeProfile(page, 'td_searchAndSelectMovie', suite);
  });
});