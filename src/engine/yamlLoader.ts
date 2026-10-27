import * as fs from 'fs';
import { parse } from 'yaml';
import {
  SuiteSpecSchema,
  SuiteSpec,
  TestScenario,
  StepIntent,
} from '../types/intentSchema';
import path from 'path';

/**
 * Recursively resolves steps for a scenario, resolving refScenario inheritance and appending additionalSteps.
 */
export function resolveScenarioSteps(
  scenarioName: string,
  sharedScenarios: Record<string, TestScenario>,
  suiteProfiles?: Record<string, any>,
  globalScenarios: Record<string, TestScenario> = {}
): StepIntent[] {
  // 1. Look in local sharedScenarios first, fallback to cross-suite scenarios
  const scenario = sharedScenarios[scenarioName] || globalScenarios[scenarioName];

  if (!scenario) {
    const available = Object.keys({ ...sharedScenarios, ...globalScenarios }).join(', ');
    throw new Error(
      `Scenario '${scenarioName}' not found in sharedScenarios. Available: [${available}]`
    );
  }

  let resolvedSteps: StepIntent[] = [];

  for (const step of scenario.steps || []) {
    if (step.intent === 'include' && step.scenario) {
      // 2. Resolve child scenario steps recursively using combined scenario maps
      const childSteps = resolveScenarioSteps(
        step.scenario,
        sharedScenarios,
        suiteProfiles,
        globalScenarios
      );

      let stepData: Record<string, any> = {};

      if (step.profile && suiteProfiles?.[step.profile]?.data) {
        stepData = { ...suiteProfiles[step.profile].data };
      }

      if (step.data) {
        stepData = { ...stepData, ...step.data };
      }

      const contextualizedChildSteps = childSteps.map((childStep) => ({
        ...childStep,
        _stepContextData: {
          ...((childStep as any)._stepContextData || {}),
          ...stepData,
        },
      }));

      resolvedSteps.push(...contextualizedChildSteps);
    } else {
      resolvedSteps.push(step);
    }
  }

  return resolvedSteps;
}
/**
 * Loads and validates a consolidated Single-File Suite YAML file against intentSchema rules.
 */

export function loadYamlSuite(filePath: string): SuiteSpec {
  let absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(absolutePath)) {
    const fallbackPath = path.resolve(__dirname, '../../', filePath);
    if (fs.existsSync(fallbackPath)) {
      absolutePath = fallbackPath;
    }
  }

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`YAML suite file not found at path: ${absolutePath}`);
  }

  const raw = fs.readFileSync(absolutePath, 'utf-8');
  const parsedYaml: any = parse(raw) || {};

  let mergedProfiles: Record<string, any> = {};
  let mergedScenarios: Record<string, any> = {};

  // 1. First, recursively load and merge all included upstream dependencies
  if (Array.isArray(parsedYaml.includes)) {
    const suiteDir = path.dirname(absolutePath);

    for (const inc of parsedYaml.includes) {
      const incFileName = inc.endsWith('.yaml') ? inc : `${inc}.yaml`;
      const incPath = path.resolve(suiteDir, incFileName);

      const childSuite = loadYamlSuite(incPath);

      mergedProfiles = { ...mergedProfiles, ...(childSuite.profiles || {}) };
      mergedScenarios = { ...mergedScenarios, ...(childSuite.sharedScenarios || {}) };
    }
  }

  // 2. Current file's profiles & scenarios take precedence / extend included ones
  mergedProfiles = { ...mergedProfiles, ...(parsedYaml.profiles || {}) };
  mergedScenarios = { ...mergedScenarios, ...(parsedYaml.sharedScenarios || {}) };

  const consolidatedYaml = {
    ...parsedYaml,
    profiles: mergedProfiles,
    sharedScenarios: mergedScenarios,
  };

  const parseResult = SuiteSpecSchema.safeParse(consolidatedYaml);
  if (!parseResult.success) {
    throw new Error(
      `Schema validation failed for YAML suite '${filePath}':\n` +
        JSON.stringify(parseResult.error.format(), null, 2)
    );
  }

  return parseResult.data;
}