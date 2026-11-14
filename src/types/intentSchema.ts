// src/types/intentSchema.ts
import { z } from 'zod';

// Primary Canonical Verbs (Strict Top-Level Polymorphic Routing)
export const INTENTS = ['action', 'populate', 'verify', 'extract', 'custom', 'REQUIRES_SDET_HANDOFF'] as const;
export const IntentSchema = z.enum(INTENTS);

// Allowed Sub-Intents for WEB_TABLE controls
export const WEB_TABLE_SUB_INTENTS = [
  'cellText',
  'contains',
  'rowCount',
  'count',
  'clickSubControl',
  'sortColumn',
  'tableData',
  'allRowCheckboxesState'
] as const;
export const WebTableSubIntentSchema = z.enum(WEB_TABLE_SUB_INTENTS);

// Minimal Sub-Intent Vocabulary
export const SUB_INTENTS = [
  'navigate',
  'setValue',
  'click',
  'select',
  'remove',
  'toggle',
  'append',
  'clear',
  'pressKey',
  'hover',
  'dblClick',
  'equals',
  'contains',
  'state',
  'urlContains',
  'jsClick',
  'cellText',
  'count',
  'rowCount',
  'clickSubControl',
  'sortColumn',
  'tableData',
  'allRowCheckboxesState',
  'optionsContains',
  'open',
  'close'
] as const;

export const SubIntentSchema = z.enum(SUB_INTENTS);

// Allowed UI Element States
export const STATE_VALUES = ['visible', 'hidden', 'enabled', 'disabled'] as const;
export const StateValueSchema = z.enum(STATE_VALUES);
export type StateValue = z.infer<typeof StateValueSchema>;

// Primitive Scalar Definition
export const ScalarSchema = z.union([z.string(), z.boolean(), z.number()]);

/**
 * Preprocesses raw YAML inputs ('checked', 'true', 'selected', '1', 'unchecked', 'false', '0')
 * into a strict native boolean flag.
 */
export const BooleanStateSchema = z.preprocess(
  (val) => {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') {
      const normalized = val.trim().toLowerCase();
      if (['checked', 'true', 'selected', 'enabled', '1'].includes(normalized)) return true;
      if (['unchecked', 'false', 'deselected', 'disabled', '0'].includes(normalized)) return false;
    }
    return val;
  },
  z.boolean({ message: "Expected boolean or state string ('checked' | 'unchecked' | 'true' | 'false')" })
);

export type BooleanState = z.infer<typeof BooleanStateSchema>;

// Encapsulated Parameters Schema
export const StepParamsSchema = z
  .object({
    subIntent: SubIntentSchema.describe("Widget or operation specific sub-intent verb").optional(),
    value: z
      .union([ScalarSchema, z.array(ScalarSchema)])
      .describe("Input text, key name, boolean flag, array of choices, or expected assertion value(s)")
      .optional(),
    anchorText: z.string().optional(),
    column: z.string().optional(),
    targetColumn: z.string().optional(),
    childWidget: z.string().optional(),
    handler: z.string().optional(),
    timeout: z.number().optional(),
    force: z.boolean().optional(),
    waitForNetwork: z.boolean().optional(),
    storeAs: z.string().optional(),
    reason: z.string().optional(),
    description: z.string().optional(),
    missingCapability: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.subIntent === 'state' && data.value !== undefined) {
        const valStr = String(data.value).toLowerCase();
        return (STATE_VALUES as readonly string[]).includes(valStr);
      }
      return true;
    },
    {
      message: `Invalid state value for subIntent 'state'. Allowed values are: ${STATE_VALUES.join(', ')}`,
      path: ['value'],
    }
  )
  .refine(
    (data) => {
      if (data.handler === 'switchTab' && data.value !== undefined) {
        return data.value === 'main' || data.value === 'new';
      }
      return true;
    },
    {
      message: "[IntentFlow Schema] handler 'switchTab' only accepts value: 'main' | 'new'.",
      path: ['value'],
    }
  );

export const CheckboxStateParamsSchema = StepParamsSchema.extend({
  targetState: BooleanStateSchema.default(true),
});
export type CheckboxStateParams = z.infer<typeof CheckboxStateParamsSchema>;

// 1. Standard Step Definition
export const StandardStepSchema = z.object({
  step: z.string().optional(),
  fieldKey: z.string({ message: "'fieldKey' is required for standard steps" }),
  widgetType: z.enum([
    "WEB_TABLE", 
    "TEXTBOX", 
    "BUTTON", 
    "DROPDOWN", 
    "CHECKBOX", 
    "RADIO_GROUP", 
    "SELECT", 
    "CUSTOM_SELECT", 
    "CONTAINER", 
    "CARD"
  ]).optional(),
  intent: IntentSchema,
  params: StepParamsSchema.optional(),
}).refine(
  (data) => {
    if (data.widgetType === 'WEB_TABLE' && data.intent !== 'REQUIRES_SDET_HANDOFF' && data.params?.subIntent) {
      return (WEB_TABLE_SUB_INTENTS as readonly string[]).includes(data.params.subIntent);
    }
    return true;
  },
  {
    message: "[IntentFlow Guardrail] Unsupported subIntent for WEB_TABLE. Flag step for SDET handoff.",
    path: ['params', 'subIntent'],
  }
);

