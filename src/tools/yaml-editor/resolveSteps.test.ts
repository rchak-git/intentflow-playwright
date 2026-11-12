import { strict as assert } from 'assert';
import { test } from 'node:test';
import { expandProfile, type Suites } from './resolveSteps';

const suites: Suites = {
  'nested/main.yaml': {
    includes: ['setup.yaml'],
    profiles: {
      td_main: {
        preconditions: [{ refProfile: 'setup.td_setup', data: { input: 'override' } }],
        steps: [{ refScenario: 'outer', data: { target: 'button' } }, { step: 'last', intent: 'verify' }],
      },
    },
    sharedScenarios: {
      outer: { steps: [{ refScenario: 'inner' }] },
      inner: [{ step: 'click', fieldKey: '${data:target}', intent: 'action', params: { value: '${data:input}' } }],
    },
  },
  'nested/setup.yaml': {
    profiles: {
      td_setup: { preconditions: [{ refProfile: 'private' }], refScenario: 'setup' },
      private: { steps: [{ step: 'first', intent: 'action' }] },
    },
    sharedScenarios: { setup: { steps: [{ step: 'second', intent: 'populate' }] } },
  },
};

test('recursively expands nested preconditions, scenarios, and inline steps in order', () => {
  const result = expandProfile(suites, 'nested\\main.yaml', 'td_main');
  assert.deepEqual(result.steps.map(item => item.step.step), ['first', 'second', 'click', 'last']);
  assert.deepEqual(result.steps.map(item => item.source.file), [
    'nested/setup.yaml', 'nested/setup.yaml', 'nested/main.yaml', 'nested/main.yaml',
  ]);
  assert.deepEqual(result.overrides.map(item => item.data), [{ input: 'override' }, { target: 'button' }]);
  assert.deepEqual(result.steps[2].source.path, ['sharedScenarios', 'inner', 0]);
});

test('resolves unqualified and hash-qualified profiles and respects include precedence', () => {
  const files: Suites = {
    'main.yaml': {
      includes: ['base.yaml', 'last.yaml'],
      profiles: { td_main: { steps: [{ refProfile: 'shared' }, { refProfile: 'base.yaml#shared' }] } },
    },
    'base.yaml': { profiles: { shared: { steps: [{ step: 'base', intent: 'action' }] } } },
    'last.yaml': { profiles: { shared: { steps: [{ step: 'last', intent: 'action' }] } } },
  };
  assert.deepEqual(expandProfile(files, 'main.yaml', 'td_main').steps.map(item => item.step.step), ['last', 'base']);
});

test('reports missing and circular references instead of returning partial steps', () => {
  const files: Suites = { 'a.yaml': { profiles: { td_bad: { refScenario: 'missing' } } } };
  assert.throws(() => expandProfile(files, 'a.yaml', 'td_bad'), /Scenario 'missing' not found/);
  files['a.yaml'] = {
    profiles: { td_bad: { refScenario: 'a' } },
    sharedScenarios: { a: { steps: [{ refScenario: 'b' }] }, b: [{ refScenario: 'a' }] },
  };
  assert.throws(() => expandProfile(files, 'a.yaml', 'td_bad'), /Circular reference/);
  files['a.yaml'] = { profiles: { td_bad: { preconditions: [{ refProfile: 'td_bad' }], steps: [] } } };
  assert.throws(() => expandProfile(files, 'a.yaml', 'td_bad'), /Circular reference/);
});
