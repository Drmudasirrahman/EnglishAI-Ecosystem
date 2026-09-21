import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import * as z from 'zod/v4';

const PORT = Number(process.env.PORT ?? 8787);
const ALLOWED_ORIGIN = process.env.WEB_ORIGIN ?? 'https://englishai-ecosystem-live.onrender.com';

const capabilityConfig = {
  'english-content': { script: 'mcp-servers/english-content/src/index.ts', tools: ['search_content', 'fetch_source'] },
  grammar: { script: 'mcp-servers/grammar/src/index.ts', tools: ['explain_grammar', 'analyze_grammar', 'generate_practice'] },
  vocabulary: { script: 'mcp-servers/vocabulary/src/index.ts', tools: ['lookup_word', 'analyze_vocabulary', 'generate_vocab_practice'] },
  reading: { script: 'mcp-servers/reading/src/index.ts', tools: ['explain_reading', 'find_evidence', 'create_questions'] },
  writing: { script: 'mcp-servers/writing/src/index.ts', tools: ['analyze_writing', 'suggest_revision', 'score_rubric'] },
  assessment: { script: 'mcp-servers/assessment/src/index.ts', tools: ['create_assessment', 'validate_answer', 'record_attempt'] },
  citation: { script: 'mcp-servers/citation/src/index.ts', tools: ['validate_citation', 'build_evidence_bundle', 'format_citation'] }
} as const;

type Capability = keyof typeof capabilityConfig;
const clients = new Map<Capability, { client: Client; transport: StdioClientTransport }>();
const pendingClients = new Map<Capability, Promise<Client>>();

async function getClient(capability: Capability) {
  const existing = clients.get(capability);
  if (existing) return existing.client;

  const pending = pendingClients.get(capability);
  if (pending) return pending;

  const config = capabilityConfig[capability];
  const connection = (async () => {
    const client = new Client({ name: 'englishai-mcp-gateway', version: '1.0.0' });
    const transport = new StdioClientTransport({ command: 'npx', args: ['tsx', config.script] });
    try {
      await client.connect(transport);
      clients.set(capability, { client, transport });
      return client;
    } finally {
      pendingClients.delete(capability);
    }
  })();

  pendingClients.set(capability, connection);
  return connection;
}

async function callCapability(capability: Capability, tool: string, args: Record<string, unknown>) {
  const config = capabilityConfig[capability];
  if (!config.tools.includes(tool as never)) throw new Error(`Tool '${tool}' is not allowed for capability '${capability}'.`);
  const client = await getClient(capability);
  return client.callTool({ name: tool, arguments: args });
}

function buildServer() {
  const server = new McpServer(
    { name: 'englishai-mcp-gateway', version: '1.0.0' },
    { instructions: 'Use call_capability to invoke one of the approved English-learning MCP capability servers. Never invent capability names or tool names.' }
  );

  server.registerTool(
    'list_capabilities',
    { description: 'List the approved EnglishAI MCP capability servers and their exposed tools.' },
    async () => ({ content: [{ type: 'text', text: JSON.stringify(capabilityConfig) }] })
  );

  server.registerTool(
    'call_capability',
    {
      description: 'Execute one approved tool through the EnglishAI MCP capability gateway.',
      inputSchema: z.object({
        capability: z.enum(['english-content', 'grammar', 'vocabulary', 'reading', 'writing', 'assessment', 'citation']),
        tool: z.string().min(1),
        arguments: z.record(z.string(), z.unknown()).default({})
      })
    },
    async ({ capability, tool, arguments: args }) => {
      const result = await callCapability(capability, tool, args);
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    }
  );

  return server;
}

const handler = createMcpHandler(() => buildServer(), { responseMode: 'json' });

function send(res: any, response: Response) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  if (!response.body) { res.end(); return; }
  const reader = response.body.getReader();
  const pump = async () => {
    const { done, value } = await reader.read();
    if (done) { res.end(); return; }
    res.write(Buffer.from(value));
    await pump();
  };
  void pump().catch(() => res.end());
}

createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && origin !== ALLOWED_ORIGIN) { res.writeHead(403); res.end('Forbidden origin'); return; }
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, accept');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  if (url.pathname === '/healthz') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, service: 'englishai-mcp-gateway', capabilities: Object.keys(capabilityConfig) }));
    return;
  }
  if (url.pathname !== '/mcp') { res.writeHead(404); res.end('Not found'); return; }

  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const body = Buffer.concat(chunks);
  const request = new Request(`https://${req.headers.host ?? 'localhost'}${url.pathname}${url.search}`, {
    method: req.method,
    headers: Object.entries(req.headers).flatMap(([key, value]) => value ? [[key, Array.isArray(value) ? value.join(', ') : value]] : []),
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body
  });
  const response = await handler.fetch(request);
  send(res, response);
}).listen(PORT, '0.0.0.0', () => {
  console.log(`EnglishAI MCP gateway listening on ${PORT}`);
});

process.on('SIGTERM', async () => {
  await handler.close();
  for (const { client } of clients.values()) await client.close();
  process.exit(0);
});

export { handler, capabilityConfig, callCapability, randomUUID };
