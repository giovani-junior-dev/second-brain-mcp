import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from './logger.js';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'log-'));
});

afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe('createLogger', () => {
  it('writes JSON line per entry', () => {
    const log = createLogger(join(dir, 'mcp.log'));
    log({ ts: '2026-05-16T00:00:00.000Z', tool: 'brain.write', input: { content: 'x' }, ok: true });
    log({
      ts: '2026-05-16T00:00:01.000Z',
      tool: 'brain.recall',
      input: { query: 'y' },
      ok: false,
      error: 'boom',
    });
    const lines = readFileSync(join(dir, 'mcp.log'), 'utf8').trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0] ?? '').tool).toBe('brain.write');
    expect(JSON.parse(lines[1] ?? '').error).toBe('boom');
  });

  it('creates dir when missing', () => {
    const path = join(dir, 'nested', 'deep', 'mcp.log');
    const log = createLogger(path);
    log({ ts: 't', tool: 'x', input: null, ok: true });
    expect(existsSync(path)).toBe(true);
  });

  it('never throws on append failure', () => {
    const log = createLogger(join(dir, 'mcp.log'));
    rmSync(dir, { recursive: true, force: true });
    expect(() => log({ ts: 't', tool: 'x', input: null, ok: true })).not.toThrow();
  });
});
