# Learner-state normalization

`tutor/learner-state.ts` is the shared boundary for learner records restored from browser storage, API payloads, or future MCP orchestration.

The normalizer is deliberately conservative:

- records without a non-empty `name` or supported `skill` are rejected;
- text fields are trimmed and receive stable defaults;
- `index` and `score` are constrained to non-negative integers;
- `difficulty` is constrained to the supported 1–3 range;
- `mcpOnline` is `true` only for the literal boolean `true`.

This keeps malformed persisted data from silently corrupting learner progress and gives the HMI/adaptive layer a predictable shape to consume.
