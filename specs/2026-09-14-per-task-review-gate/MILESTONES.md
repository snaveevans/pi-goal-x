## 2026-09-14 — Scope tightened

User steered the gate to capture uncommitted working-tree state, review complete diffs including untracked files, add rejected/failed/reload/dashboard integration coverage, enforce task ordering, and mark validation-only task 6 as non-code.

## 2026-09-14 — Follow-up implementation

Changed the baseline capture to use `git stash create` with an untracked-file inventory, and pass a bounded complete task diff to the reviewer. Added ledger reload coverage for rejected/error outcomes and dashboard activity coverage. Task 6 is explicitly marked `codeChange: false`; tasks 2–4 remain ahead of validation.

## 2026-09-14 — Verification follow-up

Added a temporary-repository regression test proving modified tracked files and newly created untracked files are included while pre-existing untracked files are excluded. Added public-tool E2E coverage for rejected and failed reviews preserving pending state and recording verdicts.

## 2026-09-14 — Review findings, first pass

A two-axis review found the goal archived while the lifecycle E2E test failed. Unlabelled tasks with no git information skipped review even though the README said the gate failed closed. User decision: review when changes cannot be determined. Test-first fixes:

- Unlabelled tasks with unknown changes are reviewed.
- Restarting a task keeps its baseline, so a retry review still sees rejected work.
- `set_goal_tasks` and drafting record a list-level baseline; the task merge had dropped per-task baselines for new tasks.
- The untracked inventory stores blob hashes, so edited pre-existing untracked files are included; new files are matched by exact tracked name instead of a substring search of the diff.
- Completions are validated before the paid review; batches are dry-run in order so child-then-parent batches stay valid.
- Approvals are written with `task_complete` through the spec ledger callback, so a rejected batch leaves no false approval.

Setback: the fail-closed rule made test harnesses that complete tasks call the real auditor, which rejected the tasks and made live model calls. Every such harness now injects a reviewer; one ordered-ledger assertion now expects `task_review` before each `task_complete`.

## 2026-09-15 — Review findings, second pass

`PRODUCT.md` and `TECH.md` now describe settings, the list-level baseline, gate order, and traceability. Fixes:

- An oversized diff is marked truncated and lists every changed file (test-first).
- Tasks that are not reviewed record a `skipped` outcome with the reason, including non-code tasks (test-first).
- Skip settings are checked before any git work, and the full diff is built only when a review will run. No behavioural test: the difference is not observable through the tools, so the existing suite guards it.
- Start baselines are computed before calling `GoalService`, because `updateTaskAttempt` retries its update closure once on a conflicting write and batch validation dry-runs closures. Also covered only by the existing suite.

Validation: `tsc`, eslint, unit suite 931 pass / 5 skipped, integration 30 pass / 1 skipped, lifecycle E2E and review helper files 17 pass / 1 skipped. No test reached the real reviewer.

## 2026-09-15 — Style findings

Refactor with no behaviour change, after syncing upstream v0.31.4:

- The gate moved from `goal-task-tools.ts` into `goal-task-review.ts`, so the task tools no longer mix git process work with task structure.
- The baseline is a typed `ReviewBaseline` (`{ revision, untracked }`) instead of a string packed with an `UNTRACKED` section. Ledger events keep only the revision. Goal files holding the old string form lose the baseline on load, so those tasks are reviewed as unclassifiable.
- One `git` helper replaces six copies of the exec options, and changed files and the diff share a single `git diff --name-only`.
- Removed the `try/catch` around the reviewer: `runGoalCompletionAuditor` already returns failures as an `error` result.
- The settings menu derives its boolean keys from the settings rows, dropping a dead `auditorProjectResources` branch; activity rendering computes the review report suffix once.
- Doc comments that restated field names on `codeChange`, `reviewType`, `code_change` and `review_type` were removed. Settings field comments stay, because that interface documents its fields.

Kept on purpose: the `undefined as unknown as` defaults in `goal-settings.ts` (the file's existing idiom) and the multi-place settings registration (a redesign of the settings system, not a style fix).

Validation: `tsc`, eslint, unit suite 956 pass / 5 skipped, integration 30 pass / 1 skipped; after the final type fix, task tool and review gate files 68 pass / 1 skipped. No test reached the real reviewer.
