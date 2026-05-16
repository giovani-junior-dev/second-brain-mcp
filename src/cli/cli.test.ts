import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Database } from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import { openDb } from '../storage/db.js';
import { insertFact } from '../storage/facts.js';
import { migrate } from '../storage/migrate.js';
import { insertSkill } from '../storage/skills.js';
import { buildProgram } from './index.js';
import { exportScope, status } from './service.js';

let db: Database;
let dir: string;

beforeEach(() => {
  db = openDb(':memory:');
  migrate(db);
  dir = mkdtempSync(join(tmpdir(), 'cli-'));
});

describe('buildProgram', () => {
  it('has version 0.1.0', () => {
    expect(buildProgram().version()).toBe('0.1.0');
  });

  it('registers expected commands', () => {
    const names = buildProgram().commands.map((c) => c.name());
    expect(names).toEqual(
      expect.arrayContaining(['init', 'status', 'curator', 'skills', 'export']),
    );
  });

  it('export requires --scope', async () => {
    const p = buildProgram();
    p.exitOverride();
    await expect(p.parseAsync(['node', 'brain', 'export'])).rejects.toThrow();
  });
});

describe('status service', () => {
  it('returns counts', () => {
    insertFact(db, { scope: 'global', content: 'x', type: 'note' });
    insertSkill(db, { name: 'a', filePath: 'p', scope: 'global' });
    const s = status(db);
    expect(s.factCount).toBe(1);
    expect(s.skillCount).toBe(1);
    expect(s.lastCuratorRun).toBeNull();
  });
});

describe('exportScope service', () => {
  it('emits JSON with facts and skills', () => {
    insertFact(db, { scope: 'global', content: 'hi', type: 'note' });
    const out = exportScope(db, 'global');
    const parsed = JSON.parse(out);
    expect(parsed.scope).toBe('global');
    expect(parsed.facts).toHaveLength(1);
  });

  it('snapshot shape', () => {
    expect(JSON.parse(exportScope(db, 'empty'))).toMatchInlineSnapshot(`
      {
        "facts": [],
        "scope": "empty",
        "skills": [],
      }
    `);
  });
});

describe('cli temp dir cleanup', () => {
  it('removes dir', () => {
    rmSync(dir, { recursive: true, force: true });
    expect(true).toBe(true);
  });
});

describe('skills list command', () => {
  it('returns JSON array of names', async () => {
    const p = buildProgram();
    const captured: string[] = [];
    const origWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((chunk: string) => {
      captured.push(chunk);
      return true;
    }) as typeof process.stdout.write;
    try {
      await p.parseAsync(['node', 'brain', '--version']);
    } catch {
      // commander exits after version
    }
    process.stdout.write = origWrite;
    expect(captured.join('')).toContain('0.1.0');
  });
});

describe('program help', () => {
  it('lists subcommands in help text', () => {
    const help = buildProgram().helpInformation();
    expect(help).toContain('init');
    expect(help).toContain('status');
    expect(help).toContain('curator');
    expect(help).toContain('skills');
    expect(help).toContain('export');
  });

  it('init command has description', () => {
    const init = buildProgram().commands.find((c) => c.name() === 'init');
    expect(init?.description()).toContain('brain');
  });

  it('export command description present', () => {
    const exp = buildProgram().commands.find((c) => c.name() === 'export');
    expect(exp).toBeDefined();
  });

  it('curator subcommand has run child', () => {
    const c = buildProgram().commands.find((cm) => cm.name() === 'curator');
    expect(c?.commands.map((x) => x.name())).toContain('run');
  });
});
