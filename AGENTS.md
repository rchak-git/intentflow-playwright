# UI Map Builder Agent

These instructions are the single source of truth for building and maintaining UI Maps in this repository. Follow them in any compatible coding agent or harness. Use only workspace files, standard Node.js/TypeScript commands, and the standard Playwright MCP server; do not rely on vendor-specific APIs, extension settings, or model-specific prompt syntax.

## Read the Live Contracts First

Before creating or modifying a UI Map, read these files directly from the workspace:

- `src/types/uiMapTypes.ts`
- `src/types/intentSchema.ts`
- `src/registries/UiMapIndex.ts`
- `prompts/uiMapGeneratorPrompt.txt` and `prompts/gherkintoUIMapPrompt.txt` for existing conventions
- `src/controls/searchControl.ts` and `src/controls/CardControl.ts` for runtime composite-control behavior

The source types and registry are authoritative. In particular:

- Use only the exact `WidgetType` and locator strategy shapes supported by `uiMapTypes.ts`; do not invent values or guess casing.
- Use only intents and sub-intents supported by `intentSchema.ts` and the target widget's runtime control.
- Generate declarative TypeScript dictionaries typed as `Record<string, UiMapEntry>` only. Never generate classes, `(page) => ...` functions, async methods, or Page Object Models.
- Never use empty strings for optional properties (for example, do not emit `text: ''`).
- The repository currently exports `SemanticLocatorStrategy`; consult the current type file rather than assuming a `LocatorStrategy` export exists.

## File Naming, Placement, and Registry Synchronization

- Place UI Map files under `src/registries/<AUT_Directory>/<camelCasePageName>.map.ts`, preserving the directory's exact casing (for example, `Moodle`, `Mhe`, `Angular`, or `React`).
- Export `export const <PascalCasePageName>UiMap: Record<string, UiMapEntry> = { ... }`.
- Name keys `<pagePrefix>_<elementDescription><WidgetType>`, such as `moodle_participants_searchInput` or `mhe_login_submitButton`.
- Include a distinct page or component qualifier in every key to prevent collisions when maps are spread into a consolidated domain map.
- Before registration, inspect `src/registries/UiMapIndex.ts`. If this map is not registered, update that file to:
  1. Import `{ <PascalCasePageName>UiMap }` from `./<AUT_Directory>/<camelCasePageName>.map`.
  2. Spread `...<PascalCasePageName>UiMap` into the corresponding consolidated domain map (for example, `MOODLE_UI_MAP` or `MHE_UI_MAP`).
  3. Add both `<PascalCasePageName>UiMap` and `<camelCasePageName>UiMap: <PascalCasePageName>UiMap as Record<string, UiMapEntry>` to `UI_MAP_REGISTRY`.

## Reaching Authenticated or Deep Target Pages

1. **Auto-discover a profile first.** Search `tests/suites/**/*.yaml` for a profile or `refProfile` that reaches the target page. Match by page name, URL, or domain keywords so the user does not need to provide a test path manually.
2. **Capture the session.** Run:

   ```sh
   npx tsx src/cli/reachPage.ts --suite <discovered-yaml> --profile <discovered-profile>
   ```

   The helper runs the profile, saves `playwright/.auth/state.json`, and prints `STATE_SAVED=...` and `TARGET_URL=...`. Then inspect the live page with the standard Playwright MCP server (`browser_navigate` followed by `browser_snapshot`).
3. If the saved state is missing, expired, or the target redirects to an SSO login block, pause and ask the user to perform an interactive login or supply valid session state.
4. If no matching suite/profile exists, check `.env` for a base URL or credentials. Never hardcode or print secrets. Navigate interactively through Playwright MCP, or ask whether MFA or other manual steps are required.

## Main Flow (MF-1): Scenario-Scoped Extraction

- Parse the supplied user story or manual tests (Gherkin or plain steps).
- Include only actionable controls exercised by those tests. Do not capture ambient page noise such as column sorting links, static counters, or decorative headers unless explicitly requested.
- Infer the `widgetType` and any required `subSelectors` or `columns` from the test actions and assertions.

## Alternate Flow 1 (AF-1): Non-Destructive Delta Updates

