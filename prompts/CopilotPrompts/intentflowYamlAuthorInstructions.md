# IntentFlow YAML Generator

Turn supplied Gherkin, user stories, or manual test steps into IntentFlow Path 2 YAML suites and matching Playwright spec methods. Treat the live workspace as authoritative. These instructions are shared across coding agents; do not modify the YAML editor.

## Discover Before Generating

1. Read `src/types/intentSchema.ts`, `src/types/uiMapTypes.ts`, `src/registries/UiMapIndex.ts`, the target UI Maps, `src/engine/yamlLoader.ts`, and `src/engine/commandDispatcher.ts`.
2. Read the relevant control implementations in `src/controls/`, existing suite YAML files under `tests/suites/`, and related specs under `tests/specs/`. Inspect actual behavior, not just names, comments, schema enums, or the older `YamlAgentMakerPrompt.txt`.
3. Identify each scenario's actions, precise assertions, test data, target suite, required setup, and candidate existing profiles and UI Map keys. Preserve scenario intent and values; do not replace a specific assertion with a broader one.
4. Search the relevant includes and parent suites for existing setup profiles. Check registry keys against `UI_MAP_REGISTRY`, not just TypeScript export names. A matching name is insufficient if the profile or map does not actually perform the required action.

The YAML editor is an optional inspection tool, not an execution oracle. Rely on `src/engine/commandDispatcher.ts` (which resolves preconditions recursively with deduplication, data bubbling, and profile overrides) and `src/cli/preflight.ts` as the execution oracle. Do not edit the editor.

## Preflight and Blockers

Run `npx tsx src/cli/preflight.ts --suite <suite-path> --profile <profile-name>` against existing or newly authored suites. Omit `--profile` to inspect all merged profiles. The JSON report lists map, profile, scenario, and operation issues; a nonzero exit means findings or a loading error. The check is static: it cannot verify live controls, credentials, runtime-injected data, or every parameter and assertion. Resolve its findings, and still perform the manual checks below.

Before writing executable profiles, check:

- Every non-page target has an unambiguous, existing UI Map entry, and its requested operation is actually supported by the relevant control and schema. Verify table column keys, composite child selectors, and exact data types where used. A map entry alone does not prove a control is currently present on a live site.
- Every prerequisite profile and scenario reference exists and is merged through the includes that the runtime actually loads. Verify recursive precondition chains (ensuring no circular cycles), inherited data/override scopes, nested-scenario limits, duplicate profile/scenario names, and precedence. Do not rely on the dispatcher's warning-and-continue behavior for missing profiles or map keys.
- Every data token has a supported source and every store token is produced earlier on the actual execution path. Do not assume YAML automatically loads environment variables.
- Every expected assertion is truly implemented for the target widget and has the intended scope. In particular, page `contains` checks body text, not specifically a heading. A schema enum is not proof of implemented behavior: some unsupported operations may fall back to another action or assertion. Do not emit such operations as if supported.
- Explicit `widgetType` in a step is optional and its allowed values/refinements may differ from UI Map widget types. Do not bypass a schema restriction by silently changing the requested behavior.

For missing or ambiguous controls, report `MISSING_UI_MAP_ENTRIES` with scenario, step, proposed field key and widget type, and explain whether the control is missing from the map or was observed missing on the page. A suggested key is not an implemented locator. Do not change UI Maps unless separately requested.

For missing capabilities, report `UNSUPPORTED_OPERATIONS` with scenario, step, requested behavior, and the evidence or reason. Reuse an existing control and sub-intent when they implement the requested behavior; a missing UI Map entry alone is not a missing control type. Propose a new control type only when existing types cannot appropriately support the operation. Do not generate a weaker assertion, a fabricated custom handler, or a passing test in its place.

Require SDET approval before introducing a new control type or sub-intent keyword. An existing control may be extended under a semantically suitable existing keyword without separate approval: first run a focused baseline test of current behavior, then rerun it and a focused test for the new behavior after the change. Surface a failing or unavailable baseline and do not claim compatibility without evidence. Do not repurpose an unrelated keyword.

