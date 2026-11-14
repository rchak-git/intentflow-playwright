// src/engine/commandDispatcher.ts
import { test, Page } from '@playwright/test';
import type { UiMapEntry } from '../types/uiMapTypes';
import { 
  SuiteSpec, 
  PipelineStep, 
  StepParams 
} from '../types/intentSchema';
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
import { UI_MAP_REGISTRY, GLOBAL_UI_MAP } from '../registries/UiMapIndex';
import { SelectControl } from '../controls/selectControl';
import { CustomSelectControl } from '../controls/customSelectControl';
import { RadioGroupControl } from '../controls/RadioGroupControl';
import { CardControl } from '../controls/CardControl';

export class CommandDispatcher {
  private uiMap: Record<string, UiMapEntry>;
  private suite?: SuiteSpec;
  private activePage?: Page;
  private pagesMap: Map<string, Page> = new Map();

  // Regex pattern matching: ${data:key} OR ${data:key || 'default_value'} OR ${data:key || "default_value"}
  private static TOKEN_REGEX = /^\$\{data:([a-zA-Z0-9_]+)(?:\s*\|\|\s*(?:'([^']*)'|"([^"]*)"|([^}\s]+)))?\}$/;

  constructor(uiMap: Record<string, UiMapEntry> = {}, suite?: SuiteSpec) {
    this.uiMap = uiMap;
    this.suite = suite;
  }

  /**
   * Factory method to dynamically load and merge UI Map(s) declared in Suite YAML header.
   */
  public static async fromSuite(suite: SuiteSpec): Promise<CommandDispatcher> {
    let mergedUiMap: Record<string, UiMapEntry> = {};

    const rawMapPaths = suite?.uiMap
      ? Array.isArray(suite.uiMap)
        ? suite.uiMap
        : [suite.uiMap]
      : [];

    if (rawMapPaths.length > 0) {
      for (const rawMapPath of rawMapPaths) {
        if (!rawMapPath) continue;
        const resolvedKey = rawMapPath.replace(/^.*[\\/]/, '').replace(/\.(ts|js|json|map)$/, '');
        const mapExport = UI_MAP_REGISTRY[rawMapPath] || UI_MAP_REGISTRY[resolvedKey];

        if (mapExport) {
          mergedUiMap = { ...mergedUiMap, ...mapExport };
        } else {
          console.warn(
            `[IntentFlow] Specific UI Map key '${rawMapPath}' not found in registry. Falling back to global UI Map lookup.`
          );
        }
      }
    }

    // Merge GLOBAL_UI_MAP as a fallback layer so cross-page upstream dependencies resolve automatically
    mergedUiMap = { ...GLOBAL_UI_MAP, ...mergedUiMap };

    return new CommandDispatcher(mergedUiMap, suite);
  }

  /**
   * Executes a named data profile directly from a SuiteSpec.
   * Enforces Rule 2.3 (Shallow Preconditions) and Rule 2.5 (Explicit Setup Stacking).
   */
  public async executeProfile(
    page: Page,
    profileName: string,
    overrideSuite?: SuiteSpec
  ): Promise<void> {
    const activeSuite = overrideSuite || this.suite;

    if (!activeSuite) {
      throw new Error(
        `[IntentFlow] Cannot execute profile '${profileName}': No SuiteSpec bound to CommandDispatcher.`
      );
    }

    const profile = activeSuite.profiles?.[profileName];
    if (!profile) {
      throw new Error(`[IntentFlow] Profile '${profileName}' not found in suite profiles.`);
    }

    // 1. Execute Top-Level Preconditions Shallowly (Rule 2.3 & Rule 2.5)
    if (profile.preconditions && profile.preconditions.length > 0) {
      for (const precondition of profile.preconditions) {
        await test.step(`Precondition [${precondition.refProfile}]`, async () => {
          // Precondition data frame is strictly isolated from parent context
          const preconditionData = precondition.data || {};
          await this.executePreconditionProfileShallow(page, precondition.refProfile, preconditionData, activeSuite);
        });
      }
    }

    const sharedScenarios = activeSuite.sharedScenarios || {};
    const suiteProfiles = activeSuite.profiles || {};

    let steps: PipelineStep[] = [];
    const profileData = profile.data || {};

    // 2. Resolve steps: Path 2 supports direct profile 'steps:' OR 'refScenario' OR legacy 'refProfile'
    if (profile.steps && profile.steps.length > 0) {
      steps = profile.steps;
    } else if (profile.refScenario) {
      steps = resolveScenarioSteps(profile.refScenario, sharedScenarios, suiteProfiles);
    } else if (profile.refProfile) {
      const targetProfile = suiteProfiles[profile.refProfile];
      if (!targetProfile) {
        throw new Error(`[IntentFlow] Referenced profile '${profile.refProfile}' not found.`);
      }
      const mergedData = { ...(targetProfile.data || {}), ...profileData };
      const targetSteps = targetProfile.steps || resolveScenarioSteps(targetProfile.refScenario!, sharedScenarios, suiteProfiles);
      await this.executeScenario(page, targetSteps, mergedData);
      return;
    } else {
      throw new Error(`[IntentFlow] Profile '${profileName}' must define 'steps', 'refScenario', or 'refProfile'.`);
    }

    await this.executeScenario(page, steps, profileData);
  }

  /**
   * Rule 2.3 Shallow Precondition Runner:
   * Executes referenced precondition profiles WITHOUT recursing into their inner preconditions.
   */
  private async executePreconditionProfileShallow(
    page: Page,
    refProfileKey: string,
    preconditionData: Record<string, any>,
    currentSuite: SuiteSpec
  ): Promise<void> {
    let targetSuite = currentSuite;
    let targetProfileName = refProfileKey;

    // Handle cross-suite dot notation (e.g., "moodleLoginSteps.td_successfulStudentLogin")
    if (refProfileKey.includes('.')) {
      const [, profileName] = refProfileKey.split('.');
      targetProfileName = profileName;
    }

    const profile = targetSuite.profiles?.[targetProfileName];
    if (!profile) {
      console.warn(`[IntentFlow Precondition] Profile '${targetProfileName}' referenced in precondition not found directly in active suite profiles.`);
      return;
    }

    const sharedScenarios = targetSuite.sharedScenarios || {};
    const suiteProfiles = targetSuite.profiles || {};
    const mergedPreconditionData = { ...(profile.data || {}), ...preconditionData };

    // SHALLOW EXECUTION: Resolve steps/scenario directly without calling executeProfile or running profile.preconditions
    const steps = profile.steps || resolveScenarioSteps(profile.refScenario!, sharedScenarios, suiteProfiles);
    await this.executeScenario(page, steps, mergedPreconditionData);
  }

  /**
   * Executes a scenario pipeline consisting of IntentSteps and RefScenarioSteps.
   */
  public async executeScenario(
    page: Page,
    steps: PipelineStep[],
    dataRecord: Record<string, any> = {}
  ): Promise<void> {
    for (let i = 0; i < steps.length; i++) {
      const step: any = steps[i];

      if (step.refScenario && !step.intent) {
        await this.handleRefScenarioStep(page, step, dataRecord);
        continue;
      }

      const processedStep = this.interpolateStep(step, dataRecord);
      await this.executeStep(page, processedStep, i, dataRecord);
    }
  }

  /**
   * Handles refScenario inclusion recursively with deep parameter resolution.
   */
  private async handleRefScenarioStep(
    page: Page,
    step: any,
    currentDataRecord: Record<string, any>
  ): Promise<void> {
    if (!this.suite) {
      throw new Error(`[IntentFlow] Cannot resolve 'refScenario' without a SuiteSpec bound to CommandDispatcher.`);
    }

    const targetScenarioName = step.refScenario;

    // Resolve inline mapped data (e.g., username: "${data:username}") against parent context
    const resolvedInlineData: Record<string, any> = {};
    if (step.data) {
      for (const [dKey, dVal] of Object.entries(step.data)) {
        resolvedInlineData[dKey] = this.resolveValue(dVal, currentDataRecord, `RefScenario inline data '${dKey}'`);
      }
    }

    const mergedDataRecord = {
      ...currentDataRecord,
      ...(step.params?._stepContextData || {}),
      ...resolvedInlineData,
    };

    const sharedScenarios = this.suite.sharedScenarios || {};
    const suiteProfiles = this.suite.profiles || {};
    const stepsToRun = resolveScenarioSteps(targetScenarioName, sharedScenarios, suiteProfiles);

    await test.step(`Include Scenario [${targetScenarioName}]`, async () => {
      await this.executeScenario(page, stepsToRun, mergedDataRecord);
    });
  }

  /**
   * Interpolates data variables inside step.params against profile dataset and globalContextStore.
   */
  private interpolateStep(step: any, dataRecord: Record<string, any> = {}): any {
    if (!step.params) return step;

    const rawStepContext = step.params._stepContextData || {};
    const resolvedStepContext: Record<string, any> = {};
    for (const [sKey, sVal] of Object.entries(rawStepContext)) {
      resolvedStepContext[sKey] = this.resolveValue(sVal, dataRecord, `StepContext key '${sKey}'`);
    }

    const mergedDataRecord = {
      ...resolvedStepContext,
      ...dataRecord,
    };

    const interpolatedParams: Record<string, any> = {};
    for (const [pKey, pVal] of Object.entries(step.params)) {
      if (pKey === '_stepContextData') continue;
      interpolatedParams[pKey] = this.resolveValue(pVal, mergedDataRecord, `Step parameter '${pKey}'`);
    }

    return {
      ...step,
      params: interpolatedParams as StepParams,
    };
  }

  /**
   * Path 2 Token & Inline Fallback Resolver Engine (Rule 2.4 & Edge Case C)
   * Resolves ${data:key} AND ${data:key || 'default_value'} recursively.
   */
  private resolveValue(val: any, dataRecord: Record<string, any>, contextName: string = 'Step'): any {
    if (typeof val === 'string') {
      if (val.startsWith('${data:')) {
        const match = val.match(CommandDispatcher.TOKEN_REGEX);
        if (match) {
          const [, key, singleQuotedDefault, doubleQuotedDefault, rawDefault] = match;
          const defaultValue = singleQuotedDefault ?? doubleQuotedDefault ?? rawDefault;
          const profileValue = dataRecord?.[key];

          // 1. Return profile value if present and non-empty
          if (profileValue !== undefined && profileValue !== null && profileValue !== '') {
            if (typeof profileValue === 'string' && profileValue.startsWith('${data:')) {
              return this.resolveValue(profileValue, dataRecord, contextName);
            }
            return profileValue;
          }

          // 2. Return fallback default if available
          if (defaultValue !== undefined) {
            return defaultValue;
          }

          // 3. Fail fast on missing mandatory token without fallback (Rule 2.4 / Edge Case C)
          throw new Error(
            `[TokenResolverError] Unresolved mandatory data token "${val}" at ${contextName}. No value provided in profile dataset and no inline default fallback specified.`
          );
        }
      }

      if (val.startsWith('${store:') && val.endsWith('}')) {
        const storeKey = val.slice(8, -1);
        return globalContextStore.get<string>(storeKey) ?? val;
      }
      return globalContextStore.resolve(val);
    }

    if (Array.isArray(val)) {
      return val.map((item) => this.resolveValue(item, dataRecord, contextName));
    }

    if (typeof val === 'object' && val !== null) {
      const resolvedObj: Record<string, any> = {};
      for (const [k, v] of Object.entries(val)) {
        resolvedObj[k] = this.resolveValue(v, dataRecord, `${contextName} -> '${k}'`);
      }
      return resolvedObj;
    }

    return val;
  }

  /**
   * Core Polymorphic Step Dispatcher with Dynamic fieldKey Token Evaluation & Two-Tab Support
   */
  public async executeStep(
    page: Page,
    step: any,
    stepIndex: number,
    dataRecord: Record<string, any> = {}
  ): Promise<void> {
    if (this.pagesMap.get('main') !== page) {
      this.pagesMap.clear();
      this.pagesMap.set('main', page);
      this.activePage = page;
    }
    const activeTargetPage = this.activePage || page;

    // Dynamic fieldKey Token Evaluation: Resolve dynamic tokens inside step.fieldKey before UI map lookup!
    const rawFieldKey = step.fieldKey || 'page';
    const fieldKeyDisplay = this.resolveValue(rawFieldKey, dataRecord, `Step fieldKey '${rawFieldKey}'`);

    const stepLabel = step.step ? ` (${step.step})` : '';
    const intentDisplay = step.intent ? String(step.intent).toUpperCase() : 'ACTION';
    const stepName = `Step ${stepIndex + 1}: ${intentDisplay} on [${fieldKeyDisplay}]${stepLabel}`;

    await test.step(stepName, async () => {
      try {
        const params = step.params || {};

        // 1. Page-Level Execution (fieldKey === 'page')
        if (String(fieldKeyDisplay).toLowerCase() === 'page') {
          if (step.intent === 'custom' && params.handler === 'switchTab') {
            await this.handleSwitchTab(activeTargetPage, params);
            return;
          }

          const defaultPageEntry: UiMapEntry = { widgetType: 'PAGE' };
          const pageControl = new PageControl(activeTargetPage, defaultPageEntry, params);

          if (step.intent === 'action') {
            if (params.subIntent === 'navigate' || params.subIntent === 'setValue') {
              const url = typeof params.value === 'string' ? params.value : (this.suite?.page || '/');
              await activeTargetPage.goto(url, { waitUntil: 'domcontentloaded' });
              return;
            }
            if (params.subIntent === 'pressKey' && typeof params.value === 'string') {
              await activeTargetPage.keyboard.press(params.value);
              return;
            }
          }

          if (step.intent === 'verify') {
            await pageControl.verifyPageLevel(params.subIntent || 'state', params.value);
            return;
          }
        }

        // 2. Resolve Non-Page Control Instance using dynamically evaluated fieldKey
        const resolvedUiEntry = this.resolveUiEntry(fieldKeyDisplay);
        const control = this.resolveControl(activeTargetPage, resolvedUiEntry, params);

        // 3. Strict Top-Level Verb Dispatching
        switch (step.intent) {
          case 'populate':
            await control.populate(params.value, params);
            break;

          case 'action':
            await control.action(params);
            break;

          case 'verify':
            await control.verify(params.subIntent || 'equals', params.value, params);
            break;

          case 'extract': {
            const extractedVal = await control.getValue();
            if (params.storeAs) {
              globalContextStore.set(params.storeAs, extractedVal);
              console.log(`[IntentFlow] Extracted and stored key "${params.storeAs}" = `, extractedVal);
            }
            break;
          }

          case 'custom':
            if (!params.handler) {
              throw new Error(`[IntentFlow] Step with 'intent: custom' requires 'params.handler' key.`);
            }
            await control.executeCustomHandler(params.handler, params);
            break;

          default:
            throw new Error(`[IntentFlow] Intent "${step.intent}" is not supported by dispatcher.`);
        }

        // 4. Runtime Store Capture
        if (params.storeAs) {
          const capturedValue = await control.getValue();
          globalContextStore.set(params.storeAs, capturedValue);
          console.log(`[IntentFlow] Stored runtime context key "${params.storeAs}" = "${capturedValue}"`);
        }
      } catch (error) {
        await this.captureErrorScreenshot(this.activePage || activeTargetPage, stepIndex);
        throw error;
      }
    });
  }

  /**
   * Minimal two-tab lifecycle:
   * - 'new': focuses the newly opened child tab
   * - 'main': closes any open child tab(s) and restores focus to the main tab
   */
  private async handleSwitchTab(currentPage: Page, params: StepParams): Promise<void> {
    const context = currentPage.context();
    const targetKey = params.value !== undefined ? String(params.value) : 'new';
    const timeout = params.timeout ?? 5000;
    const mainPage = this.pagesMap.get('main') || currentPage;

    if (targetKey === 'new') {
      const existingChild = context.pages().find((p) => !p.isClosed() && p !== mainPage);
      const childPage = existingChild ?? (await context.waitForEvent('page', { timeout }));

      this.pagesMap.set('new', childPage);
      await childPage.waitForLoadState('domcontentloaded');
      await childPage.bringToFront();
      this.activePage = childPage;
      console.log(`[IntentFlow] Switched active tab to 'new' (${childPage.url()})`);
      return;
    }

    if (targetKey === 'main') {
      for (const p of context.pages()) {
        if (p !== mainPage && !p.isClosed()) {
          await p.close();
        }
      }
      this.pagesMap.delete('new');
      await mainPage.bringToFront();
      this.activePage = mainPage;
      console.log(`[IntentFlow] Closed child tab and returned focus to 'main' (${mainPage.url()})`);
      return;
    }

    throw new Error(`[IntentFlow] Unsupported switchTab target '${targetKey}'. Expected 'main' or 'new'.`);
  }

  private resolveUiEntry(fieldKey: string): UiMapEntry {
    const entry = this.uiMap[fieldKey];
    if (!entry) {
      const availableKeys = Object.keys(this.uiMap).join(', ');
      throw new Error(
        `[IntentFlow] fieldKey "${fieldKey}" was not found in loaded UI Maps. Available keys: [${availableKeys}]`
      );
    }
    return entry;
  }

  private resolveControl(page: Page, uiEntry: UiMapEntry, params?: StepParams): BaseControl {
    switch (uiEntry.widgetType) {
      case 'TEXTBOX':
        return new TextBoxControl(page, uiEntry, params);

      case 'BUTTON':
      case 'LINK':
        return new ButtonControl(page, uiEntry, params);

      case 'RADIO_GROUP':
        return new RadioGroupControl(page, uiEntry, params);

      case 'CHECKBOX':
        return new CheckboxControl(page, uiEntry, params);

      case 'SEARCH':
        return new SearchControl(page, uiEntry, params);

      case 'SELECT':
        return new SelectControl(page, uiEntry, params);

      case 'CUSTOM_SELECT':
        return new CustomSelectControl(page, uiEntry, params);

      case 'WEB_TABLE':
      case 'TABLE':
        return new TableControl(page, uiEntry, params);

      case 'PAGE':
        return new PageControl(page, uiEntry, params);

      case 'CARD':
        return new CardControl(page, uiEntry, params);

      case 'CONTAINER':
      case 'LABEL':
      case 'GENERIC':
        return new GenericControl(page, uiEntry, params);

      default:
        return new GenericControl(page, uiEntry, params);
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