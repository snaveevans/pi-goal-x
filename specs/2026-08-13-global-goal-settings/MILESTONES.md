# Milestones — global goal settings

## 2026-08-13

- Added `goalGlobalSettingsPath`, `loadGoalGlobalSettingsFileConfig`, `loadGoalSettingsFileConfigMerged`, `saveGoalGlobalSettingsFileConfig` to `extensions/goal-settings.ts`.
- Refactored the single-file load/save into shared `loadGoalSettingsFromPath` / `saveGoalSettingsAt` helpers keyed by path, so global and project files reuse the same zero-op session cache and validation.
- `loadGoalSettings` now merges global + project (project wins) before applying env overrides and defaults.
- `effectiveSettingsReport` reports per-key provenance (`env`/`project`/`global`/`default`) and both file paths.
- `/goal-settings` gained a scope row to switch between project and global editing; headless mode reports both paths. `/goal-refresh` fingerprint now covers the merged config so external global edits are detected.
- Added `getAgentDir` to `tests/stubs/pi-coding-agent.ts` (the bundled test adapter maps the real package to this stub).
- Review found a layering bug: parser/save normalization dropped explicit `false` and rejected `stallTimeoutMinutes: 0`, so project values could not override global `true`/positive values. Fixed parsing, persistence, and regression coverage for `false`/`0` overrides.
- Added handler-level coverage that switches `/goal-settings` to global scope, writes the global file, and leaves the project file untouched.
- Upstream CI-equivalent validation passes: `npm ci`, `npm run check`, `npm run lint`, `npm run test:all` (827 tests after review additions), `npm run test:selfcheck`, `npm pack --dry-run`, `npm audit --omit=dev` (0 vulnerabilities), and `npm run bench:gate:naf`.
