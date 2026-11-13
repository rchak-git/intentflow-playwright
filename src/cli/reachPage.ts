import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { loadYamlSuite } from '../engine/yamlLoader';

function readArguments(args: string[]): { suitePath: string; profileName: string } {
  const values = new Map<string, string>();

  for (let index = 0; index < args.length; index += 1) {
    const option = args[index];
    if (option !== '--suite' && option !== '--profile') {
      throw new Error(`Unknown argument '${option}'. Expected --suite <yamlPath> and --profile <profileName>.`);
    }

    const value = args[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${option}.`);
    }
    values.set(option, value);
    index += 1;
  }

  const suitePath = values.get('--suite');
  const profileName = values.get('--profile');
  if (!suitePath || !profileName) {
    throw new Error('Usage: npx tsx src/cli/reachPage.ts --suite <yamlPath> --profile <profileName>');
  }

  return { suitePath: path.resolve(suitePath), profileName };
}

function createRunnerTest(suitePath: string, profileName: string, statePath: string): string {
  return `
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { test } from '@playwright/test';
import { CommandDispatcher } from '../src/engine/commandDispatcher';
import { loadYamlSuite } from '../src/engine/yamlLoader';

test('reach target page and save authenticated state', async ({ page }) => {
  const suitePath = process.env.INTENTFLOW_REACH_SUITE;
  const profileName = process.env.INTENTFLOW_REACH_PROFILE;
  const statePath = process.env.INTENTFLOW_REACH_STATE;
  if (!suitePath || !profileName || !statePath) {
    throw new Error('Missing internal reachPage runner configuration.');
  }

  const suite = loadYamlSuite(suitePath);
  const dispatcher = await CommandDispatcher.fromSuite(suite);
  await dispatcher.executeProfile(page, profileName, suite);

  mkdirSync(path.dirname(statePath), { recursive: true });
  await page.context().storageState({ path: statePath });
  console.log(\`STATE_SAVED=\${statePath}\`);
  console.log(\`TARGET_URL=\${page.url()}\`);
});
`;
}

async function main(): Promise<void> {
  const { suitePath, profileName } = readArguments(process.argv.slice(2));
  if (!existsSync(suitePath)) {
    throw new Error(`Suite file not found: ${suitePath}`);
  }

  const suite = loadYamlSuite(suitePath);
  if (!suite.profiles?.[profileName]) {
    throw new Error(
      `Profile '${profileName}' was not found in '${suitePath}'. Available profiles: ${
        Object.keys(suite.profiles ?? {}).join(', ') || '(none)'
      }`
    );
  }

  const testDir = path.resolve(process.cwd(), 'tests');
  const runnerPath = path.join(testDir, `.reachPage-${process.pid}.spec.ts`);
  const statePath = path.resolve(process.cwd(), 'playwright', '.auth', 'state.json');
  mkdirSync(testDir, { recursive: true });
  writeFileSync(runnerPath, createRunnerTest(suitePath, profileName, statePath), 'utf8');

  try {
    const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const result = spawnSync(
      command,
      ['playwright', 'test', runnerPath, '--workers=1', '--reporter=list'],
      {
        env: {
          ...process.env,
          INTENTFLOW_REACH_SUITE: suitePath,
          INTENTFLOW_REACH_PROFILE: profileName,
          INTENTFLOW_REACH_STATE: statePath,
        },
        stdio: 'inherit',
        shell: process.platform === 'win32',
      }
    );

    if (result.error) {
      throw result.error;
    }
    if (result.status !== 0) {
      throw new Error(`Playwright profile execution failed with exit code ${result.status ?? 'unknown'}.`);
    }
  } finally {
    rmSync(runnerPath, { force: true });
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
