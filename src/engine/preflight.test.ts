import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { loadYamlSuite } from './yamlLoader';
import { preflightSuite } from './preflight';
import type { SuiteSpec } from '../types/intentSchema';

test('checks a real included pilot profile without requiring runtime credentials', () => {
  const suite = loadYamlSuite('tests/suites/pilot_moodle/pilotMoodleParticipantsSteps.yaml');
  const report = preflightSuite(suite, 'td_pilotAdminVerifyCourseParticipants');
  assert.deepEqual(report.issues, []);
});

test('reports missing references, maps, keys and unsupported fallback operations together', () => {
  const suite: SuiteSpec = {
    uiMap: 'notRegistered',
    sharedScenarios: {
      common: [
        { fieldKey: 'notMapped', intent: 'action' },
        { fieldKey: 'pilot_moodle_login_submitButton', intent: 'populate', params: { value: 'x' } },
        { fieldKey: 'pilot_moodle_login_submitButton', intent: 'verify', params: { subIntent: 'count', value: 1 } },
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

test('uses runtime shallow preconditions and flags unsupported inline profile references', () => {
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
  assert.equal(report.issues.length, 1);
  assert.equal(report.issues[0].category, 'UNSUPPORTED_OPERATIONS');
  assert.match(report.issues[0].message, /Inline refProfile/);
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

test('CLI reports findings and exits nonzero for a missing profile', () => {
  const result = spawnSync(process.execPath, [
    '--import', 'tsx', 'src/cli/preflight.ts',
    '--suite', 'tests/suites/pilot_moodle/pilotMoodleParticipantsSteps.yaml',
    '--profile', 'doesNotExist',
  ], { encoding: 'utf8' });
  assert.equal(result.status, 1, result.stderr);
  const report: { issues: { category: string }[] } = JSON.parse(result.stdout);
  assert.equal(report.issues[0].category, 'MISSING_PROFILES');
});
