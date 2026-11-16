# IntentFlow Pilot: Suggestions and Priorities

This is the running list of framework and workflow improvements discussed for
the pilot. Add new suggestions here as they are agreed. Record implemented
mitigations and their usage in [Solutions.md](./Solutions.md).

## Suggested priority

1. Strict validation.-> Status : A precise label would be: “Standalone preflight implemented; automatic enforcement pending.”
2. Easier test-data setup.
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

- **Pain point:** Missing precondition profiles can be skipped, unknown map
  names can fall back to the global map, and preconditions execute shallowly.
  Some unsupported operations can fall back to a different behavior.
- **Suggested mitigation:** Add strict preflight validation that reports
  problems before browser execution.
- **Status:** A standalone static preflight validator is implemented; see
  [Solutions.md](./Solutions.md#1-static-preflight-validator). Automatic
  enforcement before every test and complete validation remain future work.

## 3. Test data and setup

- **Pain point:** Credentials require manual environment setup. The Moodle
  demo can reset, and account enrollment or language can affect test results.
- **Suggested mitigation:** Provide a simple local setup command and check the
  required accounts, courses, and language before tests run.
- **Status:** Proposed. Keep credentials out of YAML, source files, command
  logs, and reports.

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