import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const CLI = join(process.cwd(), 'dist', 'cli', 'index.js');

type Rpc = { jsonrpc: '2.0'; id?: number; method?: string; params?: unknown; result?: unknown };

let tmpHome: string;

beforeAll(() => {
  tmpHome = mkdtempSync(join(tmpdir(), 'brain-sub-'));
  process.env.USERPROFILE = tmpHome;
  process.env.HOME = tmpHome;
});

afterAll(() => {
  rmSync(tmpHome, { recursive: true, force: true });
});

async function rpc(messages: Rpc[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI, 'serve'], {
      env: { ...process.env, USERPROFILE: tmpHome, HOME: tmpHome },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let buf = '';
    let errBuf = '';
    const timer = setTimeout(() => {
      child.kill();
      resolve(`${buf}\n--STDERR--\n${errBuf}`);
    }, 9000);
    child.stdout.on('data', (d) => {
      buf += d.toString();
    });
    child.stderr.on('data', (d) => {
      errBuf += d.toString();
    });
    child.on('error', reject);
    child.on('exit', () => {
      clearTimeout(timer);
      resolve(buf);
    });
    const payload = messages.map((m) => `${JSON.stringify(m)}\n`).join('');
    child.stdin.write(payload);
    setTimeout(() => child.stdin.end(), 4000);
  });
}

describe('MCP subprocess stdio', () => {
  it('responds to initialize handshake', async () => {
    const out = await rpc([
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test', version: '0' },
        },
      },
    ]);
    expect(out).toContain('"result"');
    expect(out).toContain('second-brain-mcp');
  }, 15_000);

  it('lists registered tools via tools/list', async () => {
    const out = await rpc([
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test', version: '0' },
        },
      },
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      { jsonrpc: '2.0', id: 2, method: 'tools/list' },
    ]);
    expect(out).toContain('brain.recall');
    expect(out).toContain('brain.write');
    expect(out).toContain('brain.list_skills');
    expect(out).toContain('brain.skill_invoke');
    expect(out).toContain('brain.session_search');
  }, 15_000);

  it('write→recall roundtrip via subprocess', async () => {
    const out = await rpc([
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test', version: '0' },
        },
      },
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'brain.write',
          arguments: { content: 'sub-roundtrip-marker', type: 'note', scope: 'global' },
        },
      },
      {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'brain.recall', arguments: { query: 'sub-roundtrip-marker' } },
      },
    ]);
    expect(out).toMatch(/status\\?":\\?"ok\\?"/);
    expect(out).toContain('<brain-context>');
    expect(out).toContain('sub-roundtrip-marker');
  }, 20_000);

  it('returns JSON-RPC error on invalid tool input', async () => {
    const out = await rpc([
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test', version: '0' },
        },
      },
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: { name: 'brain.write', arguments: { type: 'note' } },
      },
    ]);
    expect(out).toMatch(/error|isError|invalid/i);
  }, 15_000);
});
