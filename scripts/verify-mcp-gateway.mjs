import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { spawn } from 'node:child_process';

const port = 8799;
const capabilityConfig = {
  'english-content': { script: 'mcp-servers/english-content/src/index.ts', tools: ['search_content', 'fetch_source'] },
  grammar: { script: 'mcp-servers/grammar/src/index.ts', tools: ['explain_grammar', 'analyze_grammar', 'generate_practice'] },
  vocabulary: { script: 'mcp-servers/vocabulary/src/index.ts', tools: ['lookup_word', 'analyze_vocabulary', 'generate_vocab_practice'] },
  reading: { script: 'mcp-servers/reading/src/index.ts', tools: ['explain_reading', 'find_evidence', 'create_questions'] },
  writing: { script: 'mcp-servers/writing/src/index.ts', tools: ['analyze_writing', 'suggest_revision', 'score_rubric'] },
  assessment: { script: 'mcp-servers/assessment/src/index.ts', tools: ['create_assessment', 'validate_answer', 'record_attempt'] },
  citation: { script: 'mcp-servers/citation/src/index.ts', tools: ['validate_citation', 'build_evidence_bundle', 'format_citation'] }
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function verifyServer(name, config) {
  const client = new Client({ name: `englishai-ci-${name}`, version: '1.0.0' });
  const transport = new StdioClientTransport({ command: 'npx', args: ['tsx', config.script] });
  try {
    await client.connect(transport);
    const result = await client.listTools();
    const actual = (result.tools ?? []).map(tool => tool.name);
    for (const expected of config.tools) {
      if (!actual.includes(expected)) throw new Error(`${name}: missing tool '${expected}'`);
    }
    const duplicates = actual.filter((tool, index) => actual.indexOf(tool) !== index);
    if (duplicates.length) throw new Error(`${name}: duplicate tool(s): ${[...new Set(duplicates)].join(', ')}`);
    console.log(`MCP node verified: ${name} (${actual.length} tools)`);
  } finally {
    await client.close().catch(() => {});
    await transport.close().catch(() => {});
  }
}

let gateway;
try {
  for (const [name, config] of Object.entries(capabilityConfig)) await verifyServer(name, config);

  gateway = spawn(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'mcp-gateway/src/index.ts'], {
    env: { ...process.env, PORT: String(port), WEB_ORIGIN: 'http://localhost:3000' },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let ready = false;
  for (let i = 0; i < 40; i++) {
    try {
      const health = await fetch(`http://127.0.0.1:${port}/healthz`);
      if (health.ok) { ready = true; break; }
    } catch {}
    await sleep(250);
  }
  if (!ready) throw new Error('MCP gateway did not become ready');

  const common = { 'content-type': 'application/json', accept: 'application/json, text/event-stream' };
  const initialize = await fetch(`http://127.0.0.1:${port}/mcp`, {
    method: 'POST', headers: common,
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {
      protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'gateway-verifier', version: '1.0.0' }
    } })
  });
  if (!initialize.ok) throw new Error(`gateway initialize failed: ${initialize.status}`);

  const list = await fetch(`http://127.0.0.1:${port}/mcp`, {
    method: 'POST', headers: common,
    body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} })
  });
  if (!list.ok) throw new Error(`gateway tools/list failed: ${list.status}`);
  const listText = await list.text();
  for (const required of ['list_capabilities', 'call_capability']) {
    if (!listText.includes(required)) throw new Error(`gateway: missing tool '${required}'`);
  }

  console.log('MCP gateway verification passed: health, initialize and gateway tools/list.');
  console.log('All MCP nodes and gateway runtime checks passed.');
} finally {
  if (gateway) {
    gateway.kill('SIGTERM');
    await sleep(100);
    if (!gateway.killed) gateway.kill('SIGKILL');
  }
}
