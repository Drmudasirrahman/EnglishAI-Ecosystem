import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { capabilityConfig } from '../../mcp-gateway/src/index.js';

const expectedTools = {
  'english-content': ['search_content', 'fetch_source'],
  grammar: ['explain_grammar', 'analyze_grammar', 'generate_practice'],
  vocabulary: ['lookup_word', 'analyze_vocabulary', 'generate_vocab_practice'],
  reading: ['explain_reading', 'find_evidence', 'create_questions'],
  writing: ['analyze_writing', 'suggest_revision', 'score_rubric'],
  assessment: ['create_assessment', 'validate_answer', 'record_attempt'],
  citation: ['validate_citation', 'build_evidence_bundle', 'format_citation']
} as const;

describe('MCP gateway capability registry', () => {
  it('exposes every approved capability', () => {
    expect(Object.keys(capabilityConfig).sort()).toEqual(Object.keys(expectedTools).sort());
  });

  it('exposes the complete tool set for every capability', () => {
    for (const [capability, tools] of Object.entries(expectedTools)) {
      expect([...capabilityConfig[capability as keyof typeof capabilityConfig].tools]).toEqual([...tools]);
    }
  });

  it('contains no duplicate exposed tools within a capability', () => {
    for (const config of Object.values(capabilityConfig)) {
      expect(new Set(config.tools).size).toBe(config.tools.length);
    }
  });

  it('uses source scripts under the MCP server tree', () => {
    for (const config of Object.values(capabilityConfig)) {
      expect(config.script).toMatch(/^mcp-servers\/[^/]+\/src\/index\.ts$/);
    }
  });

  it('points every capability to an existing MCP server entry point', () => {
    for (const config of Object.values(capabilityConfig)) {
      expect(existsSync(config.script)).toBe(true);
    }
  });
});
