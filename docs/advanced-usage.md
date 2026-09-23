# Advanced usage

For installation, goal workflows, commands and the settings overview, see the [README](../README.md).

## Automatic continuation and optional execution contracts

Active goals continue automatically after successful executions, including reasoning-only responses and final-task verification. No tool call, task update, scheduling declaration, or cooldown is required. Unproductive loops remain possible; optional run limits and token budgets still apply.

Enable `strictExecutionContract: true` in `/goal-settings` or your global/project settings to require explicit ready/wait decisions. In that mode, a missing decision permits one repair prompt within the remaining allowance, then pauses. This is a user preference; agents should not enable it merely to continue.

Set an appropriate allowance in `/goal-settings`, or in `.pi/pi-goal-x-settings.json`:

```json
{ "maxAutonomousRuns": 20 }
```

Agents may edit this setting. Changing it does not replenish consumed runs; explicit `/goal-resume` renews the period and continues now, including from a waiting goal. No configured allowance is required unless the effective limit is zero, which disables resume. Tool calls within a run are not separate runs. Existing token budgets still apply.

Explicit `ready` is optional in default mode. New `wait` declarations require strict mode; otherwise they return a non-terminating error. Previously saved waits retain their deadline, checks, and repair rules when upgrading or disabling strict mode, and may be re-declared with the same identity. Mode changes never resume a paused goal or renew consumed runs.

```js
update_goal({ continuation: { kind: "ready", next_action: "Verify the build artifacts" } })
update_goal({ continuation: {
  kind: "wait", reason: "Await the remote build",
  deadline: "2026-09-15T12:00:00Z",
  polling: { interval_seconds: 60, max_checks: 3 }
} })
```

Use a future deadline appropriate to the task. Omit `polling` for an event-only wait. Successful declarations terminate the execution segment. On a scheduled check, reuse the returned `wait_id` and original deadline, omitting `polling`; remaining checks cannot be reset. A ready decision ends the wait. Time spent waiting is not active execution time.

The dashboard, `/goal-status`, and `get_goal` show scheduling state, timing, checks, and allowance consumption. Expired waits and exhausted checks or allowance pause without another model call. Waits survive reopening the same session, without replaying missed checks; Pi must remain open for timers to execute. Another session requires explicit resume to take ownership. An ambiguous interrupted dispatch requires resume instead of automatic replay.

## Background producer integration

Budget-controlled producers emit a scheduler signal instead of starting their own model turn:

```js
pi.events.emit("pi-goal:wake", { goalId, waitToken });
```

`waitToken` is returned in the wait declaration's tool-result details. Register it before the producer completes, or retain the completion until registration (for example, observe the `update_goal` tool result in the host adapter). The token changes after consumption and re-declaration. A matching signal received before agent settlement is retained; duplicate, stale and wrong-goal tokens are ignored. A signal and timer can claim only one wake.

Existing producers that directly send `triggerTurn`/`followUp` messages still run as ordinary host work and supersede old pending decisions. Those independently started turns are **outside this extension's allowance**; use `pi-goal:wake` to put them through its spending gate. The allowance also does not limit Pi's own within-run tool loop or native retries. It bounds the goal extension's kickoff, continuation, check, signal, repair and recovery dispatches.

## Prompt caching

Goal state is refreshed at the request tail while the system prompt and conversation prefix stay stable. Pi retains control of provider cache settings. See [prompt caching](prompt-caching.md) for explicit-cache handling, validation, and cache invalidation boundaries.

## Changing a token budget

Use the existing tweak flow: `/goal-tweak remove the token budget` or `/goal-tweak set the token budget to 50000`. The proposal shows the current and proposed limits before confirmation. A budget is a total lifetime limit, not an additional allocation; consumed tokens and completed work are preserved. Omitting a budget change retains the current limit.

After confirmation, a goal stopped only by its budget can continue if the revised limit allows it and scheduling permits. A still-exhausted budget keeps it stopped. Other-session ownership, interrupted execution and exhausted autonomous-run allowances still require their existing recovery steps. Creation and tweak results always show the effective budget.

## Per-goal estimated USD limit (`--max-cost`)

Put `--max-cost` **before** the objective when starting a goal. It is a Pi slash-command argument, **not** a `pi` process flag:

```text
/goal --max-cost 5.00 Add CSV export with tests
/sisyphus --max-cost 5.00 Migrate authentication in the specified order
/goal-direct --max-cost 5.00 Add CSV export with tests
/sisyphus-direct --max-cost 5.00 1. Add tests. 2. Migrate. 3. Verify.
```

The amount is USD, in whole cents (for example, `5`, `5.00`, or `0.01`); zero, negative, fractional-cent, missing, and malformed values are rejected **before** starting a draft or creating a goal. Omit the flag for no cost limit. A model/agent calling `create_goal` can pass `max_cost_usd` **only when explicitly requested by the user**. During guided creation, `propose_goal_draft(max_cost_usd)` can also set a user-requested cap; an explicitly supplied `--max-cost` cannot be silently changed by the agent. Cost limits do not change the existing independent `token_budget` or `maxAutonomousRuns` controls; the first exhausted limit stops automatic goal work.

