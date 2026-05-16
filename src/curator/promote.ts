import type { Database } from 'better-sqlite3';
import { insertFact } from '../storage/facts.js';
import { PATTERN_REPEAT_THRESHOLD } from './constants.js';
import type { Pattern } from './extractor.js';

const GLOBAL_SCOPE = 'global';
const MIN_KEYWORD_LEN = 3;
const MAX_KEYWORDS = 3;
const STOPWORDS = new Set([
  'usa',
  'use',
  'usar',
  'como',
  'para',
  'pra',
  'que',
  'com',
  'sem',
  'mais',
  'menos',
  'sempre',
  'nunca',
  'antes',
  'depois',
  'the',
  'and',
  'for',
  'with',
  'without',
  'always',
  'never',
  'before',
  'after',
]);

type SessionCount = { sessions: number };

function keywords(pattern: string): string[] {
  const words = pattern
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= MIN_KEYWORD_LEN && !STOPWORDS.has(w));
  const unique = Array.from(new Set(words));
  unique.sort((a, b) => b.length - a.length);
  return unique.slice(0, MAX_KEYWORDS);
}

function distinctSessionsForPattern(db: Database, pattern: string): number {
  const kws = keywords(pattern);
  if (kws.length === 0) return 0;
  const ftsQuery = kws.map((k) => `"${k}"`).join(' OR ');
  try {
    const row = db
      .prepare(
        'SELECT COUNT(DISTINCT m.session_id) AS sessions FROM messages_fts JOIN messages m ON m.id = messages_fts.rowid WHERE messages_fts MATCH ?',
      )
      .get(ftsQuery) as SessionCount | undefined;
    return row?.sessions ?? 0;
  } catch {
    return 0;
  }
}

export function promotePatterns(db: Database, patterns: Pattern[]): number[] {
  const promoted: number[] = [];
  for (const p of patterns) {
    if (p.kind === 'procedural') continue;
    const sessions = distinctSessionsForPattern(db, p.pattern);
    if (sessions < PATTERN_REPEAT_THRESHOLD) continue;
    const id = insertFact(db, { scope: GLOBAL_SCOPE, content: p.pattern, type: p.kind });
    promoted.push(id);
  }
  return promoted;
}
