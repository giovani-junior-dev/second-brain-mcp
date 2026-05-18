import type { Database } from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import { openDb } from './db.js';
import {
  archiveFact,
  getFactById,
  insertFact,
  listFacts,
  searchFacts,
  searchFactsInScope,
} from './facts.js';
import { migrate } from './migrate.js';

let db: Database;

beforeEach(() => {
  db = openDb(':memory:');
  migrate(db);
});

describe('insertFact', () => {
  it('persists fact with created_at', () => {
    const id = insertFact(db, {
      scope: 'global',
      content: 'user likes dark mode',
      type: 'preference',
    });
    const row = getFactById(db, id);
    expect(row?.content).toBe('user likes dark mode');
    expect(row?.created_at).toBeGreaterThan(0);
  });

  it('returns numeric id', () => {
    const id = insertFact(db, { scope: 'global', content: 'x', type: 'note' });
    expect(typeof id).toBe('number');
  });
});

describe('searchFacts', () => {
  it('returns matching facts via FTS5', () => {
    insertFact(db, { scope: 'global', content: 'TypeScript strict mode', type: 'note' });
    insertFact(db, { scope: 'global', content: 'Python dynamic typing', type: 'note' });
    const results = searchFacts(db, 'typescript', 5);
    expect(results).toHaveLength(1);
    expect(results[0]?.content).toContain('TypeScript');
  });

  it('respects limit param', () => {
    for (let i = 0; i < 6; i++) {
      insertFact(db, { scope: 'global', content: `node ${i}`, type: 'note' });
    }
    expect(searchFacts(db, 'node', 3)).toHaveLength(3);
  });

  it('excludes archived facts', () => {
    const id = insertFact(db, { scope: 'global', content: 'archived stuff', type: 'note' });
    archiveFact(db, id);
    expect(searchFacts(db, 'archived', 5)).toHaveLength(0);
  });

  it('returns empty when no match', () => {
    expect(searchFacts(db, 'nothing', 5)).toEqual([]);
  });
});

describe('archiveFact', () => {
  it('sets archived=1', () => {
    const id = insertFact(db, { scope: 'global', content: 'x', type: 'note' });
    archiveFact(db, id);
    expect(getFactById(db, id)?.archived).toBe(1);
  });
});

describe('searchFactsInScope', () => {
  it('filters by scope at SQL level before LIMIT', () => {
    for (let i = 0; i < 10; i++) {
      insertFact(db, { scope: 'global', content: `agent task ${i}`, type: 'note' });
    }
    insertFact(db, { scope: 'project:x', content: 'agent project unique', type: 'note' });
    const rows = searchFactsInScope(db, '"agent"', 'project:x', 5);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.content).toBe('agent project unique');
  });

  it('returns empty when scope has no matches', () => {
    insertFact(db, { scope: 'global', content: 'only global', type: 'note' });
    expect(searchFactsInScope(db, '"global"', 'project:missing', 5)).toHaveLength(0);
  });

  it('excludes archived', () => {
    const id = insertFact(db, { scope: 'global', content: 'hello', type: 'note' });
    archiveFact(db, id);
    expect(searchFactsInScope(db, '"hello"', 'global', 5)).toHaveLength(0);
  });
});

describe('listFacts', () => {
  it('filters by scope, excludes archived', () => {
    insertFact(db, { scope: 'global', content: 'a', type: 'note' });
    insertFact(db, { scope: 'project:x', content: 'b', type: 'note' });
    const archivedId = insertFact(db, { scope: 'global', content: 'c', type: 'note' });
    archiveFact(db, archivedId);
    const rows = listFacts(db, 'global');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.content).toBe('a');
  });
});
