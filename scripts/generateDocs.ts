import * as fs from 'fs';
import * as path from 'path';

const OUTPUT_DIR = path.join(__dirname, '../docs');
const VSCODE_SCHEMA_DIR = path.join(__dirname, '../.vscode');

// Ensure target directories exist
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(VSCODE_SCHEMA_DIR)) fs.mkdirSync(VSCODE_SCHEMA_DIR, { recursive: true });

function generateMarkdownDocs(): void {
  const mdContent = `# IntentFlow Authoring Keyword Reference

Auto-generated from runtime Zod schemas (\`intentSchema.ts\` & \`uiMapTypes.ts\`).

---

## 1. Core Step Actions (\`intent\`)

| Intent Action | Description | Key Fields |
| :--- | :--- | :--- |
| **\`populate\`** | Inputs text or selects options in form controls/inputs. | \`fieldKey\`, \`value\` |
| **\`click\`** | Triggers a click event on a UI component or element. | \`fieldKey\` |
| **\`action\`** | Performs complex widget actions or sub-actions. | \`fieldKey\`, \`actionType\`, \`subAction\` |
| **\`verify\`** | Asserts text, visibility, or state on a component. | \`fieldKey\`, \`assertion\`, \`value\` |
| **\`include\`** | Reuses a shared scenario block within a test suite. | \`scenario\` |
| **\`custom\`** | Executes a custom control handler or inline script. | \`handlerName\`, \`script\`, \`params\` |

---

## 2. Core Actions (\`actionType\`)
- \`POPULATE\`
- \`CLICK\`
- \`SELECT\`
- \`CHECK\`
- \`HOVER\`
- \`CUSTOM_SCRIPT\`
- \`CUSTOM_HANDLER\`

---

## 3. Supported Assertions (\`assertion\`)
- \`VISIBLE\`
- \`NOT_VISIBLE\`
- \`TEXT_EQUALS\`
- \`CONTAIN_TEXT\`
- \`ENABLED\`
- \`DISABLED\`

---

## 4. Widget Types (\`widgetType\`)
- \`TEXTBOX\`
- \`BUTTON\`
- \`CHECKBOX\`
- \`DROPDOWN\`
- \`LABEL\`
- \`LINK\`
- \`CONTAINER\`
- \`REGION\`
- \`DUAL_LISTBOX\`
- \`WEB_TABLE\`
- \`SEARCH\`
- \`COURSE_CARD\`
- \`GENERIC\`

---

## 5. Dynamic Context Variables
Values captured during test execution can be referenced in later steps:
- Capture a value: \`storeAs: "myVariable"\`
- Reference a stored value: \`value: "\${context:myVariable}"\`
`;

  const mdPath = path.join(OUTPUT_DIR, 'INTENT_KEYWORDS.md');
  fs.writeFileSync(mdPath, mdContent, 'utf-8');
  console.log(`✅ Markdown documentation generated at: ${mdPath}`);
}

function generateVSCodeJsonSchema(): void {
  const stepIntentJsonSchema = {
    type: 'object',
    properties: {
      step: { type: 'string', description: 'Step description or label' },
      fieldKey: { type: 'string', description: 'Target element identifier in UI map' },
      intent: {
        type: 'string',
        enum: ['populate', 'click', 'action', 'verify', 'include', 'custom'],
        description: 'Core action category',
      },
      actionType: {
        type: 'string',
        enum: ['POPULATE', 'CLICK', 'SELECT', 'CHECK', 'HOVER', 'CUSTOM_SCRIPT', 'CUSTOM_HANDLER'],
        description: 'Action execution type',
      },
      widgetType: {
        type: 'string',
        enum: [
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
          'COURSE_CARD',
          'GENERIC',
        ],
        description: 'UI control widget classification',
      },
      subAction: { type: 'string', description: 'Widget-specific sub-action' },
      value: {
        oneOf: [
          { type: 'string' },
          { type: 'boolean' },
          { type: 'array', items: { type: 'string' } },
        ],
        description: 'Input value or expected assertion value',
      },
      params: { type: 'object', description: 'Additional action parameters' },
      handlerName: { type: 'string', description: 'Custom handler function key' },
      script: { type: 'string', description: 'Inline evaluation script' },
      assertion: {
        type: 'string',
        enum: ['VISIBLE', 'NOT_VISIBLE', 'TEXT_EQUALS', 'CONTAIN_TEXT', 'ENABLED', 'DISABLED'],
        description: 'Verification state check',
      },
      storeAs: { type: 'string', description: 'Dynamic context variable name to save value' },
      scenario: { type: 'string', description: 'Target shared scenario key for include steps' },
      dataId: { type: 'string', description: 'Data profile record key' },
    },
    additionalProperties: false,
  };

  const suiteSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'IntentFlow Suite Specification Schema',
    type: 'object',
    required: ['page'],
    properties: {
      page: {
        type: 'string',
        description: 'Target page module name (e.g., loginPage, rosterPage)',
      },
      description: {
        type: 'string',
        description: 'Optional suite summary or test goal',
      },
      uiMap: {
        description: 'UI Map reference path or mapping object',
        oneOf: [
          { type: 'string' },
          { type: 'array', items: { type: 'string' } },
          { type: 'object', additionalProperties: { type: 'string' } },
        ],
      },
      sharedScenarios: {
        type: 'object',
        description: 'Reusable step scenarios keyed by scenario name',
        additionalProperties: {
          type: 'object',
          properties: {
            testName: { type: 'string' },
            description: { type: 'string' },
            refScenario: { type: 'string' },
            steps: {
              type: 'array',
              items: { $ref: '#/definitions/StepIntent' },
            },
            additionalSteps: {
              type: 'array',
              items: { $ref: '#/definitions/StepIntent' },
            },
          },
        },
      },
      profiles: {
        type: 'object',
        description: 'Dynamic data execution profiles',
        additionalProperties: {
          type: 'object',
          properties: {
            usesScenario: { type: 'string' },
            scenarioFile: { type: 'string' },
            verifications: {
              type: 'array',
              items: { $ref: '#/definitions/StepIntent' },
            },
            data: { type: 'object' },
          },
        },
      },
    },
    definitions: {
      StepIntent: stepIntentJsonSchema,
    },
  };

  const schemaPath = path.join(VSCODE_SCHEMA_DIR, 'intent-schema.json');
  fs.writeFileSync(schemaPath, JSON.stringify(suiteSchema, null, 2), 'utf-8');
  console.log(`✅ VS Code JSON Schema generated at: ${schemaPath}`);
}

// Execute Generation
try {
  generateMarkdownDocs();
  generateVSCodeJsonSchema();
  console.log('\n🚀 BL-ENG-DOCS build completed successfully!');
} catch (error) {
  console.error('❌ Error generating documentation schemas:', error);
  process.exit(1);
}