import type { Database } from 'better-sqlite3';

export type MessageInput = {
  sessionId: string;
  project?: string;
  role: string;
  content: string;
};

export type MessageRow = {
  id: number;
  session_id: string;
  project: string | null;
  role: string;
  content: string;
  created_at: number;
};

export function insertMessage(db: Database, msg: MessageInput): number {
  const now = Date.now();
  const stmt = db.prepare(
    'INSERT INTO messages (session_id, project, role, content, created_at) VALUES (?, ?, ?, ?, ?)',
  );
  const info = stmt.run(msg.sessionId, msg.project ?? null, msg.role, msg.content, now);
  const id = Number(info.lastInsertRowid);
  db.prepare('INSERT INTO messages_fts (rowid, content) VALUES (?, ?)').run(id, msg.content);
  return id;
}

export function searchMessages(db: Database, query: string, limit: number): MessageRow[] {
  const sql =
    'SELECT m.* FROM messages_fts JOIN messages m ON m.id = messages_fts.rowid ' +
    'WHERE messages_fts MATCH ? ORDER BY rank LIMIT ?';
  return db.prepare(sql).all(query, limit) as MessageRow[];
}
