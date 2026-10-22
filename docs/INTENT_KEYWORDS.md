# IntentFlow Authoring Keyword Reference

Auto-generated from runtime Zod schemas (`intentSchema.ts` & `uiMapTypes.ts`).

---

## 1. Core Step Actions (`intent`)

| Intent Action | Description | Key Fields |
| :--- | :--- | :--- |
| **`populate`** | Inputs text or selects options in form controls/inputs. | `fieldKey`, `value` |
| **`click`** | Triggers a click event on a UI component or element. | `fieldKey` |
| **`action`** | Performs complex widget actions or sub-actions. | `fieldKey`, `actionType`, `subAction` |
| **`verify`** | Asserts text, visibility, or state on a component. | `fieldKey`, `assertion`, `value` |
| **`include`** | Reuses a shared scenario block within a test suite. | `scenario` |
| **`custom`** | Executes a custom control handler or inline script. | `handlerName`, `script`, `params` |

---

## 2. Core Actions (`actionType`)
- `POPULATE`
- `CLICK`
- `SELECT`
- `CHECK`
- `HOVER`
- `CUSTOM_SCRIPT`
- `CUSTOM_HANDLER`

---

## 3. Supported Assertions (`assertion`)
- `VISIBLE`
- `NOT_VISIBLE`
- `TEXT_EQUALS`
- `CONTAIN_TEXT`
- `ENABLED`
- `DISABLED`

---

## 4. Widget Types (`widgetType`)
- `TEXTBOX`
- `BUTTON`
- `CHECKBOX`
- `DROPDOWN`
- `LABEL`
- `LINK`
- `CONTAINER`
- `REGION`
- `DUAL_LISTBOX`
- `WEB_TABLE`
- `SEARCH`
- `COURSE_CARD`
- `GENERIC`

---

## 5. Dynamic Context Variables
Values captured during test execution can be referenced in later steps:
- Capture a value: `storeAs: "myVariable"`
- Reference a stored value: `value: "${context:myVariable}"`