When YAML cannot express a required behavior, suggest options to the SDET: scenario-specific spec code, a reusable helper, an existing or new control operation or keyword, or a custom handler. Compare likely reuse, readability, implementation and maintenance cost, and safety. One-off orchestration may remain in the spec; consider a shared capability for genuinely reusable behavior, but do not add a keyword solely for anticipated reuse when an existing keyword fits. A verified spec-level implementation may run if it preserves the requested behavior and safety; do not emit an unsupported YAML step.

Use a custom handler in YAML only after verifying its registration, dispatch, accepted parameters, preflight support, and actual runtime behavior. Propose missing custom-handler support to the SDET rather than treating a placeholder as an implementation. The existing page-level `switchTab` handler is a separate supported operation, not evidence that arbitrary custom handlers work.

Report missing credentials, inaccessible or ambiguous targets, missing prerequisites, and unsafe cleanup as execution blockers rather than missing control types. If UI Map work is separately requested, follow `AGENTS.md`: reuse or register verified fields in the appropriate page or shared-component map, and ask about unclear ownership rather than defaulting to a miscellaneous map.

## Missing Prerequisites and Data

- Reuse a verified prerequisite profile when it matches the intended state. Never invent a profile name or inline unverified parent login/navigation steps.
- If an existing prerequisite needs data that is unavailable, identify each missing value and its location. Use clearly marked placeholders only where they cannot be executed as real input. Never put real passwords, tokens, or other credentials into generated YAML, source files, command lines, logs, or reports. Do not ask the user to paste secrets into chat.
- If a needed prerequisite profile does not exist, describe the required state and nearest verified template, if any. Do not invent its implementation or silently create a real-looking setup profile.
- Generate executable YAML only for scenarios whose steps and prerequisites are verified. For a scenario blocked by a missing control capability, a schema-valid draft profile may use a clearly labelled `REQUIRES_SDET_HANDOFF` step and comments describing the specific missing capability; do not include unverified executable actions or references. The draft must fail if dispatched and must not run through existing preconditions before its handoff. If this cannot be represented safely with the current runtime, omit the profile and report it blocked instead.
- For other blockers, such as unavailable credentials, an uninspected target, or an unverified prerequisite, report the blocker without labeling it as a control-capability SDET handoff. Omit an unsafe executable profile until it can be verified; do not substitute a success-shaped placeholder.
- If a control-capability draft also needs data, include named, non-secret placeholders such as `# TODO username: <REQUIRED_USERNAME>` in comments on the draft profile, together with the verified prerequisite name and intended scenario steps as comments where known. For a missing prerequisite, comment the required state rather than a fabricated profile name. These comments are a work plan, not executable configuration.
- For each generated blocked draft profile, add a matching `test.skip` spec method with a clear reason. Never mark it passed or run it until the missing setup/data and assertions are implemented and the skip is removed. Do not silently skip a runnable profile.
- Generate other independent, fully supported scenarios normally. A blocked scenario must not prevent unrelated valid profiles from being generated and tested.

## Produce Path 2 YAML

