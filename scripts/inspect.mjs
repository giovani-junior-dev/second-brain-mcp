import Database from 'better-sqlite3';
import { homedir } from 'node:os';
import { join } from 'node:path';

const db = new Database(join(homedir(), '.brain', 'brain.db'));

console.log('==MESSAGES BY SESSION==');
for (const r of db
  .prepare('SELECT session_id, COUNT(*) c FROM messages GROUP BY session_id ORDER BY c DESC')
  .all()) {
  const sample = db
    .prepare('SELECT content FROM messages WHERE session_id = ? LIMIT 1')
    .get(r.session_id);
  console.log(`  ${r.session_id} (${r.c}): ${sample.content.slice(0, 60)}`);
}

console.log('\n==FTS5 MATCH TDD==');
const fts = db
  .prepare(
    'SELECT DISTINCT m.session_id FROM messages_fts JOIN messages m ON m.id = messages_fts.rowid WHERE messages_fts MATCH ?',
  )
  .all('"tdd"');
console.log('  sessions with TDD:', fts.map((r) => r.session_id).join(', '));

console.log('\n==FACTS==');
for (const r of db
  .prepare('SELECT id, type, scope, content FROM facts WHERE archived=0 ORDER BY id DESC LIMIT 15')
  .all()) {
  console.log(`  ${r.id} [${r.type}@${r.scope}] ${r.content.slice(0, 80)}`);
}

console.log('\n==SKILLS==');
for (const r of db.prepare('SELECT id, name, description FROM skills WHERE archived=0').all()) {
  console.log(`  ${r.id} ${r.name}: ${r.description}`);
}

db.close();
