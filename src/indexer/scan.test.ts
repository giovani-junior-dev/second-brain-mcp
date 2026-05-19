import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { scanJsonl } from './scan.js';

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'scan-'));
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('scanJsonl', () => {
  it('finds *.jsonl recursive', () => {
    mkdirSync(join(root, 'projA'));
    mkdirSync(join(root, 'projB', 'sub'), { recursive: true });
    writeFileSync(join(root, 'projA', 's1.jsonl'), '');
    writeFileSync(join(root, 'projB', 's2.jsonl'), '');
    writeFileSync(join(root, 'projB', 'sub', 's3.jsonl'), '');
    writeFileSync(join(root, 'projA', 'ignore.txt'), '');
    expect(scanJsonl(root).filter((p) => p.endsWith('.jsonl'))).toHaveLength(3);
  });

  it('returns empty array when root missing', () => {
    expect(scanJsonl(join(root, 'nonexistent'))).toEqual([]);
  });

  it('ignores non-jsonl files', () => {
    writeFileSync(join(root, 'foo.txt'), '');
    writeFileSync(join(root, 'bar.json'), '');
    expect(scanJsonl(root)).toEqual([]);
  });
});
