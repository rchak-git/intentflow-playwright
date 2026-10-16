import { z } from 'zod';

export const INTENTS = ['populate', 'action', 'verify', 'custom'] as const;
export const ACTION_TYPES = [
  'POPULATE',
  'CLICK',
  'SELECT',
  'CHECK',
  'HOVER',
  'CUSTOM_SCRIPT',
  'CUSTOM_HANDLER',
] as const;
export const ASSERTIONS = [
  'VISIBLE',
  'HIDDEN',
  'TEXT_EQUALS',
  'CONTAIN_TEXT',
  'ENABLED',
  'DISABLED',
] as const;

export const IntentSchema = z.enum(INTENTS);
export const ActionTypeSchema = z.enum(ACTION_TYPES);
export const AssertionSchema = z.enum(ASSERTIONS);

export const StepIntentSchema = z.object({
  /** Element locator key in FormUiMap */
  fieldKey: z.string().optional(),
  intent: IntentSchema,
  actionType: ActionTypeSchema.optional(),
  /** e.g. "DUAL_LISTBOX", "WEBTABLE", "TEXTBOX" */

  widgetType: z.enum(['TEXTBOX', 'BUTTON', 'DUAL_LISTBOX', 'WEB_TABLE']).optional(),
  // widgetType: z.string().optional(),
  /** e.g. "ADD", "REMOVE", "REMOVE_ALL", "FILTER", "SORT" */
  subAction: z.string().optional(),
  value: z.union([z.string(), z.boolean(), z.array(z.string())]).optional(),
  /** Dynamic parameters for custom handlers or widgets */
  params: z.record(z.string(), z.any()).optional(),
  /** CUSTOM_HANDLER escape hatch */
  handlerName: z.string().optional(),
  /** CUSTOM_SCRIPT raw JS execution */
  script: z.string().optional(),
  assertion: AssertionSchema.optional(),
});

export const TestScenarioSchema = z.object({
  testName: z.string(),
  description: z.string().optional(),
  steps: z.array(StepIntentSchema),
});

export type Intent = z.infer<typeof IntentSchema>;
export type ActionType = z.infer<typeof ActionTypeSchema>;
export type Assertion = z.infer<typeof AssertionSchema>;
export type StepIntent = z.infer<typeof StepIntentSchema>;
export type TestScenario = z.infer<typeof TestScenarioSchema>;
