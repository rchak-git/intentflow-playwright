import * as fs from 'fs';
import { parse } from 'yaml';
import {
  SuiteSpecSchema,
  SuiteSpec,
  TestScenario,
  StepIntent,
} from '../types/intentSchema';

/**
 * Recursively resolves steps for a scenario, resolving refScenario inheritance and appending additionalSteps.
 */
export function resolveScenarioSteps(
  scenarioName: string,
  sharedScenarios: Record<string, TestScenario>,
  visited: Set<string> = new Set()
): StepIntent[] {
  if (visited.has(scenarioName)) {
    throw new Error(
      `Circular dependency detected in refScenario composition for '${scenarioName}'`
    );
  }
  visited.add(scenarioName);

  const scenario = sharedScenarios[scenarioName];
  if (!scenario) {
    throw new Error(
      `Referenced scenario '${scenarioName}' was not found in sharedScenarios.`
    );
  }

  let resolvedSteps: StepIntent[] = [];

  // 1. Inherit steps from parent scenario if refScenario exists
  if (scenario.refScenario) {
    resolvedSteps = resolveScenarioSteps(
      scenario.refScenario,
      sharedScenarios,
      visited
    );
  }

  // 2. Append direct steps if defined
  if (scenario.steps && scenario.steps.length > 0) {
    resolvedSteps = [...resolvedSteps, ...scenario.steps];
  }

  // 3. Append additionalSteps if defined
  if (scenario.additionalSteps && scenario.additionalSteps.length > 0) {
    resolvedSteps = [...resolvedSteps, ...scenario.additionalSteps];
  }

  return resolvedSteps;
}

/**
 * Loads and validates a consolidated Single-File Suite YAML file against intentSchema rules.
 */
export function loadYamlSuite(filePath: string): SuiteSpec {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsedYaml: unknown = parse(raw);

  const parseResult = SuiteSpecSchema.safeParse(parsedYaml);
  if (!parseResult.success) {
    const formattedErrors = parseResult.error.issues
      .map((issue) => `   - [${issue.path.join('.')}]: ${issue.message}`)
      .join('\n');
    throw new Error(
      `YAML Suite Contract Validation Failed for '${filePath}':\n${formattedErrors}`
    );
  }

  return parseResult.data;
}