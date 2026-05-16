import type { Database } from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import { createServer } from '../mcp/server.js';
import { openDb } from '../storage/db.js';
import { insertFact } from '../storage/facts.js';
import { migrate } from '../storage/migrate.js';

let db: Database;

beforeEach(() => {
  db = openDb(':memory:');
  migrate(db);
});

describe('MCP server integration', () => {
  it('createServer registers tools without throwing', () => {
    insertFact(db, { scope: 'global', content: 'integration fact', type: 'note' });
    const server = createServer(db);
    expect(server).toBeDefined();
  });

  it('end-to-end recall via tool fn returns brain-context fence', async () => {
    insertFact(db, { scope: 'global', content: 'e2e content', type: 'note' });
    const { recall } = await import('../mcp/tools/recall.js');
    const out = recall(db, { query: 'e2e' });
    expect(out.content).toMatch(/<brain-context>[\s\S]*<\/brain-context>/);
    expect(out.content).toContain('e2e content');
  });

  it('write→recall roundtrip end-to-end', async () => {
    const { write } = await import('../mcp/tools/write.js');
    const { recall } = await import('../mcp/tools/recall.js');
    const w = write(db, { content: 'persistent thought', type: 'note', scope: 'global' });
    expect(w.status).toBe('ok');
    const r = recall(db, { query: 'persistent' });
    expect(r.content).toContain('persistent thought');
  });
});
