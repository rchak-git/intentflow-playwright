import { expect, test } from '@playwright/test';
import { CommandDispatcher } from '../../../src/engine/commandDispatcher';
import type { SuiteSpec } from '../../../src/types/intentSchema';
import type { UiMapEntry } from '../../../src/types/uiMapTypes';

const uiMap: Record<string, UiMapEntry> = {
  input: { widgetType: 'TEXTBOX', strategy: 'css', selector: '#input' },
  first: { widgetType: 'BUTTON', strategy: 'css', selector: '#first' },
  second: { widgetType: 'BUTTON', strategy: 'css', selector: '#second' },
  last: { widgetType: 'BUTTON', strategy: 'css', selector: '#last' },
};

test.beforeEach(async ({ page }) => {
  await page.setContent(`
    <body data-order="">
      <input id="input">
      <button id="first" onclick="document.body.dataset.order += 'A'">first</button>
      <button id="second" onclick="document.body.dataset.order += 'B'">second</button>
      <button id="last" onclick="document.body.dataset.order += 'C'">last</button>
    </body>
  `);
});

test('executes recursive preconditions in order once and bubbles data', async ({ page }) => {
  const suite: SuiteSpec = {
    uiMap: 'moodleUiMap',
    profiles: {
      root: {
        preconditions: [{ refProfile: 'middle', data: { input: 'outer' } }, { refProfile: 'setup' }],
        steps: [{ fieldKey: 'last', intent: 'action' }],
      },
      middle: {
        preconditions: [{ refProfile: 'setup', data: { input: 'inner' } }],
        steps: [{ fieldKey: 'second', intent: 'action' }],
      },
      setup: {
        steps: [
          { fieldKey: 'input', intent: 'populate', params: { value: '${data:input}' } },
          { fieldKey: 'first', intent: 'action' },
        ],
      },
    },
  };
  await new CommandDispatcher(uiMap, suite).executeProfile(page, 'root');
  await expect(page.locator('body')).toHaveAttribute('data-order', 'ABC');
  await expect(page.locator('#input')).toHaveValue('outer');
});

test('blocks a missing upstream profile before earlier precondition actions', async ({ page }) => {
  const suite: SuiteSpec = {
    uiMap: 'moodleUiMap',
    profiles: {
      root: { preconditions: [{ refProfile: 'setup' }, { refProfile: 'missing' }], steps: [{ fieldKey: 'last', intent: 'action' }] },
      setup: { steps: [{ fieldKey: 'first', intent: 'action' }] },
    },
  };
  await expect(new CommandDispatcher(uiMap, suite).executeProfile(page, 'root')).rejects.toThrow(/MISSING_PROFILES/);
  await expect(page.locator('body')).toHaveAttribute('data-order', '');
});

test('blocks a missing field key before running preconditions', async ({ page }) => {
  const suite: SuiteSpec = {
    uiMap: 'moodleUiMap',
    profiles: {
      root: { preconditions: [{ refProfile: 'setup' }], steps: [{ fieldKey: 'missing', intent: 'action' }] },
      setup: { steps: [{ fieldKey: 'first', intent: 'action' }] },
    },
  };
  await expect(new CommandDispatcher(uiMap, suite).executeProfile(page, 'root')).rejects.toThrow(/MISSING_UI_MAP_ENTRIES/);
  await expect(page.locator('body')).toHaveAttribute('data-order', '');
});

test('resolves forwarded dynamic keys before executing a profile', async ({ page }) => {
  const suite: SuiteSpec = {
    uiMap: 'moodleUiMap',
    sharedScenarios: { click: [{ fieldKey: '${data:target}', intent: 'action' }] },
    profiles: {
      root: { data: { button: 'first' }, steps: [{ refScenario: 'click', data: { target: '${data:button}' } }] },
    },
  };
  await new CommandDispatcher(uiMap, suite).executeProfile(page, 'root');
  await expect(page.locator('body')).toHaveAttribute('data-order', 'A');
});

