// src/engine/preflight.ts
import type { PipelineStep, StandardStep, SuiteSpec } from '../types/intentSchema';
import type { UiMapEntry, WidgetType } from '../types/uiMapTypes';
import { resolveSuiteUiMaps } from './suiteUiMaps';

export type PreflightCategory =
  | 'MISSING_UI_MAPS'
  | 'MISSING_UI_MAP_ENTRIES'
  | 'MISSING_PROFILES'
  | 'MISSING_SCENARIOS'
  | 'UNSUPPORTED_OPERATIONS'
  | 'UNVERIFIED';

export interface PreflightIssue {
  category: PreflightCategory;
  profile: string;
  location: string;
  message: string;
}

export interface PreflightReport {
  profilesChecked: string[];
  issues: PreflightIssue[];
}

const baseActions = ['click', 'jsClick', 'hover', 'dblClick', 'pressKey', 'clear'];
const baseVerifications = ['equals', 'contains', 'state'];

function operationProblem(step: StandardStep, widget: WidgetType, pageTarget: boolean): string | undefined {
  const { intent, params } = step;
  const sub = params?.subIntent;
  if (intent === 'REQUIRES_SDET_HANDOFF') return 'Step requires SDET handoff and cannot execute.';
  if (pageTarget) {
    if (intent === 'custom' && params?.handler === 'switchTab') return undefined;
    if (intent === 'action' && (sub === 'navigate' || sub === 'setValue')) return undefined;
    if (intent === 'action' && sub === 'pressKey' && typeof params?.value === 'string') return undefined;
    if (intent === 'verify' && sub && ['contains', 'equals', 'urlContains'].includes(sub)) {
      return params?.value === undefined || params.value === ''
        ? `Page verification '${sub}' requires a value.` : undefined;
    }
    return `Page operation ${intent}/${sub ?? '(default)'} is not implemented for fieldKey page.`;
  }

  if (widget === 'FILE_UPLOAD') {
    if (params?.storeAs) return 'FILE_UPLOAD does not support storing a control value.';
    if (intent === 'populate' && (!sub || sub === 'setValue')) {
      return typeof params?.value === 'string' && params.value.trim()
        ? undefined : 'FILE_UPLOAD requires a non-empty file path string.';
    }
    if (intent === 'verify' && sub === 'state') return undefined;
    return `Operation ${intent}/${sub ?? '(default)'} is not supported on FILE_UPLOAD.`;
  }

  if (widget === 'RICH_TEXT' && intent === 'populate') {
    if (sub && sub !== 'setValue') return `Populate sub-intent '${sub}' is not implemented on RICH_TEXT.`;
    return typeof params?.value === 'string' ? undefined : 'RICH_TEXT requires a plain-text string value.';
  }

  if (intent === 'custom') return 'Custom control handlers do not implement an operation.';
  if (intent === 'extract') {
    if (sub === 'tableData' && (widget === 'WEB_TABLE' || widget === 'TABLE') &&
        !params?.anchorText && !params?.column && !params?.targetColumn) return undefined;
    return sub ? `Extract sub-intent '${sub}' is not an implemented operation.` : undefined;
  }
  if (widget === 'PAGE') {
    if (intent === 'verify' && (!sub || ['contains', 'equals', 'urlContains'].includes(sub))) return undefined;
    return `Operation ${intent}/${sub ?? '(default)'} is not supported on a mapped PAGE.`;
  }
  if (intent === 'populate') {
    const supported = ['TEXTBOX', 'CHECKBOX', 'RADIO_GROUP', 'SEARCH', 'SELECT', 'CUSTOM_SELECT'];
    if (!supported.includes(widget)) return `Populate is not supported on ${widget}.`;
    if (sub && sub !== 'setValue' && !(widget === 'TEXTBOX' && sub === 'append')) {
      return `Populate sub-intent '${sub}' is not implemented on ${widget}.`;
    }
    return undefined;
  }
  if (intent === 'action') {
    const action = sub ?? 'click';
    const supported = widget === 'WEB_TABLE' || widget === 'TABLE'
      ? ['click', 'clickSubControl', 'hover', 'dblClick']
      : widget === 'CUSTOM_SELECT'
        ? ['click', 'open', 'close']
        : [
            ...baseActions,
            ...(widget === 'CARD' ? ['clickSubControl'] : []),
            ...(widget === 'CHECKBOX' ? ['toggle'] : []),
            ...(widget === 'RADIO_GROUP' ? ['select'] : []),
          ];
    if (!supported.includes(action)) return `Action '${action}' is not implemented on ${widget}.`;
    if ((action === 'pressKey' && typeof params?.value !== 'string') ||
        (widget === 'RADIO_GROUP' && action === 'select' && params?.value === undefined)) {
      return `Action '${action}' requires a value.`;
    }
    if (widget === 'CHECKBOX' && params?.value !== undefined && action !== 'click' && action !== 'toggle') {
      return 'Checkbox action with a boolean value sets its state instead of performing the requested action.';
    }
    return undefined;
  }
  if (intent === 'verify') {
    const verification = sub ?? 'equals';
    if (widget === 'RICH_TEXT' && (verification === 'equals' || verification === 'contains') &&
        typeof params?.value !== 'string') {
      return 'RICH_TEXT verification requires a plain-text string value.';
    }
    const supported = widget === 'WEB_TABLE' || widget === 'TABLE'
      ? ['state', 'count', 'cellText', 'equals', 'contains', 'allRowCheckboxesState']
      : widget === 'CHECKBOX'
        ? ['equals', 'state']
        : [
            ...baseVerifications,
            ...(['RADIO_GROUP', 'CUSTOM_SELECT'].includes(widget) ? ['optionsContains'] : []),
            ...(widget === 'CARD' ? ['count'] : []),
          ];
    if (!supported.includes(verification)) return `Verification '${verification}' is not implemented on ${widget}.`;
    if (widget === 'CUSTOM_SELECT' && verification === 'state' && params?.value === undefined) {
      return 'CUSTOM_SELECT state without a value performs no assertion.';
    }
    if (verification !== 'state' && verification !== 'allRowCheckboxesState' && params?.value === undefined) {
      return `Verification '${verification}' requires an expected value.`;
    }
    if (widget === 'SELECT' && verification === 'equals') {
      return 'SELECT equals also accepts a partial match of the selected option text.';
    }
    if ((widget === 'WEB_TABLE' || widget === 'TABLE') && verification === 'state' &&
        params?.value !== undefined && !['visible', 'hidden'].includes(String(params.value).toLowerCase())) {
      return 'Table state verification only supports visible and hidden.';
    }
    return undefined;
  }
  return `Intent '${intent}' is not implemented.`;
}

