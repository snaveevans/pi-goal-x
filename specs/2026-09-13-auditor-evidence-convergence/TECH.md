# Technical notes

## Prompt (`extensions/goal-auditor.ts`)

- `renderAuditorTaskTree` renders, per task, the escaped `verificationContract`, `evidence`, and `skipReason` beneath the status line, recursively for subtasks. The existing escaping (`escapePromptPayload`) applies to every new field.
- The audit checklist states that confirmed completion requirements are the checklist and the objective is context; gaps outside them disapprove only when material.
- `buildGoalAuditorPrompt` accepts `previousAuditReport?: string | null`. When present it renders a `<previous_audit>` block and a checklist step to classify each prior finding as fixed, still open, or not applicable.
- When `settings.auditorWorkspaces` or `settings.auditorEnvironment` are set, the prompt renders an `<inspection_guidance>` block listing them, marked as guidance rather than evidence.

## Settings (`extensions/goal-settings.ts`)

- New sparse leaves: `auditorWorkspaces: string[]` (non-empty strings) and `auditorEnvironment: string` (non-empty). Invalid values produce `invalid_value` diagnostics without discarding other keys. They layer project over global like the other auditor leaves.

## Completion flow (`extensions/goal-completion.ts`)

- Before running the auditor, find the latest `audit_result` event for the goal in `goalRuntimeEvents`; when its verdict is `disapproved`, pass its `report` as `previousAuditReport`.
