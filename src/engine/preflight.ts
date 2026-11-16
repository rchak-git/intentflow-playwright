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

  if (intent === 'custom') return 'Custom control handlers do not implement an operation.';
  if (intent === 'extract') {
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
    const supported = widget === 'WEB_TABLE' || widget === 'TABLE'
      ? ['state', 'count', 'cellText', 'equals', 'contains', 'allRowCheckboxesState']
      : widget === 'CHECKBOX'
        ? ['equals', 'state']
        : [...baseVerifications, ...(['RADIO_GROUP', 'CUSTOM_SELECT'].includes(widget) ? ['optionsContains'] : [])];
    if (!supported.includes(verification)) return `Verification '${verification}' is not implemented on ${widget}.`;
    if (widget === 'CUSTOM_SELECT' && verification === 'state' && params?.value === undefined) {
      return 'CUSTOM_SELECT state without a value performs no assertion.';
    }
    if (verification !== 'state' && verification !== 'allRowCheckboxesState' && params?.value === undefined) {
      return `Verification '${verification}' requires an expected value.`;
    }
    if (widget === 'CUSTOM_SELECT' && verification === 'equals') {
      return 'CUSTOM_SELECT equals performs a contains assertion, not an equality assertion.';
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

/** Performs static checks along the same shallow profile paths used by the dispatcher. */
export function preflightSuite(suite: SuiteSpec, profileName?: string): PreflightReport {
  const { uiMap, missingMaps } = resolveSuiteUiMaps(suite);
  const profiles = suite.profiles ?? {};
  const names = profileName ? [profileName] : Object.keys(profiles);
  const issues: PreflightIssue[] = missingMaps.map(name => ({
    category: 'MISSING_UI_MAPS',
    profile: '',
    location: 'uiMap',
    message: `UI map '${name}' is not registered; runtime falls back to the global map.`,
  }));
  const report: PreflightReport = { profilesChecked: names, issues };

  function add(category: PreflightCategory, profile: string, location: string, message: string) {
    issues.push({ category, profile, location, message });
  }

  if (!names.length) {
    add('MISSING_PROFILES', '', 'profiles', 'The merged suite contains no profiles.');
  }

  function checkStep(step: StandardStep, profile: string, location: string) {
    const field = step.fieldKey;
    if (step.intent === 'REQUIRES_SDET_HANDOFF') {
      add('UNSUPPORTED_OPERATIONS', profile, location, 'Step requires SDET handoff and cannot execute.');
      return;
    }
    if (field.includes('${')) {
      add('UNVERIFIED', profile, location, 'Dynamic fieldKey cannot be verified statically.');
      return;
    }
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

  function walkSteps(steps: PipelineStep[], profile: string, location: string, stack: string[], resolving: boolean) {
    steps.forEach((step, index) => {
      const here = `${location}.steps[${index + 1}]${step.step ? ` (${step.step})` : ''}`;
      if ('intent' in step) {
        checkStep(step, profile, here);
      } else if ('refScenario' in step) {
        walkScenario(step.refScenario, profile, here, stack);
      } else if (resolving) {
        const name = step.refProfile.includes('#') ? step.refProfile.split('#')[1]
          : step.refProfile.includes('.') ? step.refProfile.split('.')[1] : step.refProfile;
        walkReferencedProfile(name, profile, here, stack);
      } else {
        add('UNSUPPORTED_OPERATIONS', profile, here, 'Inline refProfile is not dispatched as a profile reference.');
        if (!profiles[step.refProfile]) {
          add('MISSING_PROFILES', profile, here, `Profile '${step.refProfile}' is not in the merged suite.`);
        }
      }
    });
  }

  function walkScenario(name: string, profile: string, location: string, stack: string[]) {
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
    walkSteps(Array.isArray(scenario) ? scenario : scenario.steps, profile, `${location} -> ${name}`, [...stack, marker], true);
  }

  function walkReferencedProfile(name: string, profile: string, location: string, stack: string[]) {
    const target = profiles[name];
    if (!target) {
      add('MISSING_PROFILES', profile, location, `Profile '${name}' is not in the merged suite.`);
      return;
    }
    const marker = `profile:${name}`;
    if (stack.includes(marker)) {
      add('UNSUPPORTED_OPERATIONS', profile, location, `Cyclic profile reference '${name}'.`);
      return;
    }
    const next = [...stack, marker];
    if (target.steps) walkSteps(target.steps, profile, `${location} -> ${name}`, next, false);
    else if (target.refScenario) walkScenario(target.refScenario, profile, `${location} -> ${name}`, next);
    else add('UNSUPPORTED_OPERATIONS', profile, location, `Referenced profile '${name}' must have steps or refScenario for shallow execution.`);
  }

  for (const name of names) {
    const profile = profiles[name];
    if (!profile) {
      add('MISSING_PROFILES', name, 'profile', `Profile '${name}' is not in the merged suite.`);
      continue;
    }
    for (const [index, precondition] of (profile.preconditions ?? []).entries()) {
      const target = precondition.refProfile.includes('.')
        ? precondition.refProfile.split('.')[1] : precondition.refProfile;
      walkReferencedProfile(target, name, `preconditions[${index + 1}]`, []);
    }
    const location = `profile ${name}`;
    if (profile.steps?.length) walkSteps(profile.steps, name, location, [`profile:${name}`], false);
    else if (profile.refScenario) walkScenario(profile.refScenario, name, location, [`profile:${name}`]);
    else if (profile.refProfile) walkReferencedProfile(profile.refProfile, name, location, [`profile:${name}`]);
  }
  return report;
}
