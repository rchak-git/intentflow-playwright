import path from 'node:path';
import { expect, test } from '@playwright/test';
import { FileUploadControl } from '../../../src/controls/fileUploadControl';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import type { SuiteSpec } from '../../../src/types/intentSchema';
import type { UiMapEntry } from '../../../src/types/uiMapTypes';

const uiMap: Record<string, UiMapEntry> = {
  file: { widgetType: 'FILE_UPLOAD', strategy: 'css', selector: 'input[type=file]' },
};

test('selects a fixture through the dispatcher on a hidden file input', async ({ page }) => {
  await page.setContent('<input type="file" hidden>');
  const suite: SuiteSpec = {
    uiMap: 'globalUiMap',
    profiles: { root: { steps: [
      { fieldKey: 'file', intent: 'populate', params: { value: 'tests/fixtures/TempFile.txt' } },
    ] } },
  };
  await new CommandDispatcher(uiMap, suite).executeProfile(page, 'root');
  expect(await page.locator('input').evaluate(el => (el as HTMLInputElement).files?.[0]?.name)).toBe('TempFile.txt');
});

test('rejects invalid and nonexistent paths', async ({ page }) => {
  await page.setContent('<input type="file">');
  const control = new FileUploadControl(page, uiMap.file);
  await expect(control.populate(' ')).rejects.toThrow('non-empty file path');
  await expect(control.populate(['a', 'b'])).rejects.toThrow('non-empty file path');
  await expect(control.populate(path.join('tests', 'fixtures', 'missing-upload-file.txt'))).rejects.toThrow();
});