// 2. SDET Handoff Step Definition
export const SdetHandoffStepSchema = z.object({
  step: z.string().optional(),
  fieldKey: z.string({ message: "'fieldKey' is required for handoff step" }),
  intent: z.literal('REQUIRES_SDET_HANDOFF'),
  params: StepParamsSchema.optional(),
});

// 3. RefScenario Step Definition
export const RefScenarioStepSchema = z.object({
  step: z.string().optional(),
  refScenario: z.string({ message: "'refScenario' path key is required" }),
  data: z.record(z.string(), z.unknown()).optional().describe("Parameter forwarding variable map"),
});

// 4. RefProfile Precondition Item Schema (Rule 2.3 & Rule 2.5)
export const RefProfilePreconditionSchema = z.object({
  step: z.string().optional(),
  refProfile: z.string({ message: "'refProfile' key is required in preconditions" }),
  data: z.record(z.string(), z.unknown()).optional().describe("Local data overrides for referenced precondition profile"),
});

// Discriminated Polymorphic Pipeline Step Schema
export const PipelineStepSchema = z.union([
  StandardStepSchema, 
  SdetHandoffStepSchema,
  RefScenarioStepSchema,
  RefProfilePreconditionSchema // Restored for backwards compatibility during resolution
]);
export const IntentStepSchema = PipelineStepSchema;

// Scenario Contract
export const TestScenarioSchema = z.object({
  testName: z.string().optional(),
  description: z.string().optional(),
  steps: z.array(PipelineStepSchema),
});

/**
 * Path 2 Dynamic Profile Contract (Rule 2.2, 2.3, 2.5, 2.6)
 */
export const TestDataProfileSchema = z.object({
  description: z.string().optional(),
  preconditions: z.array(RefProfilePreconditionSchema).optional().describe("Top-level precondition profiles (Rule 2.5)"),
  refScenario: z.string().optional(),
  refProfile: z.string().optional().describe("Legacy profile reference for backward compatibility"),
  steps: z.array(PipelineStepSchema).optional().describe("Inline step sequence executed directly by single-use profile (Rule 2.2)"),
  data: z.record(z.string(), z.unknown()).optional(),
}).refine(
  (data) => Boolean((data.steps && data.steps.length > 0) || data.refScenario || data.refProfile),
  { message: "Path 2 Profile must define either an inline 'steps' array, 'refScenario', or 'refProfile'." }
);

// Root Suite Specification Contract
export const SuiteSpecSchema = z.object({
  page: z.string({ message: "'page' is required in suite header" }).optional(),
  description: z.string().optional(),
  uiMap: z.union([z.string(), z.array(z.string())]).describe("UI Map file path reference or registry key"),
  includes: z.array(z.string()).optional().describe("Parent YAML suite files for modular inheritance"),
  sharedScenarios: z.record(z.string(), z.union([z.array(PipelineStepSchema), TestScenarioSchema])).optional(),
  profiles: z.record(z.string(), TestDataProfileSchema).optional(),
});

export const VerifyIntentStepSchema = z.object({
  step: z.string().optional(),
  fieldKey: z.string({ message: "'fieldKey' is required for verify steps" }),
  intent: z.literal('verify'),
  params: StepParamsSchema.refine(
    (data) => {
      if (data?.subIntent === 'cellText') {
        const col = data.column || data.targetColumn;
        return Boolean(data.anchorText && col);
      }
      return true;
    },
    {
      message:
        "[IntentFlow Design Lock] Table subIntent 'cellText' requires both 'anchorText' (row key) and 'column' key."
    }
  ).optional()
});

// TypeScript Types
export type Intent = z.infer<typeof IntentSchema>;
export type SubIntent = z.infer<typeof SubIntentSchema>;
export type Scalar = z.infer<typeof ScalarSchema>;
export type StepParams = z.infer<typeof StepParamsSchema>;
export type StandardStep = z.infer<typeof StandardStepSchema>;
export type SdetHandoffStep = z.infer<typeof SdetHandoffStepSchema>;
export type RefScenarioStep = z.infer<typeof RefScenarioStepSchema>;
export type RefProfilePrecondition = z.infer<typeof RefProfilePreconditionSchema>;
export type RefProfileStep = RefProfilePrecondition; // Backwards compatibility alias
export type PipelineStep = z.infer<typeof PipelineStepSchema>;
export type IntentStep = PipelineStep;
export type TestScenario = z.infer<typeof TestScenarioSchema>;
export type TestDataProfile = z.infer<typeof TestDataProfileSchema>;
export type SuiteSpec = z.infer<typeof SuiteSpecSchema>;