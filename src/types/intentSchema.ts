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
  'NOT_VISIBLE',
  'TEXT_EQUALS',
  'CONTAIN_TEXT',
  'ENABLED',
  'DISABLED',
] as const;

export const IntentSchema = z.enum(INTENTS);
export const ActionTypeSchema = z.enum(ACTION_TYPES);
export const AssertionSchema = z.enum(ASSERTIONS);

export const StepIntentSchema = z.object({
  step: z.string().optional(),
  fieldKey: z.string().optional(),
  intent: z.enum(['populate', 'click', 'action', 'verify', 'include', 'custom']),
  actionType: ActionTypeSchema.optional(),
  widgetType: z
    .enum([
      'TEXTBOX',
      'BUTTON',
      'CHECKBOX',
      'DROPDOWN',
      'LABEL',
      'LINK',
      'CONTAINER',
      'REGION',
      'DUAL_LISTBOX',
      'WEB_TABLE',
      'GENERIC',
    ])
    .optional(),
  subAction: z.string().optional(),
  value: z.union([z.string(), z.boolean(), z.array(z.string())]).optional(),
  params: z.record(z.string(), z.any()).optional(),
  handlerName: z.string().optional(),
  script: z.string().optional(),
  assertion: AssertionSchema.optional(),
  storeAs: z.string().optional(), // Dynamic context store key
  scenario: z.string().optional(), // For include macro steps
  dataId: z.string().optional(), // Data profile key
});

export const TestScenarioSchema = z
  .object({
    testName: z.string().optional(),
    description: z.string().optional(),
    refScenario: z.string().optional(),
    steps: z.array(StepIntentSchema).optional(),
    additionalSteps: z.array(StepIntentSchema).optional(),
  })
  .refine(
    (data) => data.steps !== undefined || data.refScenario !== undefined,
    { message: "A scenario must provide either 'steps' or a 'refScenario' reference." }
  );

// Dynamic Test Data Profile Schema
export const TestDataProfileSchema = z
  .object({
    usesScenario: z.string({ message: "'usesScenario' is required for every profile" }).optional(),
    scenarioFile: z.string().optional(),
    verifications: z.array(StepIntentSchema).optional(),
    data: z.record(z.string(), z.any()).optional(),
  })
  .catchall(z.unknown());

// Single-File Consolidated Suite Specification Schema
export const SuiteSpecSchema = z.object({
  page: z.string({ message: "'page' is required in suite header" }),
  description: z.string().optional(),
  uiMap: z.union([
    z.string(),
    z.array(z.string()),
    z.record(z.string(), z.string()),
  ]),
  sharedScenarios: z.record(z.string(), TestScenarioSchema),
  profiles: z.record(z.string(), TestDataProfileSchema),
});

// Map of profile names to dynamic profiles
export const TestDataFileSchema = z.record(z.string(), TestDataProfileSchema);

// Exported TypeScript Types
export type Intent = z.infer<typeof IntentSchema>;
export type ActionType = z.infer<typeof ActionTypeSchema>;
export type Assertion = z.infer<typeof AssertionSchema>;
export type StepIntent = z.infer<typeof StepIntentSchema>;
export type TestScenario = z.infer<typeof TestScenarioSchema>;
export type TestDataProfile = z.infer<typeof TestDataProfileSchema>;
export type TestDataFile = z.infer<typeof TestDataFileSchema>;
export type SuiteSpec = z.infer<typeof SuiteSpecSchema>;