test('blocks a nested scenario key overridden by a referenced profile before preconditions', async ({ page }) => {
  const suite: SuiteSpec = {
    uiMap: 'moodleUiMap',
    sharedScenarios: {
      outer: [{ refProfile: 'nested', data: { target: 'missing' } }],
      inner: [{ fieldKey: '${data:target}', intent: 'action' }],
    },
    profiles: {
      root: {
        preconditions: [{ refProfile: 'setup' }],
        data: { target: 'last' },
        steps: [{ refScenario: 'outer' }],
      },
      setup: { steps: [{ fieldKey: 'first', intent: 'action' }] },
      nested: { steps: [{ refScenario: 'inner' }] },
    },
  };
  await expect(new CommandDispatcher(uiMap, suite).executeProfile(page, 'root')).rejects.toThrow(/MISSING_UI_MAP_ENTRIES.*missing/);
  await expect(page.locator('body')).toHaveAttribute('data-order', '');
});

test('rejects cyclic preconditions before running actions', async ({ page }) => {
  const suite: SuiteSpec = {
    uiMap: 'moodleUiMap',
    profiles: {
      root: { preconditions: [{ refProfile: 'loop' }], steps: [{ fieldKey: 'last', intent: 'action' }] },
      loop: { preconditions: [{ refProfile: 'root' }], steps: [{ fieldKey: 'first', intent: 'action' }] },
    },
  };
  await expect(new CommandDispatcher(uiMap, suite).executeProfile(page, 'root')).rejects.toThrow(/Cyclic profile reference/);
  await expect(page.locator('body')).toHaveAttribute('data-order', '');
});

test('executes a precondition override instead of the original profile', async ({ page }) => {
  const suite: SuiteSpec = {
    uiMap: 'moodleUiMap',
    profiles: {
      root: { preconditions: [{ refProfile: 'middle', overrides: { original: 'replacement' } }], steps: [{ fieldKey: 'last', intent: 'action' }] },
      middle: { preconditions: [{ refProfile: 'original' }], steps: [{ fieldKey: 'second', intent: 'action' }] },
      original: { steps: [{ fieldKey: 'input', intent: 'populate', params: { value: 'original' } }] },
      replacement: { steps: [{ fieldKey: 'first', intent: 'action' }] },
    },
  };
  await new CommandDispatcher(uiMap, suite).executeProfile(page, 'root');
  await expect(page.locator('body')).toHaveAttribute('data-order', 'ABC');
  await expect(page.locator('#input')).toHaveValue('');
});

test('rejects unknown maps even if preflight is skipped', async () => {
  await expect(CommandDispatcher.fromSuite({ uiMap: 'unknownMap' }, { skipPreflight: true })).rejects.toThrow(/unknownMap/);
});

test('skipping preflight does not allow missing preconditions', async ({ page }) => {
  const suite: SuiteSpec = {
    uiMap: 'moodleUiMap',
    profiles: { root: { preconditions: [{ refProfile: 'missing' }], steps: [{ fieldKey: 'last', intent: 'action' }] } },
  };
  await expect(new CommandDispatcher(uiMap, suite, { skipPreflight: true }).executeProfile(page, 'root'))
    .rejects.toThrow(/missing.*not found/);
});

test('uses the override suite for both preflight and scenario execution', async ({ page }) => {
  const bound: SuiteSpec = { uiMap: 'moodleUiMap', sharedScenarios: { go: [{ fieldKey: 'first', intent: 'action' }] } };
  const override: SuiteSpec = {
    uiMap: 'moodleUiMap',
    sharedScenarios: { go: [{ fieldKey: 'last', intent: 'action' }] },
    profiles: { root: { steps: [{ refScenario: 'go' }] } },
  };
  await new CommandDispatcher(uiMap, bound).executeProfile(page, 'root', override);
  await expect(page.locator('body')).toHaveAttribute('data-order', 'C');
});
