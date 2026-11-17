# IntentFlow Pilot: Suggestions and Priorities

This is the running list of framework and workflow improvements discussed for
the pilot. Add new suggestions here as they are agreed. Record implemented
mitigations and their usage in [Solutions.md](./Solutions.md).

## Suggested priority

**High-priority TODO:** Add a shared runner for simple YAML-based test methods
as described in [section 8](#8-simple-yaml-test-runner).

**Next exercise:** Student assignment submission; see
[section 9](#9-representative-lms-pilot-exercises).

1. Strict validation: Status : Done
2. Easier test-data setup: Status: Done
3. Stronger identity and assertion checks.
4. UI Map ownership and reuse.

## 1. Scenario ambiguity

- **Pain point:** Conflicting account roles, control types, or steps require
  clarification before a reliable test can be generated.
- **Suggested mitigation:** Have the agent review scenarios and flag
  contradictions before generating tests. Supply the account, starting page,
  navigation, and expected results up front.
- **Status:** The YAML authoring instructions already require identifying
  scenario requirements and reporting blockers. Further automated
  contradiction detection is a potential improvement.

## 2. Hidden execution behavior

- **Pain point:** Missing precondition profiles and unknown map names previously
  fell back or were skipped. Some unsupported operations can fall back to a
  different behavior.
- **Suggested mitigation:** Add strict preflight validation that reports
  problems before browser execution.
- **Status:** Selected-profile preflight now runs automatically before
  dispatcher browser steps; missing maps and preconditions also fail explicitly.
  Complete validation and pre-browser-launch enforcement remain future work;
  see [Solutions.md](./Solutions.md#1-static-preflight-validator).

## 3. Test data and setup

- **Pain point:** Credentials require manual environment setup. The Moodle
  demo can reset, and account enrollment or language can affect test results.
- **Suggested mitigation:** Provide a simple local setup command and check the
  required accounts, courses, and language before tests run.
- **Status:** Local `.env` configuration and guarded pilot login IDs are
  implemented; see [Solutions.md](./Solutions.md#2-local-test-data-and-environment-setup).
  Account availability, course enrollment, and language checks remain manual.

## 4. Assertion confidence

- **Pain point:** A successful landing-page check does not independently prove
  that the authenticated account has the admin role.
- **Suggested mitigation:** Add explicit identity or role checks and support
  optional negative assertion tests.
- **Status:** Proposed. The existing admin login profile does not independently
  verify the admin role. Negative assertion tests should be isolated and run
  only when requested.

## 5. Maintenance and reuse

- **Pain point:** Pilot and older Moodle UI Maps overlap, making reuse and
  ownership choices unclear.
- **Suggested mitigation:** Establish reusable application-level controls and
  clear ownership for page-specific maps. Reuse verified maps and profiles
  instead of rediscovering them for every scenario.
- **Status:** Application-level controls and a consolidated Moodle map already
  exist; ownership rules and overlap cleanup are further work.

## 6. Token cost and authoring workflow

- **Observation:** The pilot was assessed as medium to high relative effort
  because of repeated framework inspection, browser snapshots, clarifications,
  and retries. This was not a measured token count.
- **Suggestions:**
  - Use the compact preflight report to focus investigation on actual issues.
  - Reuse verified UI Maps and profiles.
  - Provide complete scenarios and prerequisites at the start.
  - Inspect only relevant page sections and keep successful output concise;
    retain full errors when tests fail.
  - Use a fresh chat for each feature with a short framework and prerequisite
    summary.
  - Measure comparable tasks using available provider usage reports, including
    cached input and output tokens where reported.
- **Status:** Workflow guidance; actual savings require measurement. Initial
  framework and agent setup may cost more than subsequent reuse.

## 7. Additional LMS control capabilities

The framework already has textboxes, buttons, checkboxes, radio groups, native
and custom selects, search, tables, cards, containers, and single-file upload.
Prioritize the following additions one at a time:

1. **Rich-text editing:** Plain-text entry, clearing, and verification are
   implemented; formatting and toolbar operations remain proposed.
2. **File download:** Download and verify a course resource.
3. **Multi-select:** Select multiple learners, groups, or tags.
4. **Date/time picker:** Set and verify an assignment due date.
5. **Drag and drop:** Reorder activities or answer matching questions.
6. **Dialogs and browser alerts:** Confirm actions or handle browser prompts.
7. **Media player:** Verify audio or video playback state.
8. **Tree navigation:** Expand course or folder hierarchies.

- **Status:** Other capabilities are proposed. Rich-text editing is tested
  locally; a Moodle iframe was checked read-only, not edited or saved.
- **Approach:** Prefer browser-visible HTML and accessibility semantics over
  PHP-, Angular-, or React-specific behavior. Reuse existing controls or add
  operations where appropriate rather than introducing a new type for every
  interaction. Validate each capability with focused controlled tests and a
  real Moodle example when available; also check Angular or React examples
  where available.

## 8. Simple YAML test runner

- **Priority:** High. **Status:** Proposed; not yet implemented.
- **Goal:** Keep Playwright test methods simple so manual testers can focus on
  YAML scenarios rather than credential wiring or framework code.
- **Proposed authoring pattern:**

  ```ts
  test('Student enters and clears the profile description', async ({ page }) => {
    await runIntentFlow(page, {
      suite: 'moodleEditProfileSteps.yaml',
      profile: 'td_studentEnterAndClearDescription',
    });
  });
  ```

- **Framework work:** Define unambiguous suite path resolution; load and
  preflight the selected profile; resolve the appropriate locally configured
  credentials securely and pass them through prerequisite profiles; and
  preserve explicitly configured scenario-specific safety checks. Missing
  configuration or unsupported checks must fail clearly, without logging
  credentials. The example is a proposed API, not executable today.
- **Scope:** First implement the shared runner and verify existing behavior.
  Automatic discovery of YAML profiles is a separate potential improvement.

## 9. Representative LMS pilot exercises

Use real workflows to identify missing controls and framework capabilities,
rather than implementing controls solely from a proposed list. Complete one
exercise at a time:

1. **Student assignment submission** — next exercise, planned for tomorrow.
   Identify a suitable Moodle assignment and verify the student's access,
   submission requirements, expected result, and safe test-data cleanup before
   submitting. Reuse existing login, maps, profiles, and controls where suitable.
2. **Student quiz** — exercise a representative quiz workflow and report gaps.
3. **Educator grading** — exercise reviewing and grading a test submission,
   including the appropriate account and permissions.

For each exercise, start with a scenario and inspect the live application.
Record missing or unsupported capabilities as an SDET handoff, implement only
what the scenario needs, and verify the result and any cleanup. Use only
dedicated test data; do not overwrite or delete existing user work. Moodle's
shared sandbox may reset, so availability must be checked at exercise time.

## Pilot execution note

The participants test's final browser run was interrupted during the pilot;
it was not verified as passed at that time. A clean static preflight report
does not change that result.


Implementation Plan ideas :
(1) AI self healing : SELF-HEALING PILOT — PROPOSED PLAN

1. Limit the pilot
   - Start with simple, non-destructive controls on a controlled test page.
   - Make healing opt-in; existing tests behave as before by default.

2. Define approved alternatives
   - Record reviewed alternate locators alongside the original locator.
   - Keep the UI Map unchanged during test execution.
   - A unique match alone is not proof that it is the intended control.

3. Detect eligible failures
   - Try the original locator first.
   - Consider an alternative only when the original cannot locate its element.
   - Do not heal unrelated assertion, navigation, or application failures.

4. Validate the alternative on the live page
   - Check the expected control type, context, and frame.
   - Require exactly one suitable match before performing an action.
   - If the candidate is missing, ambiguous, or uncertain, fail normally.

5. Continue safely
   - Use the verified, approved alternative for the eligible action.
   - Do not repeat an action that may already have occurred.
   - Do not automatically heal destructive actions in this pilot.

6. Report healing
   - Include the field key, original locator, alternative used, and reason.
   - Show: “Alternate locator used; UI Map locator needs review.”
   - Make a healed pass distinguishable from an ordinary pass in the report.
   - Never report secrets or automatically modify the UI Map.

7. Test edge cases
   - Original locator works: no healing or warning.
   - One approved alternative works: continue and warn.
   - Zero or multiple matches: fail.
   - Candidate matches the wrong control type or frame: fail.
   - Element appears late or changes during validation: avoid unsafe action.
   - Action may already have occurred: do not retry it.
   - A later assertion fails: report both the healing and the failure.

8. Review pilot results
   - Confirm warnings are visible and alternatives identify intended controls.
   - Review false positives, maintenance effort, and privacy.
   - Decide separately whether to expand beyond the pilot.