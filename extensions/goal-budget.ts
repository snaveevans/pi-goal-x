import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import { nowIso, type GoalRecord } from "./goal-record.ts";
import type { GoalCore } from "./goal-state.ts";

export type GoalBudgetChange =
	| { ok: true; goal: GoalRecord; message: string }
	| { ok: false; message: string };

/**
 * The single budget-mutation path shared by the set_goal_budget tool and the
 * /goal-budget command. `budget` is already validated by the caller; undefined
 * removes the budget. The change preserves the goal's identity, objective,
 * tasks, evidence, and usage, appends a goal_budget_changed ledger event, and
 * never resumes the goal: a budget_limited goal whose new budget permits
 * further work becomes paused so the user can resume it explicitly.
 */
export function setFocusedGoalBudget(core: GoalCore, ctx: ExtensionContext, budget: number | undefined): GoalBudgetChange {
	core.reconcileFocusedGoalFromDisk(ctx);
	const goal = core.state.goal;
	if (!goal) return { ok: false, message: "No focused goal to update." };
	if (goal.status === "complete") return { ok: false, message: "A completed goal's budget cannot be changed." };
	core.accountProgress(ctx);
	const previousBudget = goal.tokenBudget;
	const result = core.goalService.apply(ctx, {
		reconcile: false,
		refreshFromDisk: true,
		mutate: (g) => {
			const next = { ...g, updatedAt: nowIso() };
			if (budget === undefined) delete next.tokenBudget;
			else next.tokenBudget = budget;
			if (g.status === "budget_limited" && (budget === undefined || budget > g.usage.tokensUsed)) {
				next.status = "paused";
				next.autoContinue = false;
				next.stopReason = "agent";
				next.pauseReason = budget === undefined ? "Token budget removed." : `Token budget raised to ${budget}.`;
				next.pauseSuggestedAction = "Resume with /goal-resume if you want this goal to continue.";
			}
			return next;
		},
		ledger: (written) => [{
			type: "goal_budget_changed" as const,
			goalId: written.id,
			oldBudget: previousBudget,
			newBudget: budget,
			tokensUsed: written.usage.tokensUsed,
			at: written.updatedAt,
		}],
	});
	if (!result.ok) {
		return { ok: false, message: `Goal budget update failed: ${result.message ?? "the state mutation was rejected"}. The goal was NOT changed.` };
	}
	if (budget === undefined || (result.goal.status !== "active" && result.goal.status !== "budget_limited")) core.clearActiveAccounting();
	else if (core.accounting.goalId !== result.goal.id) core.beginAccounting();
	core.updateUI(ctx);
	const status = result.goal.status;
	const resumeHint = status === "paused" ? " Use /goal-resume to continue it." : "";
	return {
		ok: true,
		goal: result.goal,
		message: `Token budget ${budget === undefined ? "removed" : `set to ${budget}`}. Status: ${status}. Usage: ${result.goal.usage.tokensUsed} tokens.${resumeHint}`,
	};
}
