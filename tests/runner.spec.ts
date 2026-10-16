import { test, expect } from '@playwright/test';
import * as path from 'path';
import { loadAndValidateYaml } from '../src/engine/yamlLoader';

test.describe('IntentFlow Core Engine Runner', () => {
  test('smoke: example.com loads with expected title', async ({ page }) => {
    await page.goto('https://example.com');
    await expect(page).toHaveTitle(/Example Domain/);
  });

  test('Validate YAML Intent Loading', async () => {
    const yamlPath = path.resolve(__dirname, 'intents', 'sampleTest.yaml');
    const scenario = loadAndValidateYaml(yamlPath);

    expect(scenario.testName).toBe('Sample_Login_Smoke_Test');
    expect(scenario.steps.length).toBe(5);

    console.log('YAML Payload Successfully Loaded & Validated by Zod!');
  });
});
