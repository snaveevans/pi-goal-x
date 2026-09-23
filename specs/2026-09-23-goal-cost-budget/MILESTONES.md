# Implementation log

## 2026-09-23 — Opt-in estimated-USD cap

* Forked `tmonk/pi-goal-x` as `snaveevans/pi-goal-x`, cloned to `~/workspace/pi-goal-x`, developed on `feat/goal-usd-budget`.
* Added `/goal`, `/sisyphus` and `-direct` `--max-cost <USD>` parsing, `create_goal(max_cost_usd)` and a confirmed `/goal-tweak` cost adjustment. Existing goals and token budgets remain backward-compatible.
* Included guided drafting (including confirmation response and branch-local reload), assistant/tool cost, Pi compaction and observed cache-warming usage, and nested completion-auditor turns. USD usage comes from Pi `usage.cost.total`; no second price table. Pauses capped work if cost data is missing, and disallows confusing a cost-aborted auditor with user Escape bypass.
* Added human guidance to `docs/advanced-usage.md` and README command table; agent instructions in tool schemas and prompt snapshots; displayed estimates and caps in status, goal tools, and dashboard. Updated additive cross-session usage merging and ledger events.
* Tests include budget validation and corrupt data, draft persistence and exhaustion, independent token/cost gates, tweak changes, compaction/cache usage, audited completion, aborted model responses, and revision-conflict cost merging. Updated runner manifest.
* Validation on Node 24: `npm run check`, `npm run lint`, `npm run test:selfcheck` (78 unit files, 1049 tests at the first run), `npm run test:integration` (31 tests), `npm run test:e2e` (20 tests), and `npm run test:all` after final changes (84 files, 1102 tests, zero failures). `npm pack --dry-run --ignore-scripts --json` includes the new runtime file and guide. Live Pi 0.87.1 RPC load checked in an isolated temporary cwd without making any model call.

## Boundaries

The cap is an estimated USD limit on attributed goal work, not a Copilot billing API or hard ceiling. A single model request may overshoot the cap. Actual Copilot charges depend on included credits and provider reporting. Some unrelated/out-of-session background calls and manual branch summaries cannot be attributed reliably; see `docs/advanced-usage.md`.
