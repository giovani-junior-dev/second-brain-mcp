import type { Database } from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import { openDb } from '../storage/db.js';
import { listFacts } from '../storage/facts.js';
import { insertMessage } from '../storage/messages.js';
import { migrate } from '../storage/migrate.js';
import { promotePatterns } from './promote.js';

let db: Database;

beforeEach(() => {
  db = openDb(':memory:');
  migrate(db);
});

describe('promotePatterns', () => {
  it('promotes pattern repeating across >=3 sessions', () => {
    for (const s of ['s1', 's2', 's3']) {
      insertMessage(db, { sessionId: s, role: 'user', content: 'I always use TDD here' });
    }
    const ids = promotePatterns(db, [{ pattern: 'TDD', kind: 'preference' }]);
    expect(ids).toHaveLength(1);
    expect(listFacts(db, 'global')[0]?.content).toBe('TDD');
  });

  it('skips pattern repeating in <3 sessions', () => {
    insertMessage(db, { sessionId: 's1', role: 'user', content: 'maybe TDD' });
    insertMessage(db, { sessionId: 's2', role: 'user', content: 'TDD again' });
    const ids = promotePatterns(db, [{ pattern: 'TDD', kind: 'preference' }]);
    expect(ids).toHaveLength(0);
  });

  it('skips procedural patterns (handled by skill-gen)', () => {
    for (const s of ['s1', 's2', 's3']) {
      insertMessage(db, { sessionId: s, role: 'user', content: 'run npm test pattern X' });
    }
    const ids = promotePatterns(db, [{ pattern: 'pattern X', kind: 'procedural' }]);
    expect(ids).toHaveLength(0);
  });

  it('matches LLM-rewritten pattern via keyword extraction', () => {
    for (const s of ['s1', 's2', 's3']) {
      insertMessage(db, { sessionId: s, role: 'user', content: `sempre uso TDD em ${s}` });
    }
    const ids = promotePatterns(db, [
      { pattern: 'usa TDD como metodologia de desenvolvimento', kind: 'preference' },
    ]);
    expect(ids).toHaveLength(1);
  });

  it('ignores stopwords-only patterns', () => {
    for (const s of ['s1', 's2', 's3']) {
      insertMessage(db, { sessionId: s, role: 'user', content: 'algo aqui' });
    }
    const ids = promotePatterns(db, [{ pattern: 'sempre como para que', kind: 'preference' }]);
    expect(ids).toHaveLength(0);
  });

  it('safely handles patterns with special FTS characters', () => {
    for (const s of ['s1', 's2', 's3']) {
      insertMessage(db, { sessionId: s, role: 'user', content: 'config strict mode habilitado' });
    }
    const ids = promotePatterns(db, [
      { pattern: 'config: strict-mode (habilitado!)', kind: 'fact' },
    ]);
    expect(ids).toHaveLength(1);
  });
});
