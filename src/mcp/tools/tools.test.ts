import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Database } from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import { openDb } from '../../storage/db.js';
import { insertFact } from '../../storage/facts.js';
import { insertMessage } from '../../storage/messages.js';
import { migrate } from '../../storage/migrate.js';
import { insertSkill } from '../../storage/skills.js';
import { listSkillsTool } from './list-skills.js';
import { recall } from './recall.js';
import { sessionSearch } from './session-search.js';
import { skillInvoke } from './skill-invoke.js';
import { write } from './write.js';

let db: Database;

beforeEach(() => {
  db = openDb(':memory:');
  migrate(db);
});

describe('recall tool', () => {
  it('returns brain-context fence with matches', () => {
    insertFact(db, { scope: 'global', content: 'typescript strict', type: 'note' });
    const out = recall(db, { query: 'typescript' });
    expect(out.content).toContain('<brain-context>');
    expect(out.content).toContain('typescript strict');
  });

  it('filters by scope when provided', () => {
    insertFact(db, { scope: 'project:x', content: 'project specific', type: 'note' });
    insertFact(db, { scope: 'global', content: 'specific global', type: 'note' });
    const out = recall(db, { query: 'specific', scope: 'project:x' });
    expect(out.content).toContain('project specific');
    expect(out.content).not.toContain('specific global');
  });

  it('scope filter works even when many global matches saturate FTS top-N', () => {
    for (let i = 0; i < 20; i++) {
      insertFact(db, { scope: 'global', content: `agent global ${i}`, type: 'note' });
    }
    insertFact(db, { scope: 'project:x', content: 'agent project hidden', type: 'note' });
    const out = recall(db, { query: 'agent', scope: 'project:x', limit: 5 });
    expect(out.content).toContain('agent project hidden');
  });

  it('rejects empty query', () => {
    expect(() => recall(db, { query: '' })).toThrow();
  });
});

describe('write tool', () => {
  it('persists and returns id+status', () => {
    const out = write(db, { content: 'hello', type: 'note' });
    expect(out.status).toBe('ok');
    expect(out.id).toBeGreaterThan(0);
  });

  it('uses default scope when missing', () => {
    const out = write(db, { content: 'x', type: 'pref' });
    expect(out.id).toBeGreaterThan(0);
  });

  it('rejects invalid', () => {
    expect(() => write(db, { content: 'x' })).toThrow();
  });
});

describe('list_skills tool', () => {
  it('returns skills array', () => {
    insertSkill(db, { name: 'tdd', filePath: 'a.md', scope: 'global', description: 'd' });
    const out = listSkillsTool(db, {});
    expect(out.skills).toHaveLength(1);
    expect(out.skills[0]?.name).toBe('tdd');
  });

  it('filters by scope', () => {
    insertSkill(db, { name: 'a', filePath: 'a', scope: 'global' });
    insertSkill(db, { name: 'b', filePath: 'b', scope: 'project:x' });
    expect(listSkillsTool(db, { scope: 'project:x' }).skills).toHaveLength(1);
  });
});

describe('skill_invoke tool', () => {
  it('reads file content', () => {
    const path = join(tmpdir(), `skill-${Date.now()}.md`);
    writeFileSync(path, '# Test Skill\nbody');
    insertSkill(db, { name: 'test', filePath: path, scope: 'global' });
    const out = skillInvoke(db, { name: 'test' });
    expect(out.content).toContain('Test Skill');
  });

  it('throws when skill missing', () => {
    expect(() => skillInvoke(db, { name: 'nope' })).toThrow(/not found/);
  });
});

describe('session_search tool', () => {
  it('returns fenced matches', () => {
    insertMessage(db, { sessionId: 's1', role: 'user', content: 'sqlite migration step' });
    const out = sessionSearch(db, { query: 'sqlite' });
    expect(out.content).toContain('<brain-context>');
    expect(out.content).toContain('sqlite');
  });

  it('returns empty fence when no match', () => {
    const out = sessionSearch(db, { query: 'nothing' });
    expect(out.content).toMatch(/<brain-context>[\s\S]*<\/brain-context>/);
  });
});
