import { test } from '@playwright/test';
import * as path from 'path';
import { loadAndValidateYaml } from '../src/engine/yamlLoader';
import { CommandDispatcher } from '../src/engine/commandDispatcher';
import { moodleUiMap } from '../src/registries/moodleUiMap';

test.describe('IntentFlow Moodle LMS Login E2E', () => {
    test('should successfully execute login intents from YAML', async ({ page }) => {
        await page.goto('https://demo.moodle.net/');

        const yamlFilePath = path.resolve(process.cwd(), 'tests/intents/moodleLogin.yaml');
        const testFileContent = loadAndValidateYaml(yamlFilePath);

        const dispatcher = new CommandDispatcher(moodleUiMap);

        // One clean method call handles the entire scenario execution loop!
        await dispatcher.executeScenario(page, testFileContent.steps);
    });
});