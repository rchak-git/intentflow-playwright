import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadYamlSuite } from './yamlLoader';
import { preflightSuite } from './preflight';
import type { SuiteSpec } from '../types/intentSchema';
import type { UiMapEntry } from '../types/uiMapTypes';

test('checks a real included pilot profile without requiring runtime credentials', () => {
  const suite = loadYamlSuite('tests/suites/pilot_moodle/studentParticipantsSteps.yaml');
  const report = preflightSuite(suite, 'td_studentVerifyCourseParticipants');
  assert.deepEqual(report.issues, []);
});

test('reports missing references, maps, keys and unsupported fallback operations together', () => {
  const suite: SuiteSpec = {
    uiMap: 'notRegistered',
    sharedScenarios: {
      common: [
        { fieldKey: 'notMapped', intent: 'action' },
        { fieldKey: 'moodle_login_loginButton', intent: 'populate', params: { value: 'x' } },
        { fieldKey: 'moodle_login_loginButton', intent: 'verify', params: { subIntent: 'count', value: 1 } },
        { refScenario: 'absentScenario' },
      ],
    },
    profiles: {
      testProfile: {
        preconditions: [{ refProfile: 'absentProfile' }],
        steps: [{ refScenario: 'common' }],
      },
    },
  };
  const report = preflightSuite(suite, 'testProfile');
  assert.deepEqual(report.issues.map(issue => issue.category), [
    'MISSING_UI_MAPS', 'MISSING_PROFILES', 'MISSING_UI_MAP_ENTRIES',
    'UNSUPPORTED_OPERATIONS', 'UNSUPPORTED_OPERATIONS', 'MISSING_SCENARIOS',
  ]);
  assert.match(report.issues[2].location, /common.*steps\[1\]/);
  assert.deepEqual(preflightSuite(suite, 'unknown').issues.map(issue => issue.category), [
    'MISSING_UI_MAPS', 'MISSING_PROFILES',
  ]);
});

test('checks recursive preconditions and flags unsupported inline profile references', () => {
  const suite: SuiteSpec = {
    uiMap: 'moodleUiMap',
    profiles: {
      root: {
        preconditions: [{ refProfile: 'file.setup' }],
        steps: [{ refProfile: 'setup' }],
      },
      setup: {
        preconditions: [{ refProfile: 'notExecuted' }],
        steps: [{ fieldKey: 'page', intent: 'action', params: { subIntent: 'navigate', value: '/' } }],
      },
    },
  };
  const report = preflightSuite(suite, 'root');
  assert.deepEqual(report.issues.map(issue => issue.category), ['MISSING_PROFILES', 'UNSUPPORTED_OPERATIONS']);
  assert.match(report.issues[0].message, /notExecuted/);
  assert.match(report.issues[1].message, /Inline refProfile/);
});

test('uses dispatcher reference semantics for preconditions and scenario profile steps', () => {
  const nav = { fieldKey: 'page', intent: 'action' as const, params: { subIntent: 'navigate' as const, value: '/' } };
  const suite: SuiteSpec = {
    uiMap: 'moodleUiMap',
    sharedScenarios: { outer: [{ refProfile: 'file#setup' }] },
    profiles: {
      root: { steps: [{ refScenario: 'outer' }] },
      setup: { preconditions: [{ refProfile: 'unused' }], steps: [nav] },
      hash: { preconditions: [{ refProfile: 'file#setup' }], steps: [nav] },
    },
  };
  assert.deepEqual(preflightSuite(suite, 'root').issues, []);
  assert.equal(preflightSuite(suite, 'hash').issues[0].category, 'MISSING_PROFILES');
});

test('reports recursive cycles and honors profile overrides and deduplication', () => {
  const nav = { fieldKey: 'page', intent: 'action' as const, params: { subIntent: 'navigate' as const, value: '/' } };
  const suite: SuiteSpec = {
    uiMap: 'moodleUiMap',
    profiles: {
      root: { preconditions: [{ refProfile: 'middle', overrides: { original: 'replacement' } }, { refProfile: 'replacement' }], steps: [nav] },
      middle: { preconditions: [{ refProfile: 'original' }], steps: [nav] },
      replacement: { steps: [nav] },
      cycle: { preconditions: [{ refProfile: 'cycle' }], steps: [nav] },
    },
  };
  assert.deepEqual(preflightSuite(suite, 'root').issues, []);
  assert.match(preflightSuite(suite, 'cycle').issues[0].message, /Cyclic profile reference/);
});

