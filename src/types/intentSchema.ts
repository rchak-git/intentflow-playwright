import { z } from 'zod';

export const INTENTS = [
  'navigate',
  'populate',
  'click',
  'action',
  'verify',
  'include',
  'custom',
] as const;

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
  'EMPTY',
] as const;

export const IntentSchema = z.enum(INTENTS);
export const ActionTypeSchema = z.enum(ACTION_TYPES);
export const AssertionSchema = z.enum(ASSERTIONS);

// Element-level action parameters schema for VS Code IntelliSense
export const ActionParamsSchema = z
  .object({
    timeout: z.number().describe("Custom element wait or action timeout in milliseconds").optional(),
    pressEnter: z.boolean().describe("Press 'Enter' key after populating value").optional(),
    selectOption: z.string().describe("Option text to click from autocomplete dropdown").optional(),
    subAction: z.enum(['clear', 'search']).describe("Control sub-action type").optional(),
    force: z.boolean().describe("Bypass Playwright actionability checks").optional(),
  })
  .passthrough(); // Allows custom control overrides

export const StepIntentSchema = z
  .object({
    step: z.string().describe("Step description or label").optional(),
    fieldKey: z.string().describe("Target element identifier in UI map").optional(),
    intent: IntentSchema.describe("Core action category"),
    actionType: ActionTypeSchema.describe("Action execution type").optional(),
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
        'SEARCH',
        'SEARCH_CONTROL',
        'PAGE',
        'COURSE_CARD',
        'GENERIC',
      ])
      .describe("UI control widget classification")
      .optional(),
    subAction: z.string().describe("Widget-specific sub-action").optional(),
    value: z
      .union([z.string(), z.boolean(), z.array(z.string())])
      .describe("Input value or expected assertion value")
      .optional(),
    params: ActionParamsSchema.describe("Additional action parameters").optional(),
    handlerName: z.string().describe("Custom handler function key").optional(),
    script: z.string().describe("Inline evaluation script").optional(),
    assertion: AssertionSchema.describe("Verification state check").optional(),
    storeAs: z.string().describe("Dynamic context variable name to save value").optional(),
    
    // --- Composition / Chaining Keys (CRITICAL FIX) ---
    refProfile: z.string().describe("Reference to an included profile key").optional(),
    profile: z.string().describe("Alias reference to an included profile key").optional(),
    refScenario: z.string().describe("Target shared scenario key for include steps").optional(),
    scenario: z.string().describe("Alias reference to a shared scenario key").optional(),
    
    data: z.record(z.string(), z.any()).describe("Inline key-value pair dataset scoped directly to this step").optional(),
    dataId: z.string().describe("Data profile record key").optional(),
    url: z.string().describe("Target page URL for navigate intent").optional(),
  })
  .passthrough(); // Guarantees step properties are NEVER stripped during parsing

// Backward compatibility alias
export const StepSchema = StepIntentSchema;

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
  )
  .passthrough();

// Dynamic Test Data Profile Schema
export const TestDataProfileSchema = z
  .object({
    usesScenario: z.string({ message: "'usesScenario' is required for every profile" }).optional(),
    refScenario: z.string().optional(),
    scenarioFile: z.string().optional(),
    verifications: z.array(StepIntentSchema).optional(),
    data: z.record(z.string(), z.any()).optional(),
  })
  .passthrough()
  .catchall(z.unknown());

// Single-File Consolidated Suite Specification Schema
export const SuiteSpecSchema = z
  .object({
    page: z.string({ message: "'page' is required in suite header" }),
    description: z.string().optional(),
    includes: z.array(z.string()).optional(), // Supports upstream file imports
    uiMap: z.union([
      z.string(),
      z.array(z.string()),
      z.record(z.string(), z.string()),
    ]),
    sharedScenarios: z.record(z.string(), TestScenarioSchema).optional(),
    profiles: z.record(z.string(), TestDataProfileSchema).optional(),
  })
  .passthrough();

// Map of profile names to dynamic profiles
export const TestDataFileSchema = z.record(z.string(), TestDataProfileSchema);

// Exported TypeScript Types
export type Intent = z.infer<typeof IntentSchema>;
export type ActionType = z.infer<typeof ActionTypeSchema>;
export type Assertion = z.infer<typeof AssertionSchema>;
export type ActionParams = z.infer<typeof ActionParamsSchema>;
export type StepIntent = z.infer<typeof StepIntentSchema>;
export type Step = StepIntent; // Type alias
export type TestScenario = z.infer<typeof TestScenarioSchema>;
export type TestDataProfile = z.infer<typeof TestDataProfileSchema>;
export type TestDataFile = z.infer<typeof TestDataFileSchema>;
export type SuiteSpec = z.infer<typeof SuiteSpecSchema>;