- When updating an existing `.map.ts` file, never rename, delete, or change existing keys, strategies, selectors, columns, or sub-selectors unless explicitly asked to fix a broken locator.
- Deduplicate first. If an existing key targets the requested DOM element, reuse it and report it.
- Append only new delta keys, or newly required `subSelectors`/`columns` on an existing composite entry.
- Finish with a diff summary containing **Reused Keys**, **Added Delta Keys**, and **0 Existing Keys Modified**.

## Alternate Flow 2 (AF-2): Interactive State-Dependent Elements

For modals, tabs, drawers, and portaled dropdowns (including `[role="listbox"]`, `[role="dialog"]`, and `.cdk-overlay-container`), trigger the state with Playwright MCP (`browser_click`, `browser_type`), take a fresh `browser_snapshot`, and map the revealed controls.

## Alternate Flow 3 (AF-3): Exploratory Scaffolding

If no test cases are provided, scan `<main>` while excluding global header/footer boilerplate. Annotate inferred widget types with `// TODO: verify widgetType`.

## Locator Strategy and Strict-Mode Rules

- Inspect the live accessibility tree with Playwright MCP `browser_snapshot`. `strategy: 'role'` with a role and accessible name is preferred only when that pair is unique on the page.
- If duplicate `(role, name)` matches exist, do not use a bare role locator. Use a label locator, scoped CSS (including `:has()` where appropriate), or relative XPath anchored to a unique parent landmark or heading.
- Set `exact: true` when needed to prevent substring collisions.
- Never use auto-generated IDs or hashes, including IDs like `#mat-select-45`, `_R_...`, `_ngcontent-*`, dynamic `css-*` hashes, or random UUIDs.
- If an element or composite container is inside an iframe, set `frameSelector: 'iframe[...]'` directly on its `UiMapEntry`.

## Widget-Specific Structural Contracts

- **`RADIO_GROUP`:** Anchor to a shared `name`, `<mat-radio-group>`, or `[role="radiogroup"]`. Include `subSelectors: { option: 'mat-radio-button, .MuiRadio-root, [role="radio"]', label: '.mdc-label, label' }`. Avoid bare `input[type="radio"]` for custom UI libraries.
- **`CUSTOM_SELECT` and `SEARCH`:** Prefer `strategy: 'label'` or scoped CSS (including `:has()`). Define the relevant `subSelectors`: `overlayPanel` for body-portaled overlays such as `.cdk-overlay-container` or `[role="listbox"]`, `option`/`optionItem`, and `clearBtn` where applicable. Confirm the exact supported structure in the current type definitions and runtime control.
- **`CARD` and `CONTAINER`:** The top-level `selector` must be a generic, unparameterized selector matching all instances; never hardcode `${anchorText}` or item text there. Put relative child selectors in `subSelectors`.
- **`WEB_TABLE`:** Use `widgetType: 'WEB_TABLE'`, not `'TABLE'`, for newly created maps. Set an unfiltered table/grid root `selector`, a `rowSelector` (for example, `'div[role="row"], tbody tr'`), and 1-based columns such as `columns: { <colName>: { index: 1, controlType: 'LINK' | 'BUTTON' | 'SELECT' | 'TEXT', subSelector: '...' } }`. Map floating row action menus separately using a supported widget type; do not invent a `MENU` type unless the current types define it.

## Missing Scenario Targets

- Before adding a UI Map entry, verify that the target control exists in the live page or a supplied DOM/accessibility snapshot. Do not infer existence from a scenario step or invent a locator from its wording.
- If a scenario targets a control that is absent, do not add a map entry for it. If the page could not be inspected, report it as unverified, not as confirmed absent.
- Continue mapping all valid scenario targets even if another scenario targets a missing or unverified control. Exclude unsupported targets from the UI Map and clearly warn about them in the final output.
- For each warning, identify the scenario name, requested control, and status (missing or unverified), and state that the scenario cannot be mapped or reliably run until the UI or scenario is corrected.

## Exceptions and Verification

- Never hallucinate a locator for an absent or ambiguous element. Clearly warn the user in the final response instead.
- After creating or updating any `.map.ts` file or `UiMapIndex.ts`, run `npx tsc --noEmit` and resolve all TypeScript errors before finishing.
- Report the files created or changed and any elements that could not be mapped reliably.
