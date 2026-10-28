import * as path from 'path';
import { test, Page } from '@playwright/test';
import type { UiMapEntry } from '../types/uiMapTypes';
import { SuiteSpec, StepIntent, ActionParams } from '../types/intentSchema';
import { resolveScenarioSteps } from './yamlLoader';
import { globalContextStore } from './contextStore';
import { TextBoxControl } from '../controls/textBoxControl';
import { ButtonControl } from '../controls/buttonControl';
import { PageControl } from '../controls/pageControl';
import { GenericControl } from '../controls/genericControl';
import { CheckboxControl } from '../controls/checkboxControl';
import { TableControl } from '../controls/tableControl';
import { SearchControl } from '../controls/searchControl';
import { BaseControl } from '../controls/baseControl';
import { UI_MAP_REGISTRY,GLOBAL_UI_MAP } from '../registries/UiMapIndex';


export class CommandDispatcher {
  private uiMap: Record<string, UiMapEntry>;
  private suite?: SuiteSpec;

  constructor(uiMap: Record<string, UiMapEntry> = {}, suite?: SuiteSpec) {
    this.uiMap = uiMap;
    this.suite = suite;
  }

  /**
   * Factory method to dynamically load and merge UI Map(s) declared in Suite YAML header.
   * Stores the loaded SuiteSpec instance on the dispatcher.
   */
  public static async fromSuite(suite: SuiteSpec): Promise<CommandDispatcher> {
    let mergedUiMap: Record<string, UiMapEntry> = {};

    const rawMapPaths = suite?.uiMap
      ? Array.isArray(suite.uiMap)
        ? suite.uiMap
        : typeof suite.uiMap === 'string'
          ? [suite.uiMap]
          : Object.values(suite.uiMap)
      : [];

    if (rawMapPaths.length > 0) {
      // Backward Compatibility: Load explicitly specified maps
      for (const rawMapPath of rawMapPaths) {
        if (!rawMapPath) continue;
        const resolvedKey = rawMapPath.replace(/^.*[\\/]/, '').replace(/\.(ts|js|json)$/, '');
        const mapExport = UI_MAP_REGISTRY[rawMapPath] || UI_MAP_REGISTRY[resolvedKey];

        if (!mapExport) {
          throw new Error(
            `[IntentFlow] UI Map path or key "${rawMapPath}" is not registered in src/registries/UiMapIndex.ts.`
          );
        }
        mergedUiMap = { ...mergedUiMap, ...mapExport };
      }
    } else {
      // Unified Global Lookup: Auto-bind the entire GLOBAL_UI_MAP
      console.log(`[IntentFlow] No explicit 'uiMap' declared in YAML header. Using Unified Global UI Map.`);
      mergedUiMap = { ...GLOBAL_UI_MAP };
    }

    return new CommandDispatcher(mergedUiMap, suite);
  }
  /**
   * Executes a named data profile directly from a SuiteSpec.
   */
  public async executeProfile(
    page: Page,
    profileName: string,
    overrideSuite?: SuiteSpec
  ): Promise<void> {
    const activeSuite = overrideSuite || this.suite;

    if (!activeSuite) {
      throw new Error(
        `Cannot execute profile '${profileName}': No SuiteSpec attached to CommandDispatcher or passed to executeProfile.`
      );
    }

    const profiles = activeSuite.profiles || {};
    const profile = profiles[profileName];

    if (!profile) {
      throw new Error(`Profile '${profileName}' not found in suite profiles.`);
    }

    const targetScenarioName = (profile as any).refScenario || (profile as any).scenario;

    if (!targetScenarioName) {
      throw new Error(`Profile '${profileName}' does not specify a valid 'refScenario'.`);
    }

    const sharedScenarios = activeSuite.sharedScenarios || {};
    const steps = resolveScenarioSteps(targetScenarioName, sharedScenarios);
    const profileData = profile.data || {};

    await this.executeScenario(page, steps, profileData);
  }

  public async executeScenario(
    page: Page,
    steps: StepIntent[],
    dataRecord: Record<string, any> = {}
  ): Promise<void> {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      // --- NEW: Handle '- intent: include' for scenario or profile chaining ---
      if (step.intent === 'include') {
        await this.handleIncludeIntent(page, step, dataRecord, i);
        continue;
      }

      const processedStep = this.interpolateStep(step, dataRecord);
      await this.executeStep(page, processedStep, i);
    }
  }

  /**
   * Resolves included scenarios/profiles and executes their steps recursively.
   */
