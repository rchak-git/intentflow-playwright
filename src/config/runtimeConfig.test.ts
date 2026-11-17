import { strict as assert } from 'node:assert';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { loadLocalEnv, resolveLoginData, resolveRuntimeConfig } from './runtimeConfig';

test('loads a local env file without overriding process values', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'intentflow-config-'));
  const keys = ['INTENTFLOW_ENV', 'QA_BASE_URL', 'INTENTFLOW_BROWSER'] as const;
  const previous = keys.map(key => process.env[key]);
  try {
    const file = path.join(directory, '.env');
    writeFileSync(file, 'INTENTFLOW_ENV=QA\nQA_BASE_URL=https://qa.example.test\nINTENTFLOW_BROWSER=chrome\n');
    delete process.env.INTENTFLOW_ENV;
    delete process.env.QA_BASE_URL;
    process.env.INTENTFLOW_BROWSER = 'edge';
    loadLocalEnv(file);
    assert.deepEqual(resolveRuntimeConfig(), { baseURL: 'https://qa.example.test', channel: 'msedge' });
  } finally {
    keys.forEach((key, index) => {
      if (previous[index] === undefined) delete process.env[key];
      else process.env[key] = previous[index];
    });
    rmSync(directory, { recursive: true, force: true });
  }
});

test('selects and validates the environment URL and installed browser channel', () => {
  assert.deepEqual(resolveRuntimeConfig({}), { baseURL: 'https://sandbox.moodledemo.net', channel: undefined });
  assert.deepEqual(resolveRuntimeConfig({
    INTENTFLOW_ENV: 'uat', UAT_BASE_URL: 'https://uat.example.test', INTENTFLOW_BROWSER: 'chrome',
  }), { baseURL: 'https://uat.example.test', channel: 'chrome' });
  assert.throws(() => resolveRuntimeConfig({ INTENTFLOW_ENV: 'DEV' }), /QA or UAT/);
  assert.throws(() => resolveRuntimeConfig({ INTENTFLOW_ENV: 'UAT' }), /UAT_BASE_URL is required/);
  assert.throws(() => resolveRuntimeConfig({ INTENTFLOW_ENV: 'QA', QA_BASE_URL: 'not-a-url' }), /absolute HTTP/);
  assert.throws(() => resolveRuntimeConfig({ INTENTFLOW_ENV: 'QA', QA_BASE_URL: 'https://user:pass@example.test' }), /without credentials/);
  assert.throws(() => resolveRuntimeConfig({ INTENTFLOW_BROWSER: 'firefox' }), /chrome or edge/);
});

test('chooses credentials by environment and permitted login ID', () => {
  const env = {
    INTENTFLOW_ENV: 'UAT',
    INTENTFLOW_LOGIN_PROFILE: 'admin',
    UAT_ADMIN_USERNAME: 'uat-user',
    UAT_ADMIN_PASSWORD: 'uat-pass',
    QA_ADMIN_USERNAME: 'qa-user',
    QA_ADMIN_PASSWORD: 'qa-pass',
  };
  assert.deepEqual(resolveLoginData('student', ['student', 'admin'], { env }), {
    id: 'admin', username: 'uat-user', password: 'uat-pass',
  });
  assert.throws(() => resolveLoginData('student', ['student'], { env }), /not allowed/);
  assert.throws(() => resolveLoginData('admin', ['admin'], {
    env: { INTENTFLOW_ENV: 'QA', QA_ADMIN_USERNAME: 'user' },
  }), /QA_ADMIN_PASSWORD/);
});

test('supports explicit custom IDs, negative passwords and legacy credentials', () => {
  const env = {
    INTENTFLOW_ENV: 'QA',
    INTENTFLOW_LOGIN_PROFILE: 'educator',
    QA_EDUCATOR_USERNAME: 'educator',
    QA_EDUCATOR_PASSWORD: 'valid',
    QA_EDUCATOR_INVALID_PASSWORD: 'invalid',
  };
  assert.equal(resolveLoginData('educator', ['educator'], { env }).password, 'valid');
  assert.equal(resolveLoginData('educator', ['educator'], { env, invalidPassword: true }).password, 'invalid');
  assert.equal(resolveLoginData('student', ['student'], {
    env: { MOODLE_DEMO_USERNAME: 'student', MOODLE_INVALID_PASSWORD: 'invalid' },
    invalidPassword: true,
  }).password, 'invalid');
});