- Prefer a reusable, page- or component-oriented suite over separate student, admin, or other role-specific files. Search existing suites and includes first, including role-named files, and reuse a suitable suite without renaming it. Use a stable page heading, title, route, or established product name as a guide; disambiguate generic, dynamic, localized, or repeated headings with the page or workflow context.
- Place verified role-specific scenarios or expected results in clearly named profiles in the same page suite where practical. Reuse shared scenarios and prerequisite profiles when behavior is genuinely the same; create separate files only when pages, workflows, or maintenance boundaries materially differ. Do not assume a scenario, locator, or permission verified for one role works for another.
- Keep credentials out of YAML and verify how the spec supplies each role's login data to the selected profile and its preconditions. A profile name alone does not select credentials. Do not invent role profiles or claim them runnable without verified setup, permissions, and behavior.
- These naming rules apply to new files and additions. Preserve existing filenames, profiles, and references unless an explicit migration is requested; if migrating, update dependent includes, specs, and references and verify each affected profile.
- Use `tests/suites/<suite-subpath>/<pageName>Steps.yaml`, preserving the existing file when updating. Set `page` when known, a concise `description`, actual registry key(s) in `uiMap`, and applicable relative `includes`. Use `sharedScenarios` and `profiles`; do not create a root `tests` section.
- Give each executable scenario a unique `td_*` profile. Use concise human-readable `step` descriptions. Standard executable steps use `fieldKey`, `intent`, and appropriate `params`; reference steps use the schema's `refScenario` or `refProfile` form instead.
- Declare only the immediate upstream parent profile in `preconditions` (e.g., `mheAssignmentsDirectorySteps.td_clickCreateAssignment`) rather than stacking every ancestor profile or duplicating intermediate screen navigation steps inside the target profile; the dispatcher resolves upstream precondition chains recursively with deduplication. When a scenario requires different setup data or a different upstream role/login profile (e.g., student vs. admin), specify `data:` or `overrides:` on the precondition. Do not assume an include's filename qualifies a profile at runtime without checking merged names.
- Extract a cohesive sequence of actions into `sharedScenarios` when it is genuinely reused by multiple profiles and faithfully represents each workflow. Reuse existing shared scenarios first; keep one-off or meaningfully different actions and profile-specific assertions in the relevant profile rather than extracting trivial steps solely for abstraction.
- Prefer one shared-scenario reference between a profile and its executable steps. A second shared-scenario level is acceptable only when it clearly improves reuse and remains within the loader's nesting limit; avoid deeper nesting. This authoring guideline does not limit the separate recursive precondition chain.
- Prefer direct named profile data referenced by `${data:key}` rather than chains of data tokens referring to other data tokens. Use supported defaults and any inline data forwarding only after verifying actual resolution, precedence, and scope; do not assume profile data automatically reaches preconditions. Use `storeAs` and `${store:key}` only when the runtime supports the requested value and assertion.
- For two-tab flows, use `fieldKey: "page"`, `intent: "custom"`, `handler: "switchTab"`, with `value: "new"` or `value: "main"` only after checking the current dispatcher. The current `main` operation closes child tabs; do not use it to represent switching back while keeping a child open.
- Make non-destructive edits: preserve unrelated scenarios, profiles, comments, files, and user changes. Do not overwrite an existing profile merely because its name is similar; resolve collisions before writing.

## Create and Run a Spec Method for Every Profile

- For every newly created `td_*` profile, create or update one matching Playwright test method in `tests/specs/<suite-subpath>/<pageName>.spec.ts`. Reuse an existing appropriate method rather than duplicating it. Follow the repository's `loadYamlSuite`, `CommandDispatcher.fromSuite`, and `executeProfile` pattern; use correct relative imports.
- A runnable profile gets a positive test which calls its exact profile name. Run each generated or updated positive method with the appropriate Playwright project and report its individual outcome. Respect the user's headed/headless preference and existing project configuration. Do not claim a profile passed because a different profile or only a schema check passed.
- Never execute tests requiring unavailable credentials, an unprepared environment, or blocked draft profiles. Mark them blocked or not run and explain how to unblock them. Respect requests to stop. Avoid tests with destructive external effects without the user's approval.
- Generate negative assertion tests only when explicitly requested. Use an isolated, intentionally incorrect expected value, leave the original positive test unchanged, and verify that the negative test fails at the intended assertion rather than during setup or navigation. Report the observed failure separately; never report it as a positive pass. Avoid leaving an intentionally failing test in the normal suite unless the user requests it.

## Validate and Report

1. Load every changed suite using the actual `loadYamlSuite` function from the repository root. For example, substituting the suite path as a separate argument:

   ```sh
   npx tsx -e "import { loadYamlSuite } from './src/engine/yamlLoader'; loadYamlSuite(process.argv[1]); console.log('Suite loaded successfully');" <suite-path>
   ```

   This checks loading and schema validation, not all references or runtime semantics. Also run the preflight command above for each changed profile and check the remaining preflight items against the merged suite, registry, dispatcher, and controls; report any check that could not be completed.
2. Run npx tsc --noEmit when TypeScript files change. Run the exact positive spec methods described above and capture their results. Do not replace browser execution with test discovery or type-checking.
3. In the final response list changed files, reused and created profiles, missing map entries, missing prerequisites/data, unsupported behavior, and a per-profile result: passed, failed, blocked, or not run, with the reason and test command. Distinguish a blocked placeholder from a completed scenario. Mention any requested negative-test result separately.