private async handleIncludeIntent(
  page: Page,
  step: StepIntent,
  currentDataRecord: Record<string, any>,
  stepIndex: number
): Promise<void> {
  if (!this.suite) {
    throw new Error(`Cannot execute 'include' intent without a SuiteSpec bound to CommandDispatcher.`);
  }

  const stepAny = step as any;
  const refProfileName = stepAny.refProfile || stepAny.profile;
  const targetScenarioName = stepAny.scenario || stepAny.refScenario;

  let stepsToRun: StepIntent[] = [];
  let mergedDataRecord = { ...currentDataRecord };

  if (refProfileName) {
    const profiles = this.suite.profiles || {};
    const targetProfile = profiles[refProfileName];

    if (!targetProfile) {
      const availableProfiles = Object.keys(profiles).join(', ');
      throw new Error(
        `[IntentFlow] Included profile '${refProfileName}' not found. Available profiles in loaded suite: [${availableProfiles}]`
      );
    }

    const profileScenario = (targetProfile as any).refScenario || (targetProfile as any).scenario;
    if (!profileScenario) {
      throw new Error(`[IntentFlow] Profile '${refProfileName}' does not specify a 'refScenario'.`);
    }

    mergedDataRecord = {
      ...(targetProfile.data || {}),
      ...currentDataRecord,
    };

    const sharedScenarios = this.suite.sharedScenarios || {};
    stepsToRun = resolveScenarioSteps(profileScenario, sharedScenarios);
  } else if (targetScenarioName) {
    const sharedScenarios = this.suite.sharedScenarios || {};
    stepsToRun = resolveScenarioSteps(targetScenarioName, sharedScenarios);
  } else {
    throw new Error(
      `[IntentFlow] 'include' intent step missing 'refProfile' or 'scenario'. Received step: ${JSON.stringify(step)}`
    );
  }

  const stepName = `Include Flow: ${refProfileName ? `Profile [${refProfileName}]` : `Scenario [${targetScenarioName}]`}`;
  await test.step(stepName, async () => {
    await this.executeScenario(page, stepsToRun, mergedDataRecord);
  });
}

  private interpolateStep(step: StepIntent, profileDataRecord?: Record<string, any>): StepIntent {
    const dataRecord = { 
      ...profileDataRecord, 
      ...((step as any)._stepContextData || {}) 
    };

    let resolvedValue = step.value;

    // 1. Resolve step.value
    if (typeof resolvedValue === 'string') {
      if (resolvedValue === '${data}') {
        if (step.fieldKey && dataRecord && step.fieldKey in dataRecord) {
          resolvedValue = dataRecord[step.fieldKey];
        }
      } else if (resolvedValue.startsWith('${data:') && resolvedValue.endsWith('}')) {
        const key = resolvedValue.slice(7, -1);
        resolvedValue = dataRecord?.[key] ?? resolvedValue;
      } else if (resolvedValue.startsWith('${store:') && resolvedValue.endsWith('}')) {
        const key = resolvedValue.slice(8, -1);
        resolvedValue = globalContextStore.get<string>(key) ?? resolvedValue;
      } else {
        resolvedValue = globalContextStore.resolve(resolvedValue);
      }
    } else if (resolvedValue === undefined && step.fieldKey && (step.intent === 'populate' || step.intent === 'verify')) {
      if (dataRecord && step.fieldKey in dataRecord) {
        resolvedValue = dataRecord[step.fieldKey];
      }
    }

    // 2. Resolve step.params object properties against dataRecord & globalContextStore
    let resolvedParams = step.params ? globalContextStore.resolve(step.params) : step.params;

    if (resolvedParams && typeof resolvedParams === 'object') {
      const updatedParams: Record<string, any> = {};
      for (const [pKey, pVal] of Object.entries(resolvedParams)) {
        if (typeof pVal === 'string') {
          if (pVal.startsWith('${data:') && pVal.endsWith('}')) {
            const dataKey = pVal.slice(7, -1);
            updatedParams[pKey] = dataRecord?.[dataKey] ?? pVal;
          } else if (pVal.startsWith('${store:') && pVal.endsWith('}')) {
            const storeKey = pVal.slice(8, -1);
            updatedParams[pKey] = globalContextStore.get<string>(storeKey) ?? pVal;
          } else {
            updatedParams[pKey] = pVal;
          }
        } else {
          updatedParams[pKey] = pVal;
        }
      }
      resolvedParams = updatedParams;
    }

    return { ...step, value: resolvedValue, params: resolvedParams };
  }
  
  public async executeStep(page: Page, step: StepIntent, stepIndex: number): Promise<void> {
    const fieldKeyDisplay = step.fieldKey || 'PAGE';
    const stepLabel = step.step ? ` (${step.step})` : '';
    const stepName = `Step ${stepIndex + 1}: ${step.intent.toUpperCase()} on [${fieldKeyDisplay}]${stepLabel}`;

    await test.step(stepName, async () => {
      try {
        // 1. Handle Navigation Intent
        if (step.intent === 'navigate') {
          const targetUrl = (step as any).url || (typeof step.value === 'string' ? step.value : '/');
          await page.goto(targetUrl);
          return;
        }

        // 2. Check Page-Level Intent
        const isPageTarget = !step.fieldKey || step.fieldKey.toUpperCase() === 'PAGE';

        if (isPageTarget) {
          if (step.intent === 'verify' && step.assertion) {
            const defaultPageEntry: UiMapEntry = { widgetType: 'PAGE' };
            const pageControl = new PageControl(page, defaultPageEntry, step.params);
            await pageControl.verifyPageLevel(
              step.assertion,
              typeof step.value === 'string' ? step.value : undefined
            );
            return;
          }
          throw new Error(`Intent "${step.intent}" is not supported at page level.`);
        }

        // 3. Resolve Non-Page Control Instance strictly via resolveUiEntry
        const resolvedUiEntry = this.resolveUiEntry(step);
        const control = this.resolveControl(page, resolvedUiEntry, step.params);

        // 4. Dispatch Intents with Params Forwarding
        switch (step.intent) {
          case 'populate':
            if (typeof step.value !== 'string' && !Array.isArray(step.value)) {
              throw new Error(`populate intent requires a valid string or array value.`);
            }

            if (control instanceof SearchControl) {
              await control.populate(step.value as string, step.params);
            } else {
              await (control as any).populate(step.value, step.params);
            }
            break;

          case 'click':
          case 'action':
            if (control instanceof SearchControl) {
              await control.action(step.params);
            } else if (control instanceof TableControl) {
              await control.action(step.params); // 👈 CALL TableControl.action!
            } else if ('action' in control && typeof (control as any).action === 'function') {
              await (control as any).action(step.params);
            } else {
              await control.click(step.params);
            }
            break;

          case 'verify':
            await control.verify(
              step.assertion,
              typeof step.value === 'string' ? step.value : undefined,
              step.params
            );
            break;

          default:
            throw new Error(`Intent "${step.intent}" is not supported by dispatcher.`);
        }

        // 5. Post-execution Context Store Capture
        if (step.storeAs) {
          const capturedValue = await control.getValue();
          globalContextStore.set(step.storeAs, capturedValue);
          console.log(`[IntentFlow] Stored runtime context key "${step.storeAs}" = "${capturedValue}"`);
        }
      } catch (error) {
        await this.captureErrorScreenshot(page, stepIndex);
        throw error;
      }
    });
  }

  private resolveUiEntry(step: StepIntent): UiMapEntry {
    if (!step.fieldKey) throw new Error(`[IntentFlow] Step requires a fieldKey.`);
    
    const entry = this.uiMap[step.fieldKey];
    if (!entry) {
      const availableKeys = Object.keys(this.uiMap).join(', ');
      throw new Error(
        `[IntentFlow] fieldKey "${step.fieldKey}" was not found in loaded UI Maps. Available keys: [${availableKeys}]`
      );
    }

    return entry;
  }

  private resolveControl(page: Page, uiEntry: UiMapEntry, params?: ActionParams): BaseControl {
    switch (uiEntry.widgetType) {
      case 'TEXTBOX':
        return new TextBoxControl(page, uiEntry, params);

      case 'BUTTON':
      case 'LINK':
        return new ButtonControl(page, uiEntry, params);

      case 'CHECKBOX':
        return new CheckboxControl(page, uiEntry, params);

      case 'SEARCH':
        return new SearchControl(page, uiEntry, params);

      case 'WEB_TABLE':
        return new TableControl(page, uiEntry, params);

      case 'PAGE':
        return new PageControl(page, uiEntry, params);

      case 'CONTAINER':
      case 'LABEL':
      case 'GENERIC':
        return new GenericControl(page, uiEntry, params);

      default:
        throw new Error(`[CommandDispatcher] Unsupported widgetType '${uiEntry.widgetType}'`);
    }
  }

  private async captureErrorScreenshot(page: Page, stepIndex: number): Promise<void> {
    const screenshotPath = `test-results/screenshots/error-step-${stepIndex}-${Date.now()}.png`;
    try {
      await page.screenshot({ path: screenshotPath, fullPage: true });
    } catch (e) {
      // Ignore screenshot errors during teardown
    }
  }
}