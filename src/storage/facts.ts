import type { Database } from 'better-sqlite3';

export type FactInput = {
  scope: string;
  content: string;
  type: string;
  sourceSession?: string;
};

export type FactRow = {
  id: number;
  scope: string;
  content: string;
  type: string;
  source_session: string | null;
  created_at: number;
  last_used_at: number | null;
  pinned: number;
  archived: number;
};

export function insertFact(db: Database, fact: FactInput): number {
  const now = Date.now();
  const stmt = db.prepare(
    'INSERT INTO facts (scope, content, type, source_session, created_at) VALUES (?, ?, ?, ?, ?)',
  );
  const info = stmt.run(fact.scope, fact.content, fact.type, fact.sourceSession ?? null, now);
  const id = Number(info.lastInsertRowid);
  db.prepare('INSERT INTO facts_fts (rowid, content) VALUES (?, ?)').run(id, fact.content);
  return id;
}

export function getFactById(db: Database, id: number): FactRow | undefined {
  return db.prepare('SELECT * FROM facts WHERE id = ?').get(id) as FactRow | undefined;
}

export function searchFacts(db: Database, query: string, limit: number): FactRow[] {
  const sql =
    'SELECT f.* FROM facts_fts JOIN facts f ON f.id = facts_fts.rowid ' +
    'WHERE facts_fts MATCH ? AND f.archived = 0 ORDER BY rank LIMIT ?';
  return db.prepare(sql).all(query, limit) as FactRow[];
}

export function archiveFact(db: Database, id: number): void {
  db.prepare('UPDATE facts SET archived = 1 WHERE id = ?').run(id);
}

export function listFacts(db: Database, scope: string): FactRow[] {
  return db
    .prepare('SELECT * FROM facts WHERE scope = ? AND archived = 0 ORDER BY created_at DESC')
    .all(scope) as FactRow[];
}
