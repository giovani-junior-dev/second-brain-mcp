#!/usr/bin/env node
import { basename } from 'node:path';
import { Command } from 'commander';
import { defaultLlm } from '../curator/llm.js';
import { runCurator } from '../curator/run.js';
import { startStdio } from '../mcp/server.js';
import { applyBlock } from '../rules/merger.js';
import { type Target, defaultOutPath, renderBlock } from '../rules/templates.js';
import { openDb } from '../storage/db.js';
import { listFacts } from '../storage/facts.js';
import { migrate } from '../storage/migrate.js';
import { listSkills } from '../storage/skills.js';
import { DB_FILE, SKILLS_DIR } from './paths.js';
import { exportScope, initBrain, status } from './service.js';
import { runDefaultSetup } from './setup-claude.js';

const GLOBAL_SCOPE = 'global';

export function buildProgram(): Command {
  const program = new Command();
  program.name('brain').description('second-brain-mcp CLI').version('0.1.0');

  program
    .command('serve')
    .description('Start MCP stdio server')
    .action(async () => {
      initBrain();
      const db = openDb(DB_FILE);
      migrate(db);
      await startStdio(db);
    });

  program
    .command('setup-claude')
    .description('Install brain-memory skill + mcpServers entry into ~/.claude (idempotent)')
    .action(() => {
      const r = runDefaultSetup();
      process.stdout.write(`${JSON.stringify(r, null, 2)}\n`);
    });

  program
    .command('init')
    .description('Create ~/.brain with default config and DB')
    .action(() => {
      const r = initBrain();
      process.stdout.write(`brain initialized at ${r.dbPath}\n`);
    });

  program
    .command('status')
    .description('Show DB path, fact/skill count, last curator run')
    .action(() => {
      const db = openDb(DB_FILE);
      migrate(db);
      process.stdout.write(`${JSON.stringify(status(db), null, 2)}\n`);
      db.close();
    });

  const curator = program.command('curator').description('Curator commands');
  curator
    .command('run')
    .description('Force curator run synchronously')
    .action(async () => {
      initBrain();
      const db = openDb(DB_FILE);
      migrate(db);
      const summary = await runCurator(db, defaultLlm(), SKILLS_DIR, Date.now());
      db.close();
      process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    });

  const skills = program.command('skills').description('Skills commands');
  skills
    .command('list')
    .option('--scope <scope>', 'filter by scope', GLOBAL_SCOPE)
    .action((opts: { scope: string }) => {
      const db = openDb(DB_FILE);
      migrate(db);
      const rows = listSkills(db, opts.scope);
      process.stdout.write(`${JSON.stringify(rows.map((r) => r.name))}\n`);
      db.close();
    });

  const rules = program.command('rules').description('Rules generator');
  rules
    .command('generate')
    .requiredOption('--target <target>', 'claude|cursor|codex')
    .option('--out <path>', 'output path')
    .action((opts: { target: string; out?: string }) => {
      const target = opts.target as Target;
      const out = opts.out ?? defaultOutPath(target);
      const db = openDb(DB_FILE);
      migrate(db);
      const projectScope = `project:${basename(process.cwd())}`;
      const facts = [
        ...listFacts(db, GLOBAL_SCOPE).map((f) => f.content),
        ...listFacts(db, projectScope).map((f) => f.content),
      ];
      applyBlock(out, renderBlock(target, facts));
      db.close();
      process.stdout.write(`rules written to ${out}\n`);
    });

  program
    .command('export')
    .requiredOption('--scope <scope>', 'scope to export')
    .action((opts: { scope: string }) => {
      const db = openDb(DB_FILE);
      migrate(db);
      process.stdout.write(`${exportScope(db, opts.scope)}\n`);
      db.close();
    });

  return program;
}

if (process.argv[1]?.includes('cli')) {
  buildProgram().parseAsync(process.argv);
}
