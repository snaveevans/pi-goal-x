# Global goal settings

## Problem

`pi-goal-x-settings.json` is read and written per-project only (`.pi/pi-goal-x-settings.json`). A user who wants the same behavior (auditor model, task tracking, keybindings, objective caps, …) across every project must copy the file into each project.

## Goal

Add a global settings file so configuration can be defined and edited once for all projects, while still allowing per-project overrides.

## Behavior

Two layered files, mirroring pi's own convention (`~/.pi/agent/settings.json` overridden by `.pi/settings.json`):

| Location | Scope |
|----------|-------|
| `~/.pi/agent/pi-goal-x-settings.json` | Global (all projects) |
| `.pi/pi-goal-x-settings.json` | Project (current directory) |

Precedence (highest wins):

1. Environment variables (`PI_GOAL_DISABLE_TASKS`, `PI_GOAL_DISABLE_CONTRACTS`, `PI_GOAL_OBJECTIVE_MAX_CHARS`)
2. Project file (explicit `false` and `0` values override global values)
3. Global file
4. Defaults

The global path honors pi's own `PI_CODING_AGENT_DIR` override (via `getAgentDir()`). Both files accept the same keys and reject unknown keys.

New env var: `PI_GOAL_GLOBAL_SETTINGS_FILE` — alternative global settings path (relative to `~` or absolute), mirroring the existing `PI_GOAL_SETTINGS_FILE` for the project file.

`/goal-settings` gains a scope row at the top of the menu: select it to switch between editing the project file and the global file. Headless `/goal-settings` reports both paths without writing either file.

`/goal-status verbose` provenance now distinguishes `env`, `project`, `global`, and `default` per key, and lists both file paths.

## Non-goals

- No deep merge of nested objects: a project `keybindings` block replaces the global one wholesale (per-key dashboard merge is unnecessary; each parsed block is already fully default-filled).
- No per-key "unset/inherit" markers. Deleting a key from the project file is how you fall back to global. Explicit `false`/`0` values stay persisted because they are meaningful project overrides.
