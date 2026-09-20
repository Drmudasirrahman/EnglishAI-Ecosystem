import { describe, expect, it } from 'vitest';
import { callCapability } from '../../mcp-gateway/src/index.js';

describe('MCP gateway routing policy', () => {
  it('rejects tools that are not registered for a capability', async () => {
    await expect(
      callCapability('assessment', 'lookup_word', {})
    ).rejects.toThrow("Tool 'lookup_word' is not allowed for capability 'assessment'.");
  });

  it('rejects a tool before opening a capability client', async () => {
    await expect(
      callCapability('grammar', 'record_attempt', { answer: 'x' })
    ).rejects.toThrow("Tool 'record_attempt' is not allowed for capability 'grammar'.");
  });
});
