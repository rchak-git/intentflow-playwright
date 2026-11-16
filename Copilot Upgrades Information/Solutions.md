# IntentFlow Pilot: Solutions and Mitigations

Record each implemented mitigation here with its purpose, usage, limitations,
and possible extensions. Proposed extensions are not implemented unless
explicitly marked otherwise. The improvement backlog is in
[Suggestions.md](./Suggestions.md).

## 1. Static preflight validator

**Status:** Implemented as a standalone command and incorporated into the YAML
authoring instructions. It is not automatically run by the Playwright test
command.

### What it does

- Loads a YAML suite using the existing loader, including its merged includes.
- Checks one selected profile, or all merged profiles when none is selected.
- Follows the applicable profile steps, scenario references, and shallow
  preconditions in line with the current dispatcher.
- Reports missing UI map registrations, field keys, table columns, child
  selectors, profiles, and scenarios, plus selected unsupported operations
  and dynamically resolved keys that cannot be checked statically.
- Produces a JSON report. Findings, including unverified dynamic keys, result
  in a nonzero exit code; loader or schema errors also fail the command.

The report may contain `MISSING_UI_MAPS`, `MISSING_UI_MAP_ENTRIES`,
`MISSING_PROFILES`, `MISSING_SCENARIOS`, `UNSUPPORTED_OPERATIONS`, and
`UNVERIFIED` categories. A location identifies where the issue was found.

### How to use it

From the repository root in PowerShell:

```powershell
npx tsx src\cli\preflight.ts --suite tests\suites\pilot_moodle\pilotMoodleParticipantsSteps.yaml --profile td_pilotAdminVerifyCourseParticipants
```

An empty `issues` array means these static checks found no issue. Omit
`--profile` to inspect all profiles in the merged suite, including profiles
from included suites. To run the validator's focused tests:

```powershell
npm run preflight:test
```

For a negative check, use a temporary copy of a suite with an intentionally
incorrect `fieldKey`, then run preflight against that copy and its profile.
The report should contain `MISSING_UI_MAP_ENTRIES`. Do not modify a shared
suite merely to test the validator.

### Limitations

- This is a static check, not a browser run. It does not confirm that a
  locator exists or is unique on the live page, verify credentials or
  runtime-injected data, or validate every parameter and assertion.
- It follows the dispatcher's **shallow** precondition behavior. A referenced
  precondition's own preconditions are not automatically executed or checked
  as setup for the selected profile.
- It uses the dispatcher's effective map, including the global-map fallback,
  while flagging unregistered map names. Schema and include-loading errors
  can prevent the JSON report from being produced.
- A clean report does not mean that a Playwright test passed.

### Potential future uses

- **Preflight before Playwright:** Add an explicit test-runner wrapper or
  integration that identifies the suite and profile for each selected test,
  runs preflight first, and starts browser tests only when validation passes.
  Preserve a direct Playwright path or make enforcement configurable if
  required. This is a proposal, not current behavior.
- **CI checks:** Run preflight for selected suites and profiles before
  browser jobs, publishing the compact report on failure.
- **Agent authoring:** Continue using the report to identify missing
  prerequisites and operations before generating or running profiles.
- **Broader analysis:** Investigate additional data-token, store-token, and
  runtime capability checks without exposing secrets.

The YAML Suite Inspector is separate: it provides an interactive preview and
editor, not this static preflight validation. Its recursive preview can differ
from the runner's shallow precondition execution.

### Related implementation

- [Preflight command](../src/cli/preflight.ts)
- [Preflight checks](../src/engine/preflight.ts)
- [Focused tests](../src/engine/preflight.test.ts)
- [YAML authoring instructions](../prompts/CopilotPrompts/intentflowYamlAuthorInstructions.md)
