import { strict as assert } from 'assert';
import { promises as fs } from 'fs';
import { createServer, type Server } from 'http';
import os from 'os';
import path from 'path';
import { after, before, test } from 'node:test';
import { parse } from 'yaml';
import { createApp } from './server';

let root: string;
let base: string;
let server: Server;

before(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), 'intentflow-editor-'));
  await fs.mkdir(path.join(root, 'nested'));
  await fs.writeFile(path.join(root, 'nested', 'suite.yaml'), `# Suite comment
page: /login
sharedScenarios:
  login:
    steps: []
profiles:
  td_login:
    data:
      username: old # keep this comment
    steps:
      - refScenario: login
        data:
          password: secret
  private:
    steps: []
`);
  server = createServer(createApp(root));
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No server address');
  base = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  await fs.rm(root, { recursive: true, force: true });
});

test('lists nested suites and round-trips edits while preserving comments and unrelated data', async () => {
  const list = await (await fetch(`${base}/api/suites`)).json() as { filePath: string; profileCount: number }[];
  assert.equal(list.length, 1);
  assert.equal(list[0].filePath, path.join('nested', 'suite.yaml'));
  assert.equal(list[0].profileCount, 2);
  const filePath = list[0].filePath;
  const detail = await fetch(`${base}/api/suite-details?filePath=${encodeURIComponent(filePath)}`);
  const suite = await detail.json();
  const originalSuite = structuredClone(suite);
  suite.profiles.td_login.data.username = 'new';
  suite.profiles.td_login.steps[0].data.password = 'changed';
  const saved = await fetch(`${base}/api/suites/save`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath, suiteData: suite, originalSuite }),
  });
  assert.equal(saved.status, 200);
  const text = await fs.readFile(path.join(root, filePath), 'utf8');
  assert.match(text, /# Suite comment/);
  assert.match(text, /# keep this comment/);
  assert.deepEqual(parse(text), suite);
});

test('rejects traversal, cross-origin writes, malformed data, and stale saves', async () => {
  const traversal = await fetch(`${base}/api/suite-details?filePath=${encodeURIComponent('..\\outside.yaml')}`);
  assert.equal(traversal.status, 400);
  const crossOrigin = await fetch(`${base}/api/suites/save`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://example.com' },
    body: JSON.stringify({ filePath: 'nested/suite.yaml', suiteData: {} }),
  });
  assert.equal(crossOrigin.status, 403);
  const malformed = await fetch(`${base}/api/suites/save`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ suiteData: [] }),
  });
  assert.equal(malformed.status, 400);
  const stale = await fetch(`${base}/api/suites/save`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath: path.join('nested', 'suite.yaml'), suiteData: {}, originalSuite: {} }),
  });
  assert.equal(stale.status, 409);
});