test('rejects circular YAML includes with a clear error', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'intentflow-include-test-'));
  try {
    const first = path.join(directory, 'first.yaml');
    writeFileSync(first, 'uiMap: moodleUiMap\nincludes: [second.yaml]\n');
    writeFileSync(path.join(directory, 'second.yaml'), 'uiMap: moodleUiMap\nincludes: [first.yaml]\n');
    assert.throws(() => loadYamlSuite(first), /Circular suite includes/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('flags missing composite keys and unverified dynamic field keys', () => {
  const suite: SuiteSpec = {
    uiMap: 'moodleParticipantsUiMap',
    profiles: {
      root: {
        steps: [
          { fieldKey: 'moodle_participant_participantsTable', intent: 'verify', params: { subIntent: 'cellText', anchorText: 'Sam', column: 'missing', value: 'Sam' } },
          { fieldKey: '${data:field}', intent: 'action' },
        ],
      },
    },
  };
  assert.deepEqual(preflightSuite(suite, 'root').issues.map(issue => issue.category), [
    'MISSING_UI_MAP_ENTRIES', 'UNVERIFIED',
  ]);
});

test('resolves dynamic field keys with runtime scenario and precondition data precedence', () => {
  const uiMap: Record<string, UiMapEntry> = {
    existing: { widgetType: 'BUTTON', strategy: 'css', selector: '#existing' },
  };
  const suite: SuiteSpec = {
    uiMap: 'globalUiMap',
    sharedScenarios: {
      outer: [{ refProfile: 'nested', data: { field: 'missing' } }],
      inner: [{ fieldKey: '${data:field}', intent: 'action' }],
    },
    profiles: {
      valid: {
        preconditions: [{ refProfile: 'setup', data: { field: 'existing' } }],
        data: { selected: 'existing' },
        steps: [{ refScenario: 'inner', data: { field: '${data:selected}' } }],
      },
      setup: { data: { field: 'missing' }, steps: [{ fieldKey: '${data:field}', intent: 'action' }] },
      invalid: { data: { field: 'existing' }, steps: [{ refScenario: 'outer' }] },
      nested: { steps: [{ refScenario: 'inner' }] },
      unresolved: { steps: [{ fieldKey: '${data:unknown}', intent: 'action' }] },
    },
  };
  assert.deepEqual(preflightSuite(suite, 'valid', { uiMap }).issues, []);
  const invalid = preflightSuite(suite, 'invalid', { uiMap }).issues;
  assert.equal(invalid[0].category, 'MISSING_UI_MAP_ENTRIES');
  assert.match(invalid[0].message, /missing/);
  assert.equal(preflightSuite(suite, 'unresolved', { uiMap }).issues[0].category, 'UNVERIFIED');
});

test('accepts implemented card count and unscoped table extraction only', () => {
  const uiMap: Record<string, UiMapEntry> = {
    card: { widgetType: 'CARD', strategy: 'css', selector: '.card' },
    table: { widgetType: 'WEB_TABLE', strategy: 'css', selector: 'table', rowSelector: 'tr' },
  };
  const suite: SuiteSpec = {
    uiMap: 'globalUiMap',
    profiles: {
      root: {
        steps: [
          { fieldKey: 'card', intent: 'verify', params: { subIntent: 'count', value: 2 } },
          { fieldKey: 'table', intent: 'extract', params: { subIntent: 'tableData' } },
          { fieldKey: 'table', intent: 'extract', params: { subIntent: 'tableData', anchorText: 'row' } },
        ],
      },
    },
  };
  const issues = preflightSuite(suite, 'root', { uiMap }).issues;
  assert.equal(issues.length, 1);
  assert.equal(issues[0].category, 'UNSUPPORTED_OPERATIONS');
});

test('rejects weaker assertions and unsupported page and table operations', () => {
  const suite: SuiteSpec = {
    uiMap: 'globalUiMap',
    profiles: {
      root: {
        steps: [
          { fieldKey: 'page', intent: 'verify', params: { subIntent: 'state', value: 'visible' } },
          { fieldKey: 'moodle_participant_participantsTable', intent: 'verify', params: { subIntent: 'rowCount', value: 1 } },
          { fieldKey: 'page', intent: 'custom', params: { handler: 'switchTab', value: 'new' } },
          { fieldKey: 'page', intent: 'REQUIRES_SDET_HANDOFF' },
        ],
      },
    },
  };
  assert.deepEqual(preflightSuite(suite, 'root').issues.map(issue => issue.category), [
    'UNSUPPORTED_OPERATIONS', 'UNSUPPORTED_OPERATIONS', 'UNSUPPORTED_OPERATIONS',
  ]);
});

test('catches weaker select equality and a no-op custom-select state assertion', () => {
  const suite: SuiteSpec = {
    uiMap: 'globalUiMap',
    profiles: {
      root: {
        steps: [
          { fieldKey: 'moodle_participant_matchSelect', intent: 'verify', params: { subIntent: 'equals', value: 'all' } },
          { fieldKey: 'cust_select_stateSelect', intent: 'verify', params: { subIntent: 'state' } },
        ],
      },
    },
  };
  const issues = preflightSuite(suite, 'root').issues;
  assert.equal(issues.length, 2);
  assert.match(issues[0].message, /partial match/);
  assert.match(issues[1].message, /no assertion/);
});

test('accepts custom-select exact equality in the existing suite', () => {
  const suite = loadYamlSuite('tests/suites/temp/customSelectSteps.yaml');
  assert.deepEqual(preflightSuite(suite, 'verifyAndInteractWithStateCustomSelectControlProfile').issues, []);
});

test('validates file upload operations and requires a file path', () => {
  const uiMap: Record<string, UiMapEntry> = {
    upload: { widgetType: 'FILE_UPLOAD', strategy: 'css', selector: 'input[type=file]' },
  };
  const suite: SuiteSpec = {
    uiMap: 'globalUiMap',
    profiles: {
      valid: { steps: [{ fieldKey: 'upload', intent: 'populate', params: { value: 'tests/fixtures/TempFile.txt' } }] },
      invalid: { steps: [
        { fieldKey: 'upload', intent: 'populate', params: { value: '' } },
        { fieldKey: 'upload', intent: 'populate', params: { value: ['a', 'b'] } },
        { fieldKey: 'upload', intent: 'action', params: { subIntent: 'click' } },
        { fieldKey: 'upload', intent: 'populate', params: { value: 'file.txt', storeAs: 'file' } },
      ] },
    },
  };
  assert.deepEqual(preflightSuite(suite, 'valid', { uiMap }).issues, []);
  assert.equal(preflightSuite(suite, 'invalid', { uiMap }).issues.length, 4);
});

test('validates rich-text operations and plain-text values', () => {
  const uiMap: Record<string, UiMapEntry> = {
    editor: { widgetType: 'RICH_TEXT', strategy: 'css', selector: '[contenteditable]' },
  };
  const suite: SuiteSpec = {
    uiMap: 'globalUiMap',
    profiles: {
      valid: { steps: [
        { fieldKey: 'editor', intent: 'populate', params: { value: '' } },
        { fieldKey: 'editor', intent: 'verify', params: { subIntent: 'contains', value: 'text' } },
        { fieldKey: 'editor', intent: 'action', params: { subIntent: 'clear' } },
        { fieldKey: 'editor', intent: 'extract', params: { storeAs: 'text' } },
      ] },
      invalid: { steps: [
        { fieldKey: 'editor', intent: 'populate' },
        { fieldKey: 'editor', intent: 'populate', params: { value: ['a', 'b'] } },
        { fieldKey: 'editor', intent: 'populate', params: { subIntent: 'append', value: 'x' } },
        { fieldKey: 'editor', intent: 'verify', params: { subIntent: 'equals', value: 1 } },
      ] },
    },
  };
  assert.deepEqual(preflightSuite(suite, 'valid', { uiMap }).issues, []);
  assert.equal(preflightSuite(suite, 'invalid', { uiMap }).issues.length, 4);
});

test('CLI reports findings and exits nonzero for a missing profile', () => {
  const result = spawnSync(process.execPath, [
    '--import', 'tsx', 'src/cli/preflight.ts',
    '--suite', 'tests/suites/pilot_moodle/studentParticipantsSteps.yaml',
    '--profile', 'doesNotExist',
  ], { encoding: 'utf8' });
  assert.equal(result.status, 1, result.stderr);
  const report: { issues: { category: string }[] } = JSON.parse(result.stdout);
  assert.equal(report.issues[0].category, 'MISSING_PROFILES');
});
