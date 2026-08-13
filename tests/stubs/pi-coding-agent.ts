/**
 * Test adapter for the tiny runtime-valued SDK surface used by pi-goal-x.
 * The unbundled compatibility suite still imports the real package.
 */
import { homedir } from "node:os";
import { join } from "node:path";

export function defineTool<T>(definition: T): T {
	return definition;
}

export function createExtensionRuntime(): Record<string, never> {
	return {};
}

/** Mirrors the real `getAgentDir()` (`~/.pi/agent`, honoring `PI_CODING_AGENT_DIR`). */
export function getAgentDir(): string {
	return process.env.PI_CODING_AGENT_DIR ?? join(homedir(), ".pi", "agent");
}

export const SessionManager = {
	inMemory: (cwd: string) => ({ cwd }),
};

export const SettingsManager = {
	inMemory: (settings: unknown) => ({ settings }),
};

export async function createAgentSession(): Promise<never> {
	throw new Error("Real agent sessions are disabled in bundled tests; inject a session fixture.");
}
