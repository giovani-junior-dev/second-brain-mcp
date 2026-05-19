import { createHash } from 'node:crypto';
import type { Database } from 'better-sqlite3';
import { type IndexedMessage, parseJsonl } from './jsonl.js';
import { scanJsonl } from './scan.js';

export type IndexOptions = {
  projects?: string[];
  since?: number;
};

export type IndexSummary = {
  sessionsProcessed: number;
  sessionsIndexed: number;
  sessionsSkipped: number;
  messagesIndexed: number;
  projectsIndexed: string[];
};

function hashMessage(m: IndexedMessage): string {
  return createHash('sha1').update(`${m.sessionId}:${m.uuid}`).digest('hex');
}

function alreadyIndexed(db: Database, hash: string): boolean {
  const row = db.prepare('SELECT 1 FROM messages WHERE content_hash = ? LIMIT 1').get(hash) as
    | { 1: number }
    | undefined;
  return Boolean(row);
}

function insertOne(db: Database, m: IndexedMessage, hash: string, ts: number): number {
  const info = db
    .prepare(
      'INSERT INTO messages (session_id, project, role, content, created_at, content_hash) VALUES (?,?,?,?,?,?)',
    )
    .run(m.sessionId, m.project, m.role, m.content, ts, hash);
  const id = Number(info.lastInsertRowid);
  db.prepare('INSERT INTO messages_fts (rowid, content) VALUES (?, ?)').run(id, m.content);
  return id;
}

function shouldKeep(m: IndexedMessage, opts: IndexOptions): boolean {
  if (opts.projects && opts.projects.length > 0 && !opts.projects.includes(m.project)) return false;
  if (opts.since && m.timestamp) {
    const ts = Date.parse(m.timestamp);
    if (Number.isFinite(ts) && ts < opts.since) return false;
  }
  return true;
}

function indexFile(
  db: Database,
  file: string,
  opts: IndexOptions,
  projects: Set<string>,
): { kept: boolean; messages: number } {
  const parsed = parseJsonl(file);
  let inserted = 0;
  for (const m of parsed) {
    if (!shouldKeep(m, opts)) continue;
    const hash = hashMessage(m);
    if (alreadyIndexed(db, hash)) continue;
    const ts = Date.parse(m.timestamp) || Date.now();
    insertOne(db, m, hash, ts);
    projects.add(m.project);
    inserted++;
  }
  return { kept: inserted > 0, messages: inserted };
}

export function runIndexer(db: Database, rootDir: string, opts: IndexOptions = {}): IndexSummary {
  const files = scanJsonl(rootDir);
  const projects = new Set<string>();
  let indexed = 0;
  let skipped = 0;
  let messages = 0;
  for (const file of files) {
    const r = indexFile(db, file, opts, projects);
    if (r.kept) indexed++;
    else skipped++;
    messages += r.messages;
  }
  return {
    sessionsProcessed: files.length,
    sessionsIndexed: indexed,
    sessionsSkipped: skipped,
    messagesIndexed: messages,
    projectsIndexed: [...projects].sort(),
  };
}
