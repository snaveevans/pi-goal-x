import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import goalExtension from "../extensions/goal.ts";
import {
	DefaultResourceLoader,
	SessionManager,
	SettingsManager,
	createAgentSession,
} from "@earendil-works/pi-coding-agent";

const cwd = mkdtempSync(path.join(tmpdir(), "pi-goal-real-api-"));
try {
	const settingsManager = SettingsManager.inMemory({});
	const sessionManager = SessionManager.inMemory(cwd);
	const resourceLoader = new DefaultResourceLoader({
		cwd,
		agentDir: cwd,
		settingsManager,
		extensionFactories: [goalExtension],
		noSkills: true,
		noPromptTemplates: true,
		noThemes: true,
		noContextFiles: true,
	});
	await resourceLoader.reload();

	const result = await createAgentSession({
		cwd,
		sessionManager,
		settingsManager,
		resourceLoader,
		tools: [],
	});

	assert.ok(result.session, "real SDK should create an AgentSession");
	assert.ok(result.extensionsResult, "real SDK should return extension load results");
	assert.equal(result.extensionsResult.errors.length, 0, "goal extension should load without SDK errors");
	result.session.dispose();
	console.log("Real Pi API smoke test passed.");
} finally {
	rmSync(cwd, { recursive: true, force: true });
}
