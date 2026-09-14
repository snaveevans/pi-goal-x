import assert from "node:assert/strict";
import test from "node:test";

import { taskNeedsCodeReview } from "../extensions/goal-task-tools.ts";

test("code-changing tasks require a review", () => {
	assert.equal(taskNeedsCodeReview({ title: "Implement the parser", verificationContract: "Tests pass" }), true);
	assert.equal(taskNeedsCodeReview({ title: "Fix calibration bug", verificationContract: "pytest passes" }), true);
	assert.equal(taskNeedsCodeReview({ title: "Update docs", verificationContract: "README is accurate" }), false);
	assert.equal(taskNeedsCodeReview({ title: "Research prior art", verificationContract: "Sources are cited" }), false);
});
