# IntentFlow DSL Specification v1.0

## 1. Architectural Philosophy

`IntentFlow` is a declarative, polymorphic, and standardized domain-specific language (DSL) engineered to minimize cognitive load for non-technical QA authors and guarantee clean, deterministic AI artifact generation.

The framework enforces strict separation between test specification (YAML) and browser execution (TypeScript engine) using **top-level intent polymorphism**:

1. **Top-Level Polymorphism**: The `CommandDispatcher` routes execution strictly via four primary canonical verbs (`action`, `populate`, `verify`, and `custom`). It contains zero specialized widget branches.
2. **Delegated Sub-Intents**: Control handlers (`ActionControl`, `PopulateControl`, `VerifyControl`) inspect optional `subIntent` directives within `params` to resolve control-specific behaviors.
3. **Canonical 4-Key Contract**: Every step definition strictly obeys a uniform 4-key structure:
   $$\text{Step} = \{\text{step}, \text{fieldKey}, \text{intent}, \text{params}\}$$

---

## 2. Canonical Step Anatomy

Every step definition MUST adhere to the following schema contract:

```yaml
- step: "Human-readable step description"
  fieldKey: "elementUiMapKey"
  intent: action | populate | verify | custom
  params:
    subIntent: "optionalSpecializedBehavior"
    value: "scalarDataInputOrExpectedValue"
    anchorText: "optionalContainerAnchor"
    targetColumn: "optionalColumnOrRegion"
    childWidget: "optionalScopedChildKey"

    Core Field Definitions
step (string, required): Sentence explaining the business intent of the step.

fieldKey (string, required): Unique identifier referencing an entry in the page-scoped UI Map. For page-level assertions or multi-tab operations, use "page".

intent (string, required): Primary routing verb. Allowed values: action, populate, verify, custom.

params (object, optional): Encapsulated payload containing all dynamic data inputs, sub-intent directives, assertions, or multi-coordinate container locators.

3. High-Level Intents & Universal Sub-Intent Vocabulary
The framework restricts its sub-intent vocabulary to fewer than 10 reusable terms across all controls:

Sub-Intent Keyword	Applicable Controls	Description / Behavior	Primary params Keys
setValue (Default)	TEXTBOX, TEXTAREA	Clears field and types new value.	value
click (Default)	BUTTON, LINK, CHECKBOX	Performs standard click gesture.	—
select	SELECT, RADIO, DUAL_LISTBOX, TAB	Selects an option by value or visible text.	value
remove	DUAL_LISTBOX, TAG_INPUT	Deselects or removes an item.	value
toggle	CHECKBOX, TOGGLE_SWITCH	Flips current state regardless of value.	—
append	TEXTBOX, TEXTAREA	Appends text without clearing existing value.	value
clear	TEXTBOX, FILE_UPLOAD	Resets input state.	—
pressKey	TEXTBOX, GLOBAL_PAGE	Triggers key event (e.g., Enter, Tab).	value
hover / dblClick	BUTTON, LINK, ROW	Advanced mouse cursor gestures.	—
equals / contains	ALL (under intent: verify)	Exact or partial string/value assertion.	value
state	ALL (under intent: verify)	Evaluates element state (visible, hidden, enabled, disabled).	value
4. Control Type Specifications & Canonical Examples
A. Primitive Controls
1. Textbox & Textarea (TEXTBOX, TEXTAREA)
YAML
# Standard Populate (subIntent defaults to setValue)
- step: "Enter student username"
  fieldKey: moodle_login_usernameTextbox
  intent: populate
  params:
    value: "student"

# Append Text
- step: "Append tag to course description"
  fieldKey: moodle_course_tagsTextbox
  intent: populate
  params:
    subIntent: append
    value: ", 2026-Fall"

# Press Key Action
- step: "Press Enter in search box"
  fieldKey: moodle_homepage_searchInputTextbox
  intent: action
  params:
    subIntent: pressKey
    value: "Enter"

# Value Assertion
- step: "Verify email address value"
  fieldKey: moodle_profile_emailTextbox
  intent: verify
  params:
    subIntent: equals
    value: "student@moodle.org"
2. Checkbox & Radio Button (CHECKBOX, RADIO)
YAML
# Set Checkbox State
- step: "Check 'Remember username' option"
  fieldKey: moodle_login_rememberUsernameCheckbox
  intent: populate
  params:
    value: true

# Select Radio Option
- step: "Select 'Teacher' account type"
  fieldKey: moodle_signup_accountTypeRadioGroup
  intent: populate
  params:
    subIntent: select
    value: "teacher"

# Verify State
- step: "Verify 'Remember username' checkbox is visible"
  fieldKey: moodle_login_rememberUsernameCheckbox
  intent: verify
  params:
    subIntent: state
    value: visible
3. Select & Dropdown (SELECT, DROPDOWN)
YAML
# Select Option
- step: "Select English from language dropdown"
  fieldKey: moodle_homepage_languageSelect
  intent: populate
  params:
    subIntent: select
    value: "English (en)"

# Verify Selected Option
- step: "Verify default course view format"
  fieldKey: moodle_course_formatSelect
  intent: verify
  params:
    subIntent: equals
    value: "Weekly format"
B. Composite & Container Controls (TABLE, CARD, LIST, ACCORDION)
Composite controls resolve sub-elements dynamically using universal container coordinate parameters inside params:

anchorText: Primary text used to locate the container, row, card, or panel.

targetColumn: Column header or region within the matched container.

childWidget: Scoped element inside the container to receive the action/verification.

YAML
# Dynamic Table Interaction
- step: "Click Edit link for Section 2 in Course Table"
  fieldKey: moodle_courseSectionsTable
  intent: action
  params:
    anchorText: "Section 2"
    targetColumn: "Actions"
    childWidget: "editLink"

# Dynamic Table Cell Verification
- step: "Verify Quiz 1 score in Gradebook"
  fieldKey: moodle_gradebookTable
  intent: verify
  params:
    subIntent: equals
    anchorText: "Quiz 1"
    targetColumn: "Grade"
    value: "95.00 %"

# Card Grid Interaction
- step: "Click Resume button on Biology 101 course card"
  fieldKey: moodle_courseCardsGrid
  intent: action
  params:
    anchorText: "Biology 101"
    childWidget: "resumeCourseBtn"
C. The Custom Escape Hatch (intent: custom)
When an extraordinary widget (Canvas, Shadow-DOM, Drag-and-Drop) cannot be handled natively, authors trigger registered custom SDET handlers:

YAML
- step: "Reorder course modules using custom gesture"
  fieldKey: moodle_courseSection
  intent: custom
  params:
    handler: "handleMoodleDragAndDrop"
    sourceItem: "Assignment 1"
    targetSection: "Section 2"
5. Modularization & Scenario Scoping (refScenario)
Shared scenarios are referenced directly at the step level:

External Reference: refScenario: fileName.scenarioName (dot-notation)

Local Reference: refScenario: scenarioName (plain string)

YAML
page: moodleHomepage
uiMap: moodleHomepageUiMap

sharedScenarios:
  navigateToGrades:
    - step: "Open User Menu"
      fieldKey: moodle_homepage_userMenuButton
      intent: action

    - step: "Click Grades Link"
      fieldKey: moodle_homepage_gradesLink
      intent: action

tests:
  - name: "Verify Gradebook Navigation"
    steps:
      - refScenario: authScenarios.moodleLogin  # External reference
      - refScenario: navigateToGrades            # Local reference


      ## 4. Modular Scenario Composition & Parameter Forwarding

### 4.1 Two-Tier Composition Standard
To maximize scenario reusability without engine-level complexity, suites must follow a two-tier composition architecture:
1. **Atomic Sub-Scenarios**: Single-responsibility step blocks (e.g., `navigateToLogin`, `fillLoginFormFields`) that declare variable placeholders (e.g., `${data:username}`).
2. **Composite Scenarios**: High-level test flows that combine atomic sub-scenarios via `refScenario` and explicitly forward parameters using inline `data` mappings.

### 4.2 Explicit Data Forwarding Contract
When a composite scenario steps through a sub-scenario that requires profile parameters, the composite scenario MUST explicitly map those parameters under the `refScenario` block:

```yaml
sharedScenarios:
  fillLoginFormFields:
    steps:
      - step: "Enter username"
        fieldKey: "moodle_login_usernameTextbox"
        intent: "populate"
        params:
          value: "${data:username}"

  successfulLoginWithValidStudentCredentials:
    steps:
      - refScenario: "fillLoginFormFields"
        data:
          username: "${data:username}"
          password: "${data:password}"


