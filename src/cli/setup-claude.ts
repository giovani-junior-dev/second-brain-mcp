import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MARKER_BEGIN = '<!-- BEGIN: brain-memory -->';
const MARKER_END = '<!-- END: brain-memory -->';
const SKILL_NAME = 'brain-memory';

export type SetupOptions = {
  homeDir: string;
  setupDir: string;
  serverScript: string;
};

export type SetupResult = {
  skillCopied: boolean;
  flagCreated: boolean;
  claudeMdUpdated: boolean;
  mcpJsonUpdated: boolean;
  warnings: string[];
};

function readBlockTemplate(setupDir: string): string {
  return readFileSync(join(setupDir, 'CLAUDE_MD_BLOCK.md'), 'utf8').trim();
}

function copySkill(setupDir: string, homeDir: string): boolean {
  const src = join(setupDir, 'skills', SKILL_NAME, 'SKILL.md');
  const dstDir = join(homeDir, '.claude', 'skills', SKILL_NAME);
  const dst = join(dstDir, 'SKILL.md');
  mkdirSync(dstDir, { recursive: true });
  copyFileSync(src, dst);
  return true;
}

function ensureFlag(homeDir: string): boolean {
  const stateDir = join(homeDir, '.claude', 'skills', SKILL_NAME, 'state');
  mkdirSync(stateDir, { recursive: true });
  const flag = join(stateDir, 'enabled.flag');
  if (!existsSync(flag)) {
    writeFileSync(flag, '', 'utf8');
    return true;
  }
  return false;
}

function mergeClaudeMd(homeDir: string, block: string): boolean {
  const path = join(homeDir, '.claude', 'CLAUDE.md');
  mkdirSync(dirname(path), { recursive: true });
  const existing = existsSync(path) ? readFileSync(path, 'utf8') : '';
  const start = existing.indexOf(MARKER_BEGIN);
  const end = existing.indexOf(MARKER_END);
  if (start !== -1 && end !== -1) {
    const before = existing.slice(0, start);
    const after = existing.slice(end + MARKER_END.length);
    const next = `${before}${block}${after}`;
    if (next === existing) return false;
    writeFileSync(path, next, 'utf8');
    return true;
  }
  const next = existing.trim() ? `${existing.trimEnd()}\n\n${block}\n` : `${block}\n`;
  writeFileSync(path, next, 'utf8');
  return true;
}

function mergeMcpJson(homeDir: string, serverScript: string): boolean {
  const path = join(homeDir, '.claude.json');
  let json: Record<string, unknown> = {};
  if (existsSync(path)) {
    try {
      json = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
    } catch {
      throw new Error(`invalid JSON at ${path}; refusing to overwrite`);
    }
  }
  const servers = (json.mcpServers as Record<string, unknown>) ?? {};
  const desired = {
    type: 'stdio',
    command: 'node',
    args: [serverScript, 'serve'],
    env: {},
  };
  const before = JSON.stringify(servers.brain ?? null);
  servers.brain = desired;
  json.mcpServers = servers;
  writeFileSync(path, `${JSON.stringify(json, null, 2)}\n`, 'utf8');
  return before !== JSON.stringify(desired);
}

export function runSetup(opts: SetupOptions): SetupResult {
  const warnings: string[] = [];
  const block = readBlockTemplate(opts.setupDir);
  const skillCopied = copySkill(opts.setupDir, opts.homeDir);
  const flagCreated = ensureFlag(opts.homeDir);
  const claudeMdUpdated = mergeClaudeMd(opts.homeDir, block);
  let mcpJsonUpdated = false;
  try {
    mcpJsonUpdated = mergeMcpJson(opts.homeDir, opts.serverScript);
  } catch (err) {
    warnings.push(err instanceof Error ? err.message : String(err));
  }
  return { skillCopied, flagCreated, claudeMdUpdated, mcpJsonUpdated, warnings };
}

function defaultSetupDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, '..', '..', 'setup');
}

function defaultServerScript(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, 'index.js');
}

export function runDefaultSetup(): SetupResult {
  return runSetup({
    homeDir: homedir(),
    setupDir: defaultSetupDir(),
    serverScript: defaultServerScript(),
  });
}
