import * as fs from "node:fs";
import * as path from "node:path";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";

/** Small, append-only operational event stream. Payloads intentionally exclude
 * objectives, prompts, tool arguments, and model output. Enable with
 * PI_GOAL_X_OBSERVABILITY=1; failures are always best-effort. */
export type GoalObservation = {
	event: string;
	goalId?: string | null;
	status?: string;
	from?: string | null;
	to?: string | null;
	attempt?: number;
	delayMs?: number;
	approved?: boolean;
	error?: string;
};

export function observeGoal(ctx: Pick<ExtensionContext, "cwd">, observation: GoalObservation): void {
	if (process.env.PI_GOAL_X_OBSERVABILITY !== "1") return;
	try {
		const directory = path.join(ctx.cwd, ".pi", "goals", "debug");
		fs.mkdirSync(directory, { recursive: true });
		fs.appendFileSync(
			path.join(directory, "observability.jsonl"),
			JSON.stringify({ at: new Date().toISOString(), ...observation }) + "\n",
			"utf8",
		);
	} catch {
		// Diagnostics must never affect goal execution.
	}
}