Markdown
## 4. Pipeline Step Referencing & Data Inheritance Specification

IntentFlow supports two mechanisms for step reuse across intra-page and cross-page scenario pipelines: `refScenario` and `refProfile`.

### 4.1 Decision Rules & Usage Standard

1. **Intra-Page Reuse (Same Domain / File)**
   - Use `refScenario` to compose lower-level UI steps (e.g., `navigateToLogin` -> `fillLoginFormFields`) into higher-level logical scenarios within the same file.

2. **Cross-Page Pre-conditions (Upstream Dependencies)**
   - **`refProfile` (Standard Flow - 90% of cases)**: Use when an upstream pre-condition relies on standard default datasets (e.g., canonical student login). Eliminates redundant data declarations in the host file.
   - **`refScenario` (Custom Payload Flow - 10% of cases)**: Use when executing an upstream UI step sequence using custom, one-off test data unique to the calling scenario (e.g., testing locked-out user credentials).

### 4.2 Data Inheritance & Precedence
When resolving step datasets during pipeline execution:
1. **Base Dataset**: Derived from the target `refProfile`'s `data` block (if `refProfile` is used).
2. **Local Override**: Any `data:` block attached directly to the step merges over the base dataset, overriding matching keys.

---

### 4.3 Structural YAML Examples

#### Standard Upstream Dependency (`refProfile`)
```yaml
includes:
  - "./moodleLogin.yaml"

sharedScenarios:
  authenticatedUserLogsOutViaUserMenu:
    # Harnesses complete upstream login UI flow + default student credentials
    - refProfile: "validStudentLoginProfile" 
    - fieldKey: "moodle_hmpage_userMenuDropdown"
      intent: "action"
      params:
        subIntent: "click"
Custom Payload Upstream Dependency (refScenario)
YAML
includes:
  - "./moodleLogin.yaml"

sharedScenarios:
  lockedOutUserAttemptsLogin:
    # Reuses login UI sequence, but overrides credentials locally
    - refScenario: "successfulLoginWithValidStudentCredentials"
      data:
        username: "locked_out_student"
        password: "invalidPassword123"

---

