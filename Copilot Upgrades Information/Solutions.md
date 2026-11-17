# IntentFlow Pilot: Solutions and Mitigations

Record each implemented mitigation here with its purpose, usage, limitations,
and possible extensions. Proposed extensions are not implemented unless
explicitly marked otherwise. The improvement backlog is in
[Suggestions.md](./Suggestions.md).

## 1. Static preflight validator

**Status:** Implemented as a standalone command and as an automatic gate for
`CommandDispatcher.executeProfile`. The gate runs before profile browser steps,
although a Playwright page fixture may already have launched a browser.

### What it does

- Loads a YAML suite using the existing loader, including its merged includes.
- Checks one selected profile, or all merged profiles when none is selected.
- Follows the applicable profile steps, scenario references, and recursive
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

The dispatcher gates `executeProfile` by default. Deliberate negative or
handoff tests can opt out with
`CommandDispatcher.fromSuite(suite, { skipPreflight: true })`; a warning is
emitted, and unknown maps and missing preconditions still fail. Lower-level
direct calls to `executeScenario` or `executeStep` do not invoke the gate.

### Limitations

- This is a static check, not a browser run. It does not confirm that a
  locator exists or is unique on the live page, verify credentials or
  runtime-injected data, or validate every parameter and assertion.
- Preconditions are recursive, with deduplication and data/override
  propagation. Scenario profile references follow the loader's separate
  resolution behavior.
- It uses the dispatcher's effective map, including the global-map fallback,
  while flagging unregistered map names. Schema and include-loading errors
  can prevent the JSON report from being produced.
- A clean report does not mean that a Playwright test passed.

### Potential future uses

- **Preflight before browser launch:** Add an explicit test-runner wrapper or
  integration that identifies the suite and profile before a Playwright page
  fixture launches the browser. This is a proposal, not current behavior.
- **CI checks:** Run preflight for selected suites and profiles before
  browser jobs, publishing the compact report on failure.
- **Agent authoring:** Continue using the report to identify missing
  prerequisites and operations before generating or running profiles.
- **Broader analysis:** Investigate additional data-token, store-token, and
  runtime capability checks without exposing secrets.

The YAML Suite Inspector is separate: it provides an interactive preview and
editor, not this static preflight validation. Its recursive preview can differ
from the runner's deduplication, overrides, and reference resolution.

### Related implementation

- [Preflight command](../src/cli/preflight.ts)
- [Preflight checks](../src/engine/preflight.ts)
- [Focused tests](../src/engine/preflight.test.ts)
- [YAML authoring instructions](../prompts/CopilotPrompts/intentflowYamlAuthorInstructions.md)

## 2. Local test data and environment setup

### What it does

Playwright reads the repository-root `.env` automatically. `INTENTFLOW_ENV`
selects `QA` or `UAT`, and `INTENTFLOW_BROWSER` selects installed `chrome` or
`edge`. The Playwright project remains named `chromium`. The pilot and
recursive Moodle specs select credentials by scenario-compatible login ID.
Non-secret scenario data remains in YAML.

The local `.env` is ignored by Git and is not included in clones. If it is
missing, create it locally; never commit credentials. For example:

```env
INTENTFLOW_ENV=QA
INTENTFLOW_BROWSER=chrome
INTENTFLOW_LOGIN_PROFILE=

QA_BASE_URL=https://sandbox.moodledemo.net
QA_STUDENT_USERNAME=
QA_STUDENT_PASSWORD=
QA_STUDENT_INVALID_PASSWORD=
QA_ADMIN_USERNAME=
QA_ADMIN_PASSWORD=

UAT_BASE_URL=
UAT_STUDENT_USERNAME=
UAT_STUDENT_PASSWORD=
UAT_STUDENT_INVALID_PASSWORD=
UAT_ADMIN_USERNAME=
UAT_ADMIN_PASSWORD=
```

Fill in the URL and account values locally. The invalid-password key is only
needed for the negative login test. For a new account ID, add keys such as
`QA_EDUCATOR_USERNAME` and `QA_EDUCATOR_PASSWORD`; the relevant spec must
explicitly allow that ID and map it to the correct login profile.

### How to use it

1. Edit the local `.env`; choose QA or UAT and fill in that environment's
   base URL and required account credentials. Choose `chrome` or `edge`;
   the selected browser must be installed.
2. Leave `INTENTFLOW_LOGIN_PROFILE` empty to use each scenario's default
   account. The application-level logout scenario also permits `admin`;
   other pilot scenarios currently require their declared student or admin
   account. An incompatible override fails explicitly.
3. Run a test from the repository root, for example:

   ```powershell
   npx playwright test recursiveParticipants.spec.ts --project=chromium --workers=1
   ```

Process environment variables take precedence over `.env`. For a temporary
selection in PowerShell, set `$env:INTENTFLOW_ENV = 'UAT'` or
`$env:INTENTFLOW_BROWSER = 'edge'` before running the test. Remove an override
with `Remove-Item Env:\INTENTFLOW_ENV` or the corresponding variable name to
use `.env` again. To run the application-level logout using admin credentials,
set `INTENTFLOW_LOGIN_PROFILE=admin`, run `AppLevelTests.spec.ts`, and clear
the override afterward. Do not put credential values in commands or chat.

Verify the configuration without real credentials:

```powershell
npx tsx --test src\config\runtimeConfig.test.ts
npx playwright test runtimeConfig.spec.ts --project=chromium --workers=1
```

### Limitations and future uses

- The `.env` login helper is integrated into the pilot and recursive Moodle
  specs, not automatically into every suite or the standalone `reachPage`
  helper. Other specs must call `resolveLoginData` and explicitly allow IDs.
- Absolute URLs in YAML remain absolute and bypass Playwright's `baseURL`.
  Existing URL and content assertions may also be specific to Moodle.
- Without `INTENTFLOW_ENV`, the previous Moodle base URL and legacy
  `MOODLE_*` credential variables remain available. Once QA or UAT is
  selected, only that environment's credentials are used.
- Configuration checks do not verify credentials, account roles, course
  enrollment, or the live application. The existing admin login assertion
  does not independently verify admin identity.
- Traces, screenshots, videos, and reports may contain sensitive data. Protect
  or disable these artifacts according to local security policy.
- CI can supply the same variables from its secrets manager instead of `.env`.

## 3. Rich-text plain-text support

`RICH_TEXT` supports replacing, clearing, verifying, and extracting plain text
from a mapped `contenteditable` element, including one in an iframe. See the
[DSL specification](../docs/intentflow-dsl-spec.md) for usage and limitations.
Formatting and toolbar operations are not implemented.

Controlled browser tests cover inline and iframe editors. A Moodle profile
editor was verified read-only in an iframe; writing and saving on Moodle have
not been tested. Angular and React applications have not been tested.

```powershell
npx playwright test richText.spec.ts --project=chromium --workers=1
npm run preflight:test
npx tsc --noEmit
```
