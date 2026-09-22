<div align="center">
  <img src="pi-goal-x.png" alt="pi-goal-x logo" width="560">
</div>

<div align="center">
  <a href="https://pi.dev/packages?type=extension" target="_blank" rel="noopener noreferrer">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="assets/badge-dark.svg">
      <img src="assets/badge-light.svg" alt="TOP 0.3% of Pi coding agent extensions: #7 of 3,275 by downloads · Sep 22, 2026 (best recorded rank)" width="480">
    </picture>
  </a>
</div>

# pi-goal-x

Persistent goals for [Pi](https://github.com/earendil-works/pi-coding-agent). Define a goal, review the plan, and let the agent work through it. Tasks and progress are saved across sessions, with an optional independent auditor checking completion.

## Install

```bash
pi install npm:pi-goal-x
```

Supports Pi **0.83–0.87**. Node 22.15+ is required; newer Pi releases require Node 22.19+.

## Start a goal

```text
/goal Add CSV export to the reports page, with documentation and tests.
```

Review the proposed objective and tasks, choose whether to use the completion auditor, and confirm to start. The agent continues automatically while the goal is active. If auditing is enabled, unmet requirements leave the goal open with feedback.

Use `/sisyphus` for an ordered plan that must be followed step by step. Use `/goal-direct <objective>` or `/sisyphus-direct <objective>` to skip drafting.

## Manage your work

The dashboard shows status, task progress, elapsed time and cumulative token usage. Press `Ctrl+Shift+T` to expand it, or `Ctrl+Shift+A` to toggle the completion auditor.

Each session has one focused goal. Pause with `/goal-pause`, continue with `/goal-resume`, and switch with `/goal-focus`. Pressing `Esc` during active work also pauses the goal; in the expanded dashboard, it collapses the view.

## Commands

| Command | What it does |
| --- | --- |
| `/goal [idea]` | Discuss, plan, and confirm a regular goal. |
| `/sisyphus [idea]` | Discuss, plan, and confirm an ordered goal. |
| `/goal-direct <objective>` | Create and start a regular goal immediately. |
| `/sisyphus-direct <objective>` | Create and start an ordered goal immediately. |
| `/goal-list` | List open goals. |
| `/goal-status` | Show the focused goal and its progress. |
| `/goal-focus` | Choose an open goal to work on. |
| `/goal-unfocus` | Leave the current goal open without focusing on it. |
| `/goal-tweak <change>` | Revise the current goal with the agent. |
| `/goal-pause` | Pause work on the focused goal. |
| `/goal-resume` | Resume a paused or blocked goal. |
| `/goal-clear` | Archive the focused goal after confirmation. |
| `/goal-cancel` | Cancel an unconfirmed draft. |
| `/goal-settings` | Configure goal behaviour and the auditor. |

## Settings and limits

Use `/goal-settings` to configure task tracking, completion requirements, the auditor and project or global defaults.

Automatic continuation is unlimited by default. Set `maxAutonomousRuns` to cap extension-started runs; zero disables them. `/goal-resume` renews the run allowance. Token budgets are lifetime spending limits, separate from context capacity. To change one, use `/goal-tweak set the token budget to 50000` or `/goal-tweak remove the token budget` and confirm the proposal.

Goals are stored in `.pi/goals` by default. See [advanced usage](docs/advanced-usage.md) for shared worktree storage, reminder settings, execution contracts and provider troubleshooting, or [prompt caching](docs/prompt-caching.md) for cache behavior.

For diagnostics, use `/goal-status verbose` or `/goal-status health`. `/goal-refresh` reloads saved goals and settings; `/goal-recovery` checks storage.

## License

MIT
