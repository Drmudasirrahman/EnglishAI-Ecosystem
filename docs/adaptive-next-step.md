# Adaptive next-step decision policy

`recommendNextStep` converts learner performance signals into a small, explainable recommendation for the next activity.

## Inputs

Each skill signal can include all-time attempts/correct answers and an optional recent window. Recent performance is weighted at 65%; the aggregate history contributes 35%. This prevents a learner's older success from hiding a current difficulty while still preserving evidence from the broader learning history.

## Outputs

- **support / difficulty 1**: blended accuracy below 50%; reinforce the skill with scaffolding and feedback.
- **practice / difficulty 2**: blended accuracy from 50% through 79%; continue varied practice.
- **challenge / difficulty 3**: blended accuracy at or above 80%; introduce more demanding tasks.

The recommendation is deterministic, typed, and fail-safe: when no evidence exists, the preferred skill (or Grammar) starts at supported practice. A preferred skill is used when present; otherwise, the skill with the greatest evidence-based need is selected.

This module is intentionally independent of the browser HMI and MCP transport. It can be reused by the learner client, a future learner-state service, or a gateway orchestration layer without changing the decision policy.
