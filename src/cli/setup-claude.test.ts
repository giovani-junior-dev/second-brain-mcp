import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runSetup } from './setup-claude.js';

let tmpHome: string;
let tmpSetup: string;

const BLOCK = `<!-- BEGIN: brain-memory -->\nbrain-memory bloco\n<!-- END: brain-memory -->`;
const SKILL = `---\nname: brain-memory\ndescription: test skill\n---\nbody`;

beforeEach(() => {
  tmpHome = mkdtempSync(join(tmpdir(), 'sc-home-'));
  tmpSetup = mkdtempSync(join(tmpdir(), 'sc-setup-'));
  writeFileSync(join(tmpSetup, 'CLAUDE_MD_BLOCK.md'), BLOCK);
  const skillDir = join(tmpSetup, 'skills', 'brain-memory');
  require('node:fs').mkdirSync(skillDir, { recursive: true });
  writeFileSync(join(skillDir, 'SKILL.md'), SKILL);
});

afterEach(() => {
  rmSync(tmpHome, { recursive: true, force: true });
  rmSync(tmpSetup, { recursive: true, force: true });
});

describe('runSetup', () => {
  it('copies SKILL.md to ~/.claude/skills/brain-memory/', () => {
    runSetup({ homeDir: tmpHome, setupDir: tmpSetup, serverScript: '/srv.js' });
    const skillOut = join(tmpHome, '.claude', 'skills', 'brain-memory', 'SKILL.md');
    expect(existsSync(skillOut)).toBe(true);
    expect(readFileSync(skillOut, 'utf8')).toBe(SKILL);
  });

  it('creates state flag when missing', () => {
    const r = runSetup({ homeDir: tmpHome, setupDir: tmpSetup, serverScript: '/srv.js' });
    expect(r.flagCreated).toBe(true);
    expect(
      existsSync(join(tmpHome, '.claude', 'skills', 'brain-memory', 'state', 'enabled.flag')),
    ).toBe(true);
  });

  it('does not recreate flag when present', () => {
    runSetup({ homeDir: tmpHome, setupDir: tmpSetup, serverScript: '/srv.js' });
    const second = runSetup({ homeDir: tmpHome, setupDir: tmpSetup, serverScript: '/srv.js' });
    expect(second.flagCreated).toBe(false);
  });

  it('creates CLAUDE.md with block when file missing', () => {
    runSetup({ homeDir: tmpHome, setupDir: tmpSetup, serverScript: '/srv.js' });
    const out = readFileSync(join(tmpHome, '.claude', 'CLAUDE.md'), 'utf8');
    expect(out).toContain('<!-- BEGIN: brain-memory -->');
    expect(out).toContain('<!-- END: brain-memory -->');
  });

  it('appends block when CLAUDE.md exists without markers', () => {
    const claudePath = join(tmpHome, '.claude', 'CLAUDE.md');
    require('node:fs').mkdirSync(dirname(claudePath), { recursive: true });
    writeFileSync(claudePath, '# existing user content\n');
    runSetup({ homeDir: tmpHome, setupDir: tmpSetup, serverScript: '/srv.js' });
    const out = readFileSync(claudePath, 'utf8');
    expect(out).toContain('# existing user content');
    expect(out).toContain('<!-- BEGIN: brain-memory -->');
  });

  it('replaces block when markers present (idempotent re-run)', () => {
    runSetup({ homeDir: tmpHome, setupDir: tmpSetup, serverScript: '/srv.js' });
    const second = runSetup({ homeDir: tmpHome, setupDir: tmpSetup, serverScript: '/srv.js' });
    expect(second.claudeMdUpdated).toBe(false);
    const occurrences = (
      readFileSync(join(tmpHome, '.claude', 'CLAUDE.md'), 'utf8').match(/BEGIN: brain-memory/g) ??
      []
    ).length;
    expect(occurrences).toBe(1);
  });

  it('creates ~/.claude.json with mcpServers.brain entry', () => {
    runSetup({ homeDir: tmpHome, setupDir: tmpSetup, serverScript: '/srv.js' });
    const json = JSON.parse(readFileSync(join(tmpHome, '.claude.json'), 'utf8'));
    expect(json.mcpServers.brain.command).toBe('node');
    expect(json.mcpServers.brain.args).toEqual(['/srv.js', 'serve']);
  });

  it('preserves existing keys in ~/.claude.json', () => {
    const path = join(tmpHome, '.claude.json');
    writeFileSync(
      path,
      JSON.stringify({ existingKey: 'keep', mcpServers: { other: { command: 'x' } } }),
    );
    runSetup({ homeDir: tmpHome, setupDir: tmpSetup, serverScript: '/srv.js' });
    const json = JSON.parse(readFileSync(path, 'utf8'));
    expect(json.existingKey).toBe('keep');
    expect(json.mcpServers.other.command).toBe('x');
    expect(json.mcpServers.brain).toBeDefined();
  });

  it('refuses to overwrite invalid JSON', () => {
    writeFileSync(join(tmpHome, '.claude.json'), '{not json');
    const r = runSetup({ homeDir: tmpHome, setupDir: tmpSetup, serverScript: '/srv.js' });
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.warnings[0]).toMatch(/invalid JSON/);
  });
});

function dirname(p: string): string {
  return p.split(/[\\/]/).slice(0, -1).join('/');
}
