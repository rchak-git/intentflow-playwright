// tests/specs/temp/multipleWindows.spec.ts
import path from 'node:path';
import { test } from '@playwright/test';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import { loadYamlSuite } from '../../../src/engine/yamlLoader';

const suitePath = path.resolve(
  __dirname,
  '../../suites/temp/multipleWindowsSteps.yaml'
);

test.describe('Herokuapp Multiple Windows Multi-Tab POC', () => {
  test('Open new browser tab, verify content, and return to main tab', async ({ page }) => {
    const suite = loadYamlSuite(suitePath);
    const dispatcher = await CommandDispatcher.fromSuite(suite);

    await dispatcher.executeProfile(page, 'td_herokuMultipleWindows', suite);
  });
});