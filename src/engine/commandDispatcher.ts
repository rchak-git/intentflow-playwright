import * as path from 'path';
import { test, Page } from '@playwright/test';
import type { UiMapEntry } from '../types/uiMapTypes';
import { SuiteSpec, StepIntent } from '../types/intentSchema';
import { resolveScenarioSteps } from './yamlLoader';
import { globalContextStore } from './contextStore';
import { TextBoxControl } from '../controls/textBoxControl';
import { ButtonControl } from '../controls/buttonControl';
import { PageControl } from '../controls/pageControl';
import { GenericControl } from '../controls/genericControl';
import { BaseControl } from '../controls/baseControl';

export class CommandDispatcher {
  private uiMap: Record<string, UiMapEntry>;

  constructor(uiMap: Record<string, UiMapEntry> = {}) {
    this.uiMap = uiMap;
  }

  /**
   * Factory method to dynamically load and merge UI Map(s) declared in Suite YAML header
   */
  public static async fromSuite(suite: SuiteSpec): Promise<CommandDispatcher> {
    const mapPaths = Array.isArray(suite.uiMap)
      ? suite.uiMap
      : typeof suite.uiMap === 'string'
      ? [suite.uiMap]
      : Object.values(suite.uiMap);

    let mergedUiMap: Record<string, UiMapEntry> = {};

    for (const mapPath of mapPaths) {
      const cleanPath = mapPath.replace(/^src\//, '');
      const fullPath = path.resolve(process.cwd(), 'src', cleanPath);

      const uiMapModule = await import(fullPath);

      // Extract named exported object directly (ignoring system ESM keys like __esModule or default)
      let resolvedMap: Record<string, UiMapEntry> | undefined;

      for (const exportKey of Object.keys(uiMapModule)) {
        if (exportKey !== '__esModule' && exportKey !== 'default' && typeof uiMapModule[exportKey] === 'object') {
          resolvedMap = uiMapModule[exportKey];
          break;
        }
      }

      // Fallback: Check default export if named export was not found
      if (!resolvedMap && uiMapModule.default) {
        resolvedMap = uiMapModule.default;
      }

      if (resolvedMap) {
        mergedUiMap = {
          ...mergedUiMap,
          ...resolvedMap,
        };
      }
    }

    return new CommandDispatcher(mergedUiMap);
  }

  /**
   * Executes a named data profile directly from a SuiteSpec
   */
  public async executeProfile(page: Page, profileName: string, suite: SuiteSpec): Promise<void> {
    const profile = suite.profiles[profileName];
    if (!profile) {
      throw new Error(`Profile '${profileName}' not found in suite profiles.`);
    }

    // Reset runtime store before scenario execution to maintain test isolation
    globalContextStore.clear();

    // Resolve scenario steps (supports refScenario and additionalSteps composition)
    const scenarioName = profile.usesScenario ?? '';
    const rawSteps = resolveScenarioSteps(scenarioName, suite.sharedScenarios);

    // Interpolate placeholders against profile data and execute steps sequentially
    await this.executeScenario(page, rawSteps, profile.data);
  }

  public async executeScenario(
    page: Page,
    steps: StepIntent[],
    dataRecord: Record<string, any> = {}
  ): Promise<void> {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const processedStep = this.interpolateStep(step, dataRecord);
      await this.executeStep(page, processedStep, i);
    }
  }

  private interpolateStep(step: StepIntent, dataRecord?: Record<string, any>): StepIntent {
    let resolvedValue = step.value;

    if (typeof resolvedValue === 'string') {
      if (resolvedValue === '${data}') { if (step.fieldKey && dataRecord && step.fieldKey in dataRecord) { resolvedValue = dataRecord[step.fieldKey]; } } else if (resolvedValue.startsWith('${data:') && resolvedValue.endsWith('}')) {
        const key = resolvedValue.slice(7, -1);
        resolvedValue = dataRecord?.[key] ?? resolvedValue;
      } else if (resolvedValue.startsWith('${store:') && resolvedValue.endsWith('}')) {
        const key = resolvedValue.slice(8, -1);
        resolvedValue = globalContextStore.get<string>(key) ?? resolvedValue;
      } else {
        // Resolve dynamic runtime tokens (${context:key})
        resolvedValue = globalContextStore.resolve(resolvedValue);
      }
    } else if (resolvedValue === undefined && step.fieldKey && (step.intent === 'populate' || step.intent === 'verify')) {
      if (dataRecord && step.fieldKey in dataRecord) {
        resolvedValue = dataRecord[step.fieldKey];
      }
    }

    const resolvedParams = step.params ? globalContextStore.resolve(step.params) : step.params;

    return { ...step, value: resolvedValue, params: resolvedParams };
  }

  public async executeStep(page: Page, step: StepIntent, stepIndex: number): Promise<void> {
    const fieldKeyDisplay = step.fieldKey || 'PAGE';
    const stepLabel = step.step ? ` (${step.step})` : '';
    const stepName = `Step ${stepIndex + 1}: ${step.intent.toUpperCase()} on [${fieldKeyDisplay}]${stepLabel}`;

    await test.step(stepName, async () => {
      try {
        if (!step.fieldKey || step.fieldKey.toUpperCase() === 'PAGE') {
          if (step.intent === 'verify' && step.assertion) {
            const pageControl = new PageControl(page);
            await pageControl.verifyPageLevel(
              step.assertion,
              typeof step.value === 'string' ? step.value : undefined
            );
            return;
          }
          throw new Error(`Intent "${step.intent}" is not supported at page level.`);
        }

        const uiEntry = this.resolveUiEntry(step);
        const control = this.resolveControl(page, uiEntry.widgetType, uiEntry);

        switch (step.intent) {
          case 'populate':
            if (typeof step.value !== 'string' && !Array.isArray(step.value)) {
              throw new Error(`populate intent requires a valid string or array value.`);
            }
            await (control as any).populate(step.value);
            break;

          case 'click':
          case 'action':
            await control.click();
            break;

          case 'verify':
            await control.verify(
              step.assertion,
              typeof step.value === 'string' ? step.value : undefined
            );
            break;

          default:
            throw new Error(`Intent "${step.intent}" is not supported by dispatcher.`);
        }

        // Post-execution: Capture element state into context store via polymorphic getValue()
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
    if (!step.fieldKey) throw new Error(`Step requires a fieldKey.`);
    const entry = this.uiMap[step.fieldKey];
    if (!entry) throw new Error(`fieldKey "${step.fieldKey}" missing in registered UI Map.`);
    return entry;
  }

  private resolveControl(page: Page, widgetType: string, uiEntry: UiMapEntry): BaseControl {
    switch (widgetType) {
      case 'BUTTON':
        return new ButtonControl(page, uiEntry);

      case 'TEXTBOX':
        return new TextBoxControl(page, uiEntry);

      case 'LABEL':
      case 'CONTAINER':
      case 'REGION':
      case 'LINK':
      case 'GENERIC':
        return new GenericControl(page, uiEntry);

      default:
        return new GenericControl(page, uiEntry);
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