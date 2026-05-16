import Database from 'better-sqlite3';
import { homedir } from 'node:os';
import { join } from 'node:path';

const db = new Database(join(homedir(), '.brain', 'brain.db'));
const stale = db.prepare("SELECT id, content FROM facts WHERE TRIM(content) = ''").all();
console.log('stale rows:', JSON.stringify(stale));
const info = db.prepare("DELETE FROM facts WHERE TRIM(content) = ''").run();
console.log('deleted:', info.changes);
db.prepare('DELETE FROM facts_fts WHERE rowid NOT IN (SELECT id FROM facts)').run();
db.close();
