# YAML Suite Inspector

Run `npm install` and then `npm run yaml-editor` from the repository root.
Open http://127.0.0.1:4173. The server listens only on the local loopback
address and reads `.yaml` files under `tests/suites`.

Select a suite and a `td_` profile to inspect recursively expanded steps,
including preconditions and nested scenario and profile references. This is a
recursive preview: unlike the preview, the IntentFlow runner executes nested
preconditions shallowly. The preview may therefore show repeated setup steps
that the runner does not execute.

Edit existing profile data, reference data and step `params.value` fields
belonging to the selected suite. Editing a shared scenario affects all its
callers. Values from other suites are read-only; select their suite to edit
them. Non-string values use JSON syntax to preserve their types. Data templates
are shown as written, not interpolated runtime values. Missing or cyclic
references are reported rather than silently omitted.
Save writes the full suite, retaining comments on unchanged YAML nodes where
possible. If the suite data changes on disk while editing, reload it before
saving. Keep backups when editing files that use complex YAML features such as
anchors or custom tags.
