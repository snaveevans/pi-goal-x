/**
 * Provider-boundary compatibility tests (issue #59).
 *
 * With Pi's `openai-responses` API and no explicit compat override, the
 * Responses tool converter receives `supportsStrictMode: false` and therefore
 * OMITS the `strict` field on function tools. OpenAI's Responses contract
 * documents that omitting `strict` allows normalization into strict mode,
 * which makes every optional argument effectively required at the model
 * boundary — the root cause of the accidental `token_budget: 1` goals and the
 * rejected `get_goal` / `update_goal_task` calls reported in the issue.
 *
 * The fix for the omission itself belongs in Pi core. These tests pin the
 * extension side of the boundary:
 *  1. the registered goal schemas keep genuinely optional arguments optional;
 *  2. the converter serializes `strict: false` for ordinary goal tools when
 *     the (narrowly scoped, documented) `supportsStrictMode: true` override is
 *     applied — the workaround users can apply per affected model today;
 *  3. a budget-free creation stays budget-free on disk and in its report.
 */

import { mkdirSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

import type { ExtensionContext, ToolDefinition } from "@earendil-works/pi-coding-agent";
import { convertResponsesTools } from "@earendil-works/pi-ai/api/openai-responses-shared";
import goalExtension from "../extensions/goal.ts";
import { parseGoalFile } from "../extensions/storage/goal-files.ts";

function createHarness(cwd: string) {
	const handlers = new Map<string, Function>();
	const tools = new Map<string, ToolDefinition>();
	const pi = {
		registerTool: (def: ToolDefinition) => { tools.set(def.name, def); },
		registerCommand: () => {},
		on: (event: string, handler: Function) => { handlers.set(event, handler); },
		appendEntry: () => {},
		registerMessageRenderer: () => {},
		sendMessage: () => {},
		getActiveTools: () => ["read", "bash", "edit", "write"],
		setActiveTools: (names: string[]) => { void names; },
		hasUI: false,
	};
	const ctx = {
		cwd,
		hasUI: false,
		sessionManager: {
			getBranch: () => [] as unknown[],
			getCwd: () => cwd,
			getSessionId: () => "provider-compat-session",
			getRoot: () => cwd,
		},
		ui: {
			notify: () => {},
			setStatus: () => {},
			setWidget: () => {},
			onTerminalInput: () => () => {},
			select: async () => undefined,
			confirm: async () => false,
			custom: async () => undefined,
		},
		getSystemPrompt: () => "base prompt",
		isIdle: () => true,
		hasPendingMessages: () => false,
		abort: () => {},
	} as unknown as ExtensionContext;
	goalExtension(pi as any, {});
	return { handlers, tools, ctx };
}

type JsonSchema = { required?: string[]; properties?: Record<string, Record<string, unknown>> };

test("create_goal keeps optional arguments optional in the registered schema", () => {
	const cwd = mkdtempSync(path.join(tmpdir(), "goal-compat-schema-"));
	mkdirSync(path.join(cwd, ".pi", "goals", "archived"), { recursive: true });
	try {
		const { tools } = createHarness(cwd);
		const create = tools.get("create_goal")!;
		const schema = create.parameters as JsonSchema;
		assert.deepEqual(schema.required, ["objective"], "only objective is required");
		assert.ok(schema.properties?.token_budget, "token_budget exists");
		assert.equal(schema.properties!.token_budget!.minimum, 1, "positive minimum preserved");
		assert.equal(schema.properties!.mode!.enum === undefined && !Array.isArray(schema.properties!.mode!.anyOf), false, "mode enum serialized");

		const getGoal = tools.get("get_goal")!;
		assert.deepEqual((getGoal.parameters as JsonSchema).required ?? [], [], "get_goal root fields all optional");

		const updateTask = tools.get("update_goal_task")!;
		const updateSchema = updateTask.parameters as JsonSchema;
		assert.deepEqual(updateSchema.required ?? [], [], "update_goal_task root fields all optional (single-task XOR batch is runtime-validated)");
		assert.ok(updateSchema.properties?.task_id && updateSchema.properties?.updates, "both update forms present");
	} finally {
		rmSync(cwd, { recursive: true, force: true });
	}
});

test("set_goal_budget requires an explicitly nullable token_budget", () => {
	const cwd = mkdtempSync(path.join(tmpdir(), "goal-compat-budget-schema-"));
	mkdirSync(path.join(cwd, ".pi", "goals", "archived"), { recursive: true });
	try {
		const { tools } = createHarness(cwd);
		const tool = tools.get("set_goal_budget")!;
		const schema = tool.parameters as JsonSchema;
		assert.deepEqual(schema.required, ["token_budget"], "omission must never silently remove a budget");
		const budgetSchema = JSON.stringify(schema.properties?.token_budget);
		assert.ok(budgetSchema.includes('"type":"null"'), `null removal branch present: ${budgetSchema}`);
		assert.ok(budgetSchema.includes('"minimum":1'), `positive integer branch present: ${budgetSchema}`);
	} finally {
		rmSync(cwd, { recursive: true, force: true });
	}
});

test("Responses converter serializes strict:false for goal tools only when strict mode support is claimed", () => {
	const cwd = mkdtempSync(path.join(tmpdir(), "goal-compat-converter-"));
	mkdirSync(path.join(cwd, ".pi", "goals", "archived"), { recursive: true });
	try {
		const { tools } = createHarness(cwd);
		const ordinary = ["create_goal", "get_goal", "set_goal_budget", "update_goal", "set_goal_tasks", "update_goal_task"]
			.map((name) => tools.get(name))
			.filter((def): def is ToolDefinition => def !== undefined)
			.map((def) => ({ name: def.name, description: def.description, parameters: def.parameters }));

		// The Pi openai-responses caller resolves supportsStrictMode to false by
		// default: `strict` is omitted, which is what allowed upstream strict
		// normalization to fill optional arguments (issue #59).
		const omitted = convertResponsesTools(ordinary as never, { supportsStrictMode: false }) as unknown as Array<Record<string, unknown>>;
		for (const tool of omitted) {
			assert.equal("strict" in tool, false, `${tool.name}: strict must be omitted when unsupported`);
		}

		// The documented per-model workaround (compat.supportsStrictMode: true)
		// makes Pi serialize an explicit `strict: false` opt-out for these
		// ordinary tools — it does NOT request constrained sampling.
		const explicit = convertResponsesTools(ordinary as never, { supportsStrictMode: true }) as unknown as Array<Record<string, unknown>>;
		for (const tool of explicit) {
			assert.equal(tool.strict, false, `${tool.name}: explicit strict:false opt-out expected`);
			const params = tool.parameters as JsonSchema;
			if (tool.name === "create_goal") assert.deepEqual(params.required, ["objective"], "required array preserved through conversion");
		}
	} finally {
		rmSync(cwd, { recursive: true, force: true });
	}
});

test("a budget-free create_goal call persists no budget and reports Budget: none", async () => {
	const cwd = mkdtempSync(path.join(tmpdir(), "goal-compat-create-"));
	mkdirSync(path.join(cwd, ".pi", "goals", "archived"), { recursive: true });
	try {
		const h = createHarness(cwd);
		await h.handlers.get("session_start")?.({ reason: "start" }, h.ctx);
		const create = h.tools.get("create_goal")!;
		const result = await (create.execute as any)("compat-create", {
			objective: "=== Goal ===\nObjective: schema-test",
			// Deliberately no mode and no token_budget: the strict-normalization
			// failure filled these in; the extension must persist only what was
			// actually supplied.
		}, undefined, undefined, h.ctx);
		const text = result.content?.[0]?.text ?? "";
		assert.ok(text.includes("Budget: none"), `creation report must show Budget: none, got: ${text.slice(0, 160)}`);
		const active = readdirSync(path.join(cwd, ".pi", "goals")).filter((n) => n.startsWith("active_goal_"));
		assert.equal(active.length, 1);
		const parsed = parseGoalFile(path.join(cwd, ".pi", "goals", active[0]!));
		assert.ok(parsed);
		assert.equal(parsed.tokenBudget, undefined, "no accidental budget persisted");
		assert.equal(parsed.sisyphus, false, "no accidental sisyphus mode persisted");
	} finally {
		rmSync(cwd, { recursive: true, force: true });
	}
});
