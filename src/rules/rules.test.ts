import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { RulesError, applyBlock } from './merger.js';
import { MARKER_BEGIN, MARKER_END, defaultOutPath, renderBlock } from './templates.js';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'r-'));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe('renderBlock', () => {
  it('wraps in markers', () => {
    const out = renderBlock('claude', ['fact1']);
    expect(out.startsWith(MARKER_BEGIN)).toBe(true);
    expect(out.endsWith(MARKER_END)).toBe(true);
  });

  it('lists facts as bullets', () => {
    expect(renderBlock('claude', ['a', 'b'])).toContain('- a');
  });

  it('renders placeholder when empty', () => {
    expect(renderBlock('cursor', [])).toContain('no facts yet');
  });

  it('snapshot stable claude', () => {
    expect(renderBlock('claude', ['fact-x'])).toMatchInlineSnapshot(`
      "<!-- BEGIN: brain-injection -->
      ## second-brain-mcp injected context

      - fact-x
      <!-- END: brain-injection -->"
    `);
  });
});

describe('defaultOutPath', () => {
  it('maps targets', () => {
    expect(defaultOutPath('claude')).toBe('CLAUDE.md');
    expect(defaultOutPath('cursor')).toBe('AGENTS.md');
    expect(defaultOutPath('codex')).toBe('.codex/rules.md');
  });
});

describe('applyBlock', () => {
  it('creates file when missing', () => {
    const path = join(dir, 'CLAUDE.md');
    applyBlock(path, renderBlock('claude', ['f1']));
    expect(existsSync(path)).toBe(true);
    expect(readFileSync(path, 'utf8')).toContain('f1');
  });

  it('appends when file exists without markers', () => {
    const path = join(dir, 'CLAUDE.md');
    writeFileSync(path, '# Existing user content\n');
    applyBlock(path, renderBlock('claude', ['f2']));
    const out = readFileSync(path, 'utf8');
    expect(out).toContain('# Existing user content');
    expect(out).toContain('f2');
  });

  it('replaces between markers when present', () => {
    const path = join(dir, 'CLAUDE.md');
    writeFileSync(path, `# Top\n\n${renderBlock('claude', ['old'])}\n\n# Bottom\n`);
    applyBlock(path, renderBlock('claude', ['new']));
    const out = readFileSync(path, 'utf8');
    expect(out).toContain('# Top');
    expect(out).toContain('# Bottom');
    expect(out).toContain('new');
    expect(out).not.toContain('old');
  });

  it('is idempotent (2x same input)', () => {
    const path = join(dir, 'CLAUDE.md');
    const block = renderBlock('claude', ['stable']);
    applyBlock(path, block);
    const first = readFileSync(path, 'utf8');
    applyBlock(path, block);
    expect(readFileSync(path, 'utf8')).toBe(first);
  });

  it('throws when destination dir missing', () => {
    expect(() => applyBlock(join(dir, 'missing', 'x.md'), 'block')).toThrow(RulesError);
  });
});