The estimate starts with the **first guided-drafting model response**, including clarification and the final proposal/confirmation response. It is saved in the session's draft entries across `/reload`/resume, displayed by `/goal-status` and the confirmation preview, then transferred to the goal file on confirmation. When a draft reaches its limit, drafting stops without creating a goal; starting another draft is a **new** goal with a new limit and does not retroactively count a discarded draft. A direct goal starts at $0. Historical model usage on goals that predate this feature is not backfilled: adding a cap later cannot recover prior costs. Pi's completed assistant responses during goal execution (including cached input and output), model usage explicitly reported by other tools, Pi compaction summaries, background cache-warming usage entries observed in the goal session, and each model response by the independent completion auditor all contribute to the goal's cumulative `usage.costUsd`. An auditor that hits the limit stops without accepting completion or offering the user-aborted-audit bypass. A paused or budget-limited goal's tweak conversation also adds to that goal's estimated usage.

`/goal-status` and `get_goal` show the estimated USD amount and cap. The dashboard also shows the USD gauge when set. Warnings appear after crossing 50%, 75%, and 90% during active work. The goal enters `budget_limited` at or above its cap, cancels pending automatic continuations, and receives a one-time wrap-up instruction. To adjust an existing goal without resetting spent cost, use `/goal-tweak set the max cost to $10.00` or `/goal-tweak remove the max cost`; the proposal shows the current and new limits and requires confirmation. `/goal-resume` alone cannot override an exhausted limit. The existing token budget and token usage are retained if only the USD limit changes.

**How it is estimated:** Pi's finalized `usage.cost.total` comes from its model catalog rates (USD per million tokens), applied to the provider's reported uncached input, output, cache-read, and cache-write usage, including tiered pricing. No pricing table is copied into pi-goal-x. For GitHub Copilot, check the catalog's rates against [GitHub's current published per-token rates](https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing) when financial accuracy matters. Pi's rates can lag, and your Copilot plan's included credits/allowances affect the *actual* invoice. A missing or zero-priced response with nonzero usage on a capped goal pauses execution rather than assuming it was free; for a draft, it stops drafting.

**This is not a hard billing limit.** Actual usage is known only after each model response, so a single large response can overshoot substantially. Concurrent sessions can race, and a background charge not observed by this extension before the session closes, manual branch summaries, or extension-started requests that do not report tool usage may not be attributed to the goal. The cap does not prevent manual non-goal work, and it cannot enforce a Copilot organization-level spending limit. For a real billing ceiling, also use the provider's own budget controls. `--max-cost` is a best-effort limit on automatically continued work attributable to this goal.

## Optional arguments on Responses-compatible providers

Some Pi `openai-responses` configurations omit the wire-level `strict` flag. OpenAI Responses may normalize schemas into strict mode when that flag is omitted. This can conflict with optional goal arguments; it is separate from pi-goal-x's `strictExecutionContract` scheduling setting.

For the reported OpenCode model, a narrowly scoped Pi `models.json` override makes the supported Pi 0.84.1 adapter send `strict: false` for ordinary tools:

```json
{
  "providers": {
    "opencode": {
      "modelOverrides": {
        "gpt-6-astra": { "compat": { "supportsStrictMode": true } }
      }
    }
  }
}
```

The capability flag permits the adapter to send the explicit non-strict opt-out; it does not request strict sampling for ordinary goal tools. Merge this into existing model configuration and reload Pi. This is a provider-specific workaround, not a guarantee about third-party model behavior. The local reproduction inspects requests before transmission; the issue's live OpenCode A/B result has not been independently reproduced. See [issue #59](https://github.com/tmonk/pi-goal-x/issues/59) and [OpenAI's function-calling documentation](https://developers.openai.com/api/docs/guides/function-calling).

## Sharing a goal pool across worktrees

By default goals stay in `<cwd>/.pi/goals`. Set `goalsRoot` in your project or global settings to an absolute directory (or `~/path`), or set `PI_GOAL_ROOT` for the session. Precedence is environment, project, global, then the existing default. For example:

```json
{ "goalsRoot": "~/work/project-goals" }
```

Worktrees pointing to the same root share goals, archives, ledger and locks; focus remains session-local and execution ownership still requires explicit resume. The working directory for tools and audits is unchanged. Existing goals are not moved automatically. Reload/reopen the session after changing roots; `/goal-refresh` refreshes the selected pool. `/goal-status verbose` shows the effective location. Saved goal paths remain logical `.pi/goals/...` paths within that selected pool.

`hideUnfocusedPrompt: true` suppresses ordinary unfocused reminders to the model independently of `hideUnfocusedBanner`; neither changes focus or bypasses stale-checkpoint checks.

Token usage shown in the dashboard is cumulative across goal turns. The model receives a separate context snapshot when Pi can supply one; unavailable context is never reported as zero. Retained snapshots are bounded and newer snapshots supersede older ones.

## Diagnostics and recovery

Use `/goal-status verbose` for effective settings and storage location, `/goal-status health` or `/goal-recovery` to check for problems, and `/goal-refresh` to reload saved goals and settings after external changes. `/goal-recovery repair` offers repairs after confirmation.
