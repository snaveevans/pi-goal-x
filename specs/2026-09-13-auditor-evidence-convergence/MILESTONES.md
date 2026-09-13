# Milestones

## 2026-09-13

- Diagnosed three consecutive audit rejections of a WSL + two-repository goal (essvi-bench): task contracts and evidence missing from the auditor prompt, no memory of the previous audit, and no way to point the auditor at WSL or a second repository.
- Agreed test seams: `buildGoalAuditorPrompt`, settings parsing, and the completion flow through the injected `runCompletionAuditor`. Drafting-time coverage warning deferred.
- Baseline: `goalSettingsPath: resolves under .pi/ with new filename` already fails on Windows (asserts a `/tmp/project` prefix against a backslash path). Unrelated; left as is.
- Task tree in the auditor prompt now carries each task's requirement, evidence and skip reason, escaped, under its status line.
- Checklist step 1 names the confirmed requirements as the checklist and the objective as context; out-of-contract gaps disapprove only when material.
- `previousAuditReport` renders a `<previous_audit>` block and a re-check step; the completion flow passes the last `audit_result` report when its verdict was `disapproved`.
- New settings `auditorWorkspaces` and `auditorEnvironment` parse, layer project over global, and render as `<inspection_guidance>`.
- Setback: the first layering test wrote the project settings file after loading that directory once. Layer reads are cached per path until saved or invalidated, so the test was wrong about when files are re-read; it now writes each directory's file before its first load.
