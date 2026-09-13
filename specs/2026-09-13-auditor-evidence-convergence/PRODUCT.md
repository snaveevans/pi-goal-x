# Auditor evidence and convergence

The completion auditor should judge the work against what the user confirmed, with the evidence the agent recorded, and should be able to reach every place the work lives. A goal whose work is genuinely complete should not be rejected repeatedly because the auditor could not see its evidence, or because each audit invents a different checklist.

## Problems observed

A real goal was rejected three times in a row:

- The auditor saw each task only as a checkbox and title. The task's completion requirement and the evidence the agent recorded for it were not shown; at most the last few ledger events reached it.
- With no goal-level completion requirement, the auditor re-derived its own checklist from a long objective on every attempt. Each attempt surfaced different weak points, so fixing the reported ones never converged.
- Each audit started with no knowledge of the previous rejection, so it could not confirm that the reported gaps were fixed.
- The work was built and tested inside WSL and touched a second repository. The auditor ran on the host, in the project directory only, and reported both as "not inspectable".

## Behaviour

- The auditor sees every task and subtask with its status, its completion requirement, and the evidence recorded when it was completed or the reason it was skipped.
- The auditor treats confirmed completion requirements (the goal's and each task's) as the checklist. The objective remains context: a gap outside the confirmed requirements still leads to disapproval when it is material to the objective, but is not a reason on its own to invent new criteria each attempt.
- When the previous audit of the same goal disapproved, the next audit receives that report and checks each finding: fixed, still open, or no longer applicable. New findings are still allowed when they are material.
- Users can tell the auditor where the work lives and how to verify it:
  - **Auditor workspaces**: additional directories, such as a second repository, that the auditor may inspect.
  - **Auditor environment**: plain-text instructions for running verification, such as "builds and tests run in WSL: `wsl -e bash -lc '…'`".
  Both are shown to the auditor as inspection guidance. They never count as evidence.

The executor's completion claim stays untrusted, and the auditor still inspects real artifacts before approving. These changes do not make approval easier for incomplete work.

## Out of scope

A drafting-time warning when the objective states requirements that no task requirement covers. Deferred until the changes above have been used.
