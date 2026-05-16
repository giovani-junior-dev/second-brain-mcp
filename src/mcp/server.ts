import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { Database } from 'better-sqlite3';
import { z } from 'zod';
import { insertMessage } from '../storage/messages.js';
import { type LogEntry, createLogger } from './logger.js';
import { listSkillsTool } from './tools/list-skills.js';
import { recall } from './tools/recall.js';
import { sessionSearch } from './tools/session-search.js';
import { skillInvoke } from './tools/skill-invoke.js';
import { write } from './tools/write.js';

const READONLY_TOOLS = new Set(['brain.list_skills', 'brain.session_search']);

function captureMessage(db: Database, sessionId: string, tool: string, input: unknown): void {
  try {
    if (READONLY_TOOLS.has(tool)) return;
    const content =
      tool === 'brain.write' && typeof (input as { content?: unknown })?.content === 'string'
        ? `${tool}: ${(input as { content: string }).content}`
        : `${tool}: ${JSON.stringify(input)}`;
    insertMessage(db, { sessionId, role: 'tool', content });
  } catch {
    // capture must not break tool
  }
}

type Json = { content: { type: 'text'; text: string }[] };

function asJson(payload: unknown): Json {
  return { content: [{ type: 'text', text: JSON.stringify(payload) }] };
}

function traced<T>(
  db: Database,
  sessionId: string,
  log: (e: LogEntry) => void,
  tool: string,
  input: unknown,
  fn: () => T,
): T {
  try {
    const out = fn();
    captureMessage(db, sessionId, tool, input);
    log({ ts: new Date().toISOString(), tool, input, ok: true });
    return out;
  } catch (err) {
    log({
      ts: new Date().toISOString(),
      tool,
      input,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

export function createServer(db: Database, logPath?: string): McpServer {
  const server = new McpServer({ name: 'second-brain-mcp', version: '0.1.0' });
  const log = createLogger(
    logPath ?? `${process.env.USERPROFILE ?? process.env.HOME ?? '.'}/.brain/mcp.log`,
  );
  const sessionId = process.env.BRAIN_SESSION_ID ?? randomUUID();

  server.registerTool(
    'brain.recall',
    {
      description: 'Recall facts via FTS5 BM25, wrapped in <brain-context>',
      inputSchema: {
        query: z.string().min(1),
        scope: z.string().optional(),
        limit: z.number().int().min(1).max(50).optional(),
      },
    },
    async (args) =>
      asJson(traced(db, sessionId, log, 'brain.recall', args, () => recall(db, args))),
  );

  server.registerTool(
    'brain.write',
    {
      description: 'Persist fact to storage',
      inputSchema: {
        content: z.string().min(1),
        type: z.string().min(1),
        scope: z.string().optional(),
      },
    },
    async (args) => asJson(traced(db, sessionId, log, 'brain.write', args, () => write(db, args))),
  );

  server.registerTool(
    'brain.list_skills',
    {
      description: 'List skills in scope',
      inputSchema: { scope: z.string().optional() },
    },
    async (args) =>
      asJson(traced(db, sessionId, log, 'brain.list_skills', args, () => listSkillsTool(db, args))),
  );

  server.registerTool(
    'brain.skill_invoke',
    {
      description: 'Read skill SKILL.md content',
      inputSchema: { name: z.string().min(1) },
    },
    async (args) =>
      asJson(traced(db, sessionId, log, 'brain.skill_invoke', args, () => skillInvoke(db, args))),
  );

  server.registerTool(
    'brain.session_search',
    {
      description: 'Search past messages, wrapped in <brain-context>',
      inputSchema: {
        query: z.string().min(1),
        limit: z.number().int().min(1).max(50).optional(),
      },
    },
    async (args) =>
      asJson(
        traced(db, sessionId, log, 'brain.session_search', args, () => sessionSearch(db, args)),
      ),
  );

  return server;
}

export async function startStdio(db: Database): Promise<void> {
  const server = createServer(db);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
