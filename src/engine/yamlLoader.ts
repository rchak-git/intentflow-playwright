// src/engine/yamlLoader.ts
import * as fs from 'fs';
import { parse } from 'yaml';
import {
  SuiteSpecSchema,
  SuiteSpec,
  PipelineStep,
  IntentStep,
  RefScenarioStep,
  RefProfilePrecondition,
  TestScenario,
} from '../types/intentSchema';
import path from 'path';

/**
 * Type guards to identify reference steps
 */
function isRefScenarioStep(step: any): step is RefScenarioStep {
  return 'refScenario' in step && typeof step.refScenario === 'string';
}

function isRefProfileStep(step: any): step is RefProfilePrecondition {
  return 'refProfile' in step && typeof step.refProfile === 'string';
}

/**
 * Resolves scenario lookup key paths (e.g. "authScenarios.login" or "login")
 */
function getScenarioByKey(
  keyPath: string,
  sharedScenarios: Record<string, any>
): TestScenario | PipelineStep[] | undefined {
  if (sharedScenarios[keyPath]) {
    return sharedScenarios[keyPath];
  }

  const parts = keyPath.split('.');
  let current: any = sharedScenarios;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      current = undefined;
      break;
    }
  }
  if (current) return current;

  const baseKey = parts[parts.length - 1];
  if (sharedScenarios[baseKey]) {
    return sharedScenarios[baseKey];
  }

  return undefined;
}

/**
 * Static 1-Hop Scenario Redirection Limit Validator (Rule 2.1 & Rule 2.5)
 */
function validateScenarioHopDepth(
  scenarioName: string,
  sharedScenarios: Record<string, any>,
  currentDepth: number = 0,
  callStack: string[] = []
): void {
  if (currentDepth > 1) {
    throw new Error(
      `[ValidationError] Shared scenario '${callStack[0]}' violates Rule 2.1 (1-Hop Limit). Nested scenario chain depth is ${currentDepth} (${callStack.join(' -> ')} -> ${scenarioName}). Scenario nesting >= 2 levels is strictly banned.`
    );
  }

  const scenarioTarget = getScenarioByKey(scenarioName, sharedScenarios);
  if (!scenarioTarget) return;

  const rawSteps: PipelineStep[] = Array.isArray(scenarioTarget)
    ? scenarioTarget
    : (scenarioTarget as TestScenario).steps || [];

  for (const step of rawSteps) {
    if (isRefScenarioStep(step)) {
      validateScenarioHopDepth(
        step.refScenario,
        sharedScenarios,
        currentDepth + 1,
        [...callStack, scenarioName]
      );
    }
  }
}

/**
 * Recursively resolves steps for a scenario, resolving refScenario and refProfile inheritance with data overlays.
 */
export function resolveScenarioSteps(
  scenarioName: string,
  sharedScenarios: Record<string, any>,
  suiteProfiles: Record<string, any> = {},
  globalScenarios: Record<string, any> = {}
): IntentStep[] {
  const combinedScenarios = { ...globalScenarios, ...sharedScenarios };
  const scenarioTarget = getScenarioByKey(scenarioName, combinedScenarios);

  if (!scenarioTarget) {
    const available = Object.keys(combinedScenarios).join(', ');
    throw new Error(
      `[IntentFlow] Scenario '${scenarioName}' not found in sharedScenarios. Available: [${available}]`
    );
  }

  const rawSteps: PipelineStep[] = Array.isArray(scenarioTarget)
    ? scenarioTarget
    : (scenarioTarget as TestScenario).steps || [];

  const resolvedSteps: IntentStep[] = [];

  for (const step of rawSteps) {
    const stepAny = step as any;

    // 1. Handle refProfile Inclusion (Preconditions or legacy)
    if (isRefProfileStep(stepAny)) {
      const rawProfileRef = stepAny.refProfile;
      const targetProfileName = rawProfileRef.includes('#') 
        ? rawProfileRef.split('#')[1] 
        : rawProfileRef.includes('.')
        ? rawProfileRef.split('.')[1]
        : rawProfileRef;

      const targetProfile = suiteProfiles[targetProfileName];

      if (!targetProfile) {
        const availableProfiles = Object.keys(suiteProfiles).join(', ');
        throw new Error(
          `[IntentFlow] Profile '${rawProfileRef}' referenced in step not found in merged profiles. Available: [${availableProfiles}]`
        );
      }

      const mergedProfileData = {
        ...(targetProfile.data || {}),
        ...(stepAny.data || {}),
      };

      const childSteps = targetProfile.steps || resolveScenarioSteps(
        targetProfile.refScenario,
        sharedScenarios,
        suiteProfiles,
        globalScenarios
      );

      const contextualizedChildSteps: IntentStep[] = childSteps.map((childStep: any) => ({
        ...childStep,
        params: {
          ...(childStep.params || {}),
          _stepContextData: {
            ...(childStep.params?._stepContextData || {}),
            ...mergedProfileData,
          },
        },
      }));

      resolvedSteps.push(...contextualizedChildSteps);
      continue;
    }

    // 2. Handle refScenario Inclusion
    if (isRefScenarioStep(stepAny)) {
      const childSteps = resolveScenarioSteps(
        stepAny.refScenario,
        sharedScenarios,
        suiteProfiles,
        globalScenarios
      );

      const inlineData = stepAny.data || {};

      const contextualizedChildSteps: IntentStep[] = childSteps.map((childStep: any) => ({
        ...childStep,
        params: {
          ...(childStep.params || {}),
          _stepContextData: {
            ...(childStep.params?._stepContextData || {}),
            ...inlineData,
          },
        },
      }));

      resolvedSteps.push(...contextualizedChildSteps);
      continue;
    }

    // 3. Standard IntentStep
    resolvedSteps.push(step as IntentStep);
  }

  return resolvedSteps;
}

/**
 * Loads and validates a consolidated Single-File or Included Suite YAML file against intentSchema rules.
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
    throw new Error(`[IntentFlow] YAML suite file not found at path: ${absolutePath}`);
  }

  const raw = fs.readFileSync(absolutePath, 'utf-8');
  const parsedYaml: any = parse(raw) || {};

  let mergedProfiles: Record<string, any> = {};
  let mergedScenarios: Record<string, any> = {};

  // 1. Recursively load and merge all included upstream suite dependencies
  if (Array.isArray(parsedYaml.includes)) {
    const suiteDir = path.dirname(absolutePath);

    for (const inc of parsedYaml.includes) {
      const incFileName = inc.endsWith('.yaml') || inc.endsWith('.yml') ? inc : `${inc}.yaml`;
      const incPath = path.resolve(suiteDir, incFileName);

      const childSuite = loadYamlSuite(incPath);

      mergedProfiles = { ...mergedProfiles, ...(childSuite.profiles || {}) };
      mergedScenarios = { ...mergedScenarios, ...(childSuite.sharedScenarios || {}) };
    }
  }

  // 2. Local suite profiles & scenarios take precedence over included upstream dependencies
  mergedProfiles = { ...mergedProfiles, ...(parsedYaml.profiles || {}) };
  mergedScenarios = { ...mergedScenarios, ...(parsedYaml.sharedScenarios || {}) };

  const consolidatedYaml = {
    ...parsedYaml,
    profiles: mergedProfiles,
    sharedScenarios: mergedScenarios,
  };

  // Enforce Rule 2.1 (1-Hop Limit) across all loaded sharedScenarios
  for (const scenarioName of Object.keys(mergedScenarios)) {
    validateScenarioHopDepth(scenarioName, mergedScenarios);
  }

  const parseResult = SuiteSpecSchema.safeParse(consolidatedYaml);
  if (!parseResult.success) {
    throw new Error(
      `[IntentFlow] Schema validation failed for YAML suite '${filePath}':\n` +
        JSON.stringify(parseResult.error.format(), null, 2)
    );
  }

  return parseResult.data;
}