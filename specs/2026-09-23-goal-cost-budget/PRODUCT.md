# Per-goal estimated USD spending cap

## User outcome

`/goal --max-cost 5.00 <objective>` limits the *estimated USD cost attributable to that goal*, including guided drafting before confirmation, execution, and the independent completion auditor. It is opt-in and is not a GitHub billing-account limit. The existing token budget remains independent; whichever limit is reached first stops automatic goal work. The same option applies to `/goal-direct`, `/sisyphus`, and `/sisyphus-direct`. The model-facing `create_goal` tool accepts `max_cost_usd` only on explicit user instruction.

The cap and the cumulative estimated USD amount survive reloads and session changes. `/goal-status` and the dashboard identify the cap, current estimate, and whether the goal is cost-limited. `/goal-tweak` can raise or remove the limit without resetting usage. Guided confirmation must show both the proposed cap and previously incurred drafting cost. If drafting exhausts the cap before confirmation, drafting stops without creating a goal; the user can restart with a new limit.

## Semantics and limitations

* Use Pi's finalized `usage.cost.total` (USD), which accounts for input, output, cache reads and cache writes using the selected model's catalog rates, including long-context tiers. No duplicate pricing tables. Usage is an estimate, not a GitHub invoice or a spend-limit API.
* Count model usage attributable to the goal, including a draft's first assistant response and final proposal response, and all turns of the nested auditor, including failed and aborted audits. Attributing external extensions' background calls or user-initiated unrelated sessions is out of scope; list exclusions explicitly in the usage docs.
* Reject zero/negative, nonfinite or malformed amounts (allow decimal cents). A malformed option must not accidentally create an unlimited goal.
* Do not silently treat missing usage/pricing as free. Display an explicit warning and stop automated work if a priced goal uses a model without usable cost data.
* The cap is enforced at completed response boundaries. It can overshoot within one provider response, between concurrent sessions, or with nested/background usage; no promise of a strict hard cap.
* Preserve historical goals that lack cost fields. Do not silently attach a cap to existing goals.
