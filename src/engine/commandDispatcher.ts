import type { Page } from '@playwright/test';
import type { StepIntent } from '../types/intentSchema';
import type { UiMapEntry } from '../types/uiMapTypes';
import { TextBoxControl } from '../controls/textBoxControl';
import { ButtonControl } from '../controls/buttonControl';

export class CommandDispatcher {
  private uiMap: Record<string, UiMapEntry>;

  constructor(uiMap: Record<string, UiMapEntry> = {}) {
    this.uiMap = uiMap;
  }

  public setUiMap(uiMap: Record<string, UiMapEntry>): void {
    this.uiMap = uiMap;
  }

  public async executeScenario(page: Page, steps: StepIntent[]): Promise<void> {
    for (let i = 0; i < steps.length; i++) {
      await this.executeStep(page, steps[i], i);
    }
  }

  public async executeStep(page: Page, step: StepIntent, stepIndex: number): Promise<void> {
    console.log(
      `[IntentFlow] Step ${stepIndex}: Intent [${step.intent}] on field [${step.fieldKey || 'N/A'}]`,
    );

    try {
      const uiEntry = this.resolveUiEntry(step);

      // Pass the entire uiEntry directly to the control resolver
      const control = this.resolveControl(page, uiEntry.widgetType, uiEntry);

      switch (step.intent) {
        case 'populate':
          if (typeof step.value !== 'string' && !Array.isArray(step.value)) {
            throw new Error(`populate intent requires a string or array value.`);
          }
          if ('populate' in control && typeof (control as any).populate === 'function') {
            await (control as any).populate(step.value);
          } else {
            throw new Error(`Control for widgetType "${uiEntry.widgetType}" does not support populate.`);
          }
          break;

        case 'action':
          if (step.actionType === 'CLICK') {
            if ('click' in control && typeof (control as any).click === 'function') {
              await (control as any).click();
            } else {
              throw new Error(`Control does not support click action.`);
            }
          } else {
            throw new Error(`Action type "${step.actionType}" is not supported.`);
          }
          break;

        case 'verify':
          if (!step.assertion) {
            throw new Error(`verify intent requires an assertion type.`);
          }
          if ('verify' in control && typeof (control as any).verify === 'function') {
            await (control as any).verify(
              step.assertion,
              typeof step.value === 'string' ? step.value : undefined
            );
          } else {
            throw new Error(`Control does not support verify.`);
          }
          break;

        default:
          throw new Error(`Intent "${step.intent}" is not supported by the dispatcher.`);
      }
    } catch (error) {
      await this.captureErrorScreenshot(page, stepIndex);
      throw error;
    }
  }

  private resolveUiEntry(step: StepIntent): UiMapEntry {
    if (!step.fieldKey) {
      throw new Error(`Intent "${step.intent}" requires a fieldKey.`);
    }
    const entry = this.uiMap[step.fieldKey];
    if (entry === undefined) {
      throw new Error(`fieldKey "${step.fieldKey}" not found in the active UI Map. Check for typos.`);
    }
    return entry;
  }

  private resolveControl(page: Page, widgetType: string, uiEntry: UiMapEntry) {
    switch (widgetType) {
      case 'BUTTON':
        return new ButtonControl(page, uiEntry);
      case 'TEXTBOX':
      default:
        return new TextBoxControl(page, uiEntry);
    }
  }

  private async captureErrorScreenshot(page: Page, stepIndex: number): Promise<void> {
    const path = `test-results/screenshots/error-step-${stepIndex}-${Date.now()}.png`;
    try {
      await page.screenshot({ path, fullPage: true });
      console.log(`[IntentFlow] Error screenshot saved: ${path}`);
    } catch (screenshotError) {
      console.log(`[IntentFlow] Failed to capture error screenshot: ${String(screenshotError)}`);
    }
  }
}