function findScenario(suite: SuiteSpec, name: string) {
  const scenarios = suite.sharedScenarios ?? {};
  return scenarios[name] ?? scenarios[name.split('.').pop() ?? name];
}

function scenarioProfileName(refKey: string): string {
  return refKey.includes('#')
    ? refKey.split('#')[1]
    : refKey.includes('.')
      ? refKey.split('.')[1]
      : refKey;
}

function resolveStaticValue(value: unknown, data: Record<string, unknown>, seen = new Set<string>()): unknown {
  if (typeof value !== 'string' || !value.startsWith('${data:')) return value;
  const match = value.match(/^\$\{data:([a-zA-Z0-9_]+)(?:\s*\|\|\s*(?:'([^']*)'|"([^"]*)"|([^}\s]+)))?\}$/);
  if (!match) return undefined;
  const [, key, single, double, raw] = match;
  if (seen.has(key)) return undefined;
  const found = data[key];
  if (found === undefined || found === null || found === '') return single ?? double ?? raw;
  return resolveStaticValue(found, data, new Set([...seen, key]));
}

/** Performs static checks along the recursive profile and precondition paths used by the dispatcher. */
export function preflightSuite(
  suite: SuiteSpec,
  profileName?: string,
  options: { uiMap?: Record<string, UiMapEntry> } = {}
): PreflightReport {
  const resolvedMaps = resolveSuiteUiMaps(suite);
  const uiMap = options.uiMap ?? resolvedMaps.uiMap;
  const { missingMaps } = resolvedMaps;
  const profiles = suite.profiles ?? {};
  const names = profileName ? [profileName] : Object.keys(profiles);
  const issues: PreflightIssue[] = missingMaps.map(name => ({
    category: 'MISSING_UI_MAPS',
    profile: '',
    location: 'uiMap',
    message: `UI map '${name}' is not registered.`,
  }));
  const report: PreflightReport = { profilesChecked: names, issues };

  function add(category: PreflightCategory, profile: string, location: string, message: string) {
    issues.push({ category, profile, location, message });
  }

  if (!names.length) {
    add('MISSING_PROFILES', '', 'profiles', 'The merged suite contains no profiles.');
  }

  function checkStep(step: StandardStep, profile: string, location: string, data: Record<string, unknown>) {
    const resolvedField = resolveStaticValue(step.fieldKey, data);
    if (step.intent === 'REQUIRES_SDET_HANDOFF') {
      add('UNSUPPORTED_OPERATIONS', profile, location, 'Step requires SDET handoff and cannot execute.');
      return;
    }
    if (typeof resolvedField !== 'string' || resolvedField.includes('${')) {
      add('UNVERIFIED', profile, location, 'Dynamic fieldKey cannot be verified statically.');
      return;
    }
    const field = resolvedField;
    const pageTarget = field.toLowerCase() === 'page';
    const entry: UiMapEntry | undefined = pageTarget ? { widgetType: 'PAGE' } : uiMap[field];
    if (!entry) {
      add('MISSING_UI_MAP_ENTRIES', profile, location, `fieldKey '${field}' is not in the effective UI map.`);
      return;
    }
    if (step.widgetType && step.widgetType !== entry.widgetType) {
      add('UNSUPPORTED_OPERATIONS', profile, location,
        `Step widgetType '${step.widgetType}' does not match the runtime UI map type '${entry.widgetType}'.`);
    }
    const problem = operationProblem(step, entry.widgetType, pageTarget);
    if (problem) add('UNSUPPORTED_OPERATIONS', profile, location, `${field}: ${problem}`);
    const params = step.params;
    if ((entry.widgetType === 'WEB_TABLE' || entry.widgetType === 'TABLE') && params) {
      const column = params.column || params.targetColumn;
      if (column) {
        if (column.includes('${')) {
          add('UNVERIFIED', profile, location, `Dynamic column on '${field}' cannot be verified statically.`);
        } else if (!('columns' in entry) || !entry.columns?.[column]) {
          add('MISSING_UI_MAP_ENTRIES', profile, location, `Column '${column}' is not mapped on '${field}'.`);
        }
      }
      if (params.subIntent === 'cellText' && (!params.anchorText || !column)) {
        add('UNSUPPORTED_OPERATIONS', profile, location, 'Table cellText requires anchorText and a mapped column.');
      }
    }
    if (params?.childWidget && entry.widgetType !== 'SEARCH') {
      if (params.childWidget.includes('${')) {
        add('UNVERIFIED', profile, location, `Dynamic childWidget on '${field}' cannot be verified statically.`);
      } else if (!entry.subSelectors?.[params.childWidget]) {
        add('MISSING_UI_MAP_ENTRIES', profile, location, `Child '${params.childWidget}' is not mapped on '${field}'.`);
      }
    }
  }

  function walkSteps(
    steps: PipelineStep[], profile: string, location: string, stack: string[],
    resolving: boolean, data: Record<string, unknown>, stepContext: Record<string, unknown> = {}
  ) {
    steps.forEach((step, index) => {
      const here = `${location}.steps[${index + 1}]${step.step ? ` (${step.step})` : ''}`;
      if ('intent' in step) {
        checkStep(step, profile, here, data);
      } else if ('refScenario' in step) {
        const forwarded: Record<string, unknown> = {};
        if (!resolving) {
          for (const [key, value] of Object.entries(step.data ?? {})) {
            forwarded[key] = resolveStaticValue(value, data);
          }
        }
        if (resolving) {
          walkScenario(step.refScenario, profile, here, stack, data, { ...step.data, ...stepContext });
        } else {
          walkScenario(step.refScenario, profile, here, stack, { ...data, ...stepContext, ...forwarded });
        }
      } else if (resolving) {
        const name = scenarioProfileName(step.refProfile);
        const context = { ...profiles[name]?.data, ...step.data, ...stepContext };
        walkReferencedProfile(name, profile, here, stack, {}, new Set(), false, data, context);
      } else {
        add('UNSUPPORTED_OPERATIONS', profile, here, 'Inline refProfile is not dispatched as a profile reference.');
        if (!profiles[step.refProfile]) {
          add('MISSING_PROFILES', profile, here, `Profile '${step.refProfile}' is not in the merged suite.`);
        }
      }
    });
  }

  function walkScenario(
    name: string, profile: string, location: string, stack: string[],
    data: Record<string, unknown>, stepContext: Record<string, unknown> = {}
  ) {
    const scenario = findScenario(suite, name);
    if (!scenario) {
      add('MISSING_SCENARIOS', profile, location, `Scenario '${name}' is not in the merged suite.`);
      return;
    }
    const marker = `scenario:${name}`;
    if (stack.includes(marker)) {
      add('UNSUPPORTED_OPERATIONS', profile, location, `Cyclic scenario reference '${name}'.`);
      return;
    }
    walkSteps(Array.isArray(scenario) ? scenario : scenario.steps, profile, `${location} -> ${name}`, [...stack, marker], true, data, stepContext);
  }

  function walkReferencedProfile(
    rawRefKey: string,
    profile: string,
    location: string,
    stack: string[],
    overrides: Record<string, string> = {},
    visited: Set<string> = new Set(),
    includePreconditions = true,
    inheritedData: Record<string, unknown> = {},
    stepContext: Record<string, unknown> = {}
  ) {
    const effectiveRef =
      overrides[rawRefKey] ||
      (rawRefKey.includes('.') ? overrides[rawRefKey.split('.')[1]] : undefined) ||
      rawRefKey;
    const name = includePreconditions && effectiveRef.includes('.')
      ? effectiveRef.split('.')[1]
      : effectiveRef;

    const marker = `profile:${name}`;
    if (stack.includes(marker)) {
      add('UNSUPPORTED_OPERATIONS', profile, location, `Cyclic profile reference '${name}'.`);
      return;
    }

    if (visited.has(name)) {
      return;
    }

    const target = profiles[name];
    if (!target) {
      add('MISSING_PROFILES', profile, location, `Profile '${name}' is not in the merged suite.`);
      return;
    }

    const next = [...stack, marker];

    // Recursively validate upstream preconditions first (matching CommandDispatcher)
    for (const [index, upstreamPre] of (includePreconditions ? target.preconditions ?? [] : []).entries()) {
      const mergedOverrides = {
        ...(upstreamPre.overrides || {}),
        ...overrides,
      };
      walkReferencedProfile(
        upstreamPre.refProfile,
        profile,
        `${location} -> ${name}.preconditions[${index + 1}]`,
        next,
        mergedOverrides,
        visited,
        true,
        { ...(upstreamPre.data ?? {}), ...inheritedData }
      );
    }

    const data = includePreconditions ? { ...(target.data ?? {}), ...inheritedData } : inheritedData;
    if (target.steps) walkSteps(target.steps, profile, `${location} -> ${name}`, next, false, data, stepContext);
    else if (target.refScenario) walkScenario(target.refScenario, profile, `${location} -> ${name}`, next, data, stepContext);
    else add('UNSUPPORTED_OPERATIONS', profile, location, `Referenced profile '${name}' must have steps or refScenario.`);

    visited.add(name);
  }

  for (const name of names) {
    const profile = profiles[name];
    if (!profile) {
      add('MISSING_PROFILES', name, 'profile', `Profile '${name}' is not in the merged suite.`);
      continue;
    }
    const visited = new Set<string>();
    for (const [index, precondition] of (profile.preconditions ?? []).entries()) {
      walkReferencedProfile(
        precondition.refProfile,
        name,
        `preconditions[${index + 1}]`,
        [`profile:${name}`],
        precondition.overrides || {},
        visited,
        true,
        precondition.data ?? {}
      );
    }
    const location = `profile ${name}`;
    const data = profile.data ?? {};
    if (profile.steps?.length) walkSteps(profile.steps, name, location, [`profile:${name}`], false, data);
    else if (profile.refScenario) walkScenario(profile.refScenario, name, location, [`profile:${name}`], data);
    else if (profile.refProfile) {
      const target = profiles[profile.refProfile];
      walkReferencedProfile(profile.refProfile, name, location, [`profile:${name}`], {}, new Set(), false, { ...(target?.data ?? {}), ...data });
    } else add('UNSUPPORTED_OPERATIONS', name, location, `Profile '${name}' must define steps, refScenario, or refProfile.`);
  }
  return report;
}