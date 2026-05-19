import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parseJsonl } from './jsonl.js';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'jsonl-'));
});

afterEach(() => rmSync(dir, { recursive: true, force: true }));

function writeLines(lines: unknown[]): string {
  const path = join(dir, 'test.jsonl');
  writeFileSync(path, lines.map((l) => JSON.stringify(l)).join('\n'), 'utf8');
  return path;
}

describe('parseJsonl', () => {
  it('extracts user text content from string', () => {
    const path = writeLines([
      {
        type: 'user',
        message: { role: 'user', content: 'hello world' },
        uuid: 'u1',
        sessionId: 's1',
        timestamp: '2026-05-01T00:00:00Z',
        cwd: 'C:\\\\proj\\\\app',
      },
    ]);
    const out = parseJsonl(path);
    expect(out).toHaveLength(1);
    expect(out[0]?.role).toBe('user');
    expect(out[0]?.content).toBe('hello world');
    expect(out[0]?.project).toBe('app');
  });

  it('extracts assistant text from content array', () => {
    const path = writeLines([
      {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            { type: 'thinking', thinking: 'silent reasoning' },
            { type: 'text', text: 'visible answer' },
          ],
        },
        uuid: 'u2',
        sessionId: 's1',
        timestamp: '2026-05-01T00:01:00Z',
        cwd: '/home/user/proj',
      },
    ]);
    const out = parseJsonl(path);
    expect(out).toHaveLength(1);
    expect(out[0]?.content).toBe('visible answer');
    expect(out[0]?.role).toBe('assistant');
  });

  it('skips thinking-only assistant messages', () => {
    const path = writeLines([
      {
        type: 'assistant',
        message: { role: 'assistant', content: [{ type: 'thinking', thinking: 'x' }] },
        uuid: 'u3',
        sessionId: 's1',
      },
    ]);
    expect(parseJsonl(path)).toHaveLength(0);
  });

  it('skips system/attachment/snapshot types', () => {
    const path = writeLines([
      { type: 'system', sessionId: 's1' },
      { type: 'attachment', sessionId: 's1', message: { content: 'attach text' } },
      { type: 'file-history-snapshot', sessionId: 's1' },
      { type: 'permission-mode', sessionId: 's1' },
      { type: 'ai-title', sessionId: 's1' },
    ]);
    expect(parseJsonl(path)).toHaveLength(0);
  });

  it('skips empty/malformed lines safely', () => {
    const path = join(dir, 'mixed.jsonl');
    writeFileSync(
      path,
      '\n{bad json\n\n{"type":"user","message":{"content":"valid"},"uuid":"u","sessionId":"s"}\n',
      'utf8',
    );
    const out = parseJsonl(path);
    expect(out).toHaveLength(1);
    expect(out[0]?.content).toBe('valid');
  });

  it('cwd basename uses last segment, handles forward and back slashes', () => {
    const path = writeLines([
      {
        type: 'user',
        message: { content: 'a' },
        uuid: 'u',
        sessionId: 's',
        cwd: 'C:\\\\Users\\\\X\\\\Desktop\\\\my-project',
      },
    ]);
    expect(parseJsonl(path)[0]?.project).toBe('my-project');
  });

  it('returns unknown when cwd missing', () => {
    const path = writeLines([
      { type: 'user', message: { content: 'a' }, uuid: 'u', sessionId: 's' },
    ]);
    expect(parseJsonl(path)[0]?.project).toBe('unknown');
  });
});
