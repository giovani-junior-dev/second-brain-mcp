import Database from 'better-sqlite3';
import { homedir } from 'node:os';
import { join } from 'node:path';

const db = new Database(join(homedir(), '.brain', 'brain.db'));

const messages = [
  ['s1', 'sempre uso TDD red-green-refactor antes de codar'],
  ['s2', 'TDD red-green-refactor é minha pratica diaria'],
  ['s3', 'prefiro TDD red-green-refactor a code-first'],
  ['s4', 'antes de commit rodo npm test sempre'],
  ['s5', 'rodo npm test antes de commitar'],
  ['s6', 'executar npm test antes do commit obrigatorio'],
];

const stmt = db.prepare(
  'INSERT INTO messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)',
);
const fts = db.prepare('INSERT INTO messages_fts (rowid, content) VALUES (?, ?)');
const now = Date.now();

for (const [sid, content] of messages) {
  const info = stmt.run(sid, 'user', content, now);
  fts.run(Number(info.lastInsertRowid), content);
}

console.log(`Seeded ${messages.length} messages across ${new Set(messages.map((m) => m[0])).size} sessions`);
console.log('Run: node dist/cli/index.js curator run');
db.close();
