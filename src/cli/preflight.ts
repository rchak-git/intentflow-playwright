import { loadYamlSuite } from '../engine/yamlLoader';
import { preflightSuite } from '../engine/preflight';

function main(args: string[]): void {
  let suitePath: string | undefined;
  let profile: string | undefined;
  for (let index = 0; index < args.length; index += 2) {
    const option = args[index];
    const value = args[index + 1];
    if (!value || value.startsWith('--') || (option !== '--suite' && option !== '--profile')) {
      throw new Error('Usage: npx tsx src/cli/preflight.ts --suite <yamlPath> [--profile <profileName>]');
    }
    if (option === '--suite') {
      if (suitePath) throw new Error('--suite may only be specified once.');
      suitePath = value;
    } else {
      if (profile) throw new Error('--profile may only be specified once.');
      profile = value;
    }
  }
  if (!suitePath) throw new Error('Usage: npx tsx src/cli/preflight.ts --suite <yamlPath> [--profile <profileName>]');

  const report = preflightSuite(loadYamlSuite(suitePath), profile);
  console.log(JSON.stringify({ suite: suitePath, ...report }, null, 2));
  if (report.issues.length) process.exitCode = 1;
}

try {
  main(process.argv.slice(2));
} catch (error: unknown) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
