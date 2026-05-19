export const SCHEMA_DDL = `
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY,
  session_id TEXT NOT NULL,
  project TEXT,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  content_hash TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_content_hash ON messages(content_hash) WHERE content_hash IS NOT NULL;

CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(content, content=messages);

CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts_trigram USING fts5(content, tokenize='trigram');

CREATE TABLE IF NOT EXISTS facts (
  id INTEGER PRIMARY KEY,
  scope TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  source_session TEXT,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER,
  pinned INTEGER DEFAULT 0,
  archived INTEGER DEFAULT 0
);

CREATE VIRTUAL TABLE IF NOT EXISTS facts_fts USING fts5(content, content=facts);

CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  scope TEXT NOT NULL,
  use_count INTEGER DEFAULT 0,
  last_used_at INTEGER,
  pinned INTEGER DEFAULT 0,
  archived INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS curator_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;
