import { expect, test } from '@playwright/test';
import { RichTextControl } from '../../../src/controls/richTextControl';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import { globalContextStore } from '../../../src/engine/contextStore';
import { SuiteSpecSchema } from '../../../src/types/intentSchema';
import type { UiMapEntry } from '../../../src/types/uiMapTypes';

const uiMap: Record<string, UiMapEntry> = {
  editor: { widgetType: 'RICH_TEXT', strategy: 'css', selector: '[contenteditable]' },
  framedEditor: { widgetType: 'RICH_TEXT', strategy: 'css', selector: 'body', frameSelector: 'iframe[title="Editor"]' },
};

test('dispatches plain text entry, verification, extraction, and clearing', async ({ page }) => {
  await page.setContent('<div contenteditable="true"></div>');
  const suite = SuiteSpecSchema.parse({
    uiMap: 'globalUiMap',
    profiles: { root: { data: { content: '<b>Text</b> and more' }, steps: [
      { fieldKey: 'editor', widgetType: 'RICH_TEXT', intent: 'populate', params: { value: '${data:content}' } },
      { fieldKey: 'editor', intent: 'verify', params: { subIntent: 'equals', value: '<b>Text</b> and more' } },
      { fieldKey: 'editor', intent: 'verify', params: { subIntent: 'contains', value: 'and more' } },
      { fieldKey: 'editor', intent: 'extract', params: { storeAs: 'editorText' } },
    ] } },
  });
  await new CommandDispatcher(uiMap, suite).executeProfile(page, 'root');
  const editor = page.locator('[contenteditable]');
  await expect(editor.locator('b')).toHaveCount(0);
  expect(globalContextStore.get('editorText')).toBe('<b>Text</b> and more');
  expect(await new RichTextControl(page, uiMap.editor).getValue()).toBe('<b>Text</b> and more');

  const clearSuite = SuiteSpecSchema.parse({
    uiMap: 'globalUiMap',
    profiles: { root: { steps: [
      { fieldKey: 'editor', intent: 'action', params: { subIntent: 'clear' } },
      { fieldKey: 'editor', intent: 'verify', params: { subIntent: 'equals', value: '' } },
    ] } },
  });
  await new CommandDispatcher(uiMap, clearSuite).executeProfile(page, 'root');
  await expect(editor).toHaveText('');
});

test('operates on an iframe editor and verifies rendered formatted text', async ({ page }) => {
  await page.setContent('<iframe title="Editor" srcdoc="<body contenteditable=\'true\'></body>"></iframe>');
  const control = new RichTextControl(page, uiMap.framedEditor);
  await control.populate('First line\nSecond line');
  await control.verify('contains', 'Second line');
  expect(await control.getValue()).toContain('First line');
  await control.action({ subIntent: 'clear' });
  await control.verify('equals', '');

  const body = page.frameLocator('iframe[title="Editor"]').locator('body');
  await body.evaluate(element => { element.innerHTML = '<p>Already <strong>formatted</strong></p>'; });
  await control.verify('equals', 'Already formatted');
});

test('rejects invalid values and unsupported operations rather than falling back', async ({ page }) => {
  await page.setContent('<div contenteditable="true"></div>');
  const control = new RichTextControl(page, uiMap.editor);
  await expect(control.populate(['a', 'b'])).rejects.toThrow('plain-text string');
  await expect(control.populate('x', { subIntent: 'append' })).rejects.toThrow('does not support');
  await expect(control.verify('optionsContains', 'x')).rejects.toThrow('does not support');
  await expect(control.verify('equals', 1)).rejects.toThrow('plain-text string');
  await expect(control.verify('equals', 'wrong', { timeout: 250 })).rejects.toThrow();
});
