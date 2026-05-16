# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`second-brain-mcp` v0.1.0 — persistent memory MCP server. SQLite FTS5 storage + idle-triggered curator + skills (agentskills.io). Exposes 5 tools via stdio MCP transport: `brain.recall`, `brain.write`, `brain.list_skills`, `brain.skill_invoke`, `brain.session_search`.

Authoritative spec: `docs/prd-v0.1.md`. Phase plans: `docs/goals/`.

## Commands

```bash
npm test                 # vitest run, 113 tests
npm run test:coverage    # coverage v8, target ≥80% per module
npm run mutation         # stryker, target ≥70%
npm run build            # tsc → dist/
npm run lint             # biome via node wrapper (RTK hook bug avoidance)
npm run typecheck        # tsc --noEmit
npm start                # node dist/index.js

# Single test file
npm test -- <substring>          # e.g. npm test -- curator
npm test -- src/mcp/sanitize.test.ts

# Build then CLI smoke
npm run build
node dist/cli/index.js --version              # 0.1.0
node dist/cli/index.js init                   # create ~/.brain
node dist/cli/index.js serve                  # MCP stdio server
node dist/cli/index.js curator run            # force curator cycle
node dist/cli/index.js rules generate --target=claude
```

`npm run lint` direct in Bash trips an RTK hook that mis-parses biome output as ESLint. Always run via PowerShell tool, or call `node ./node_modules/@biomejs/biome/bin/biome check src --write` for auto-fix.

## Architecture

Flat modular monolith per PRD §3. Boundary rules enforced manually (no cross-domain imports):

```
src/
├── storage/    # better-sqlite3 raw, FTS5+trigram, no deps on other modules
├── mcp/        # stdio server + tools + sanitize fence, depends on storage
├── curator/    # LLM extractor + scheduler + promote + skill-gen + consolidate + stale
├── skills/     # agentskills.io parser/writer/validator (gray-matter + zod)
├── rules/      # CLAUDE.md/AGENTS.md/.codex marker-based merger
├── cli/        # commander entrypoint, wires storage+mcp+curator+rules
└── integration/ # subprocess E2E (spawns dist/cli/index.js serve)
```

Critical flows:
- **Recall**: tool → `searchFacts` FTS5 BM25 → `wrapBrainContext` strips injection tokens, prepends system note, fences output.
- **Curator**: `runCurator` → `extractPatterns` (LLM) → `promotePatterns` (≥3 sessions cross-session) → `generateSkill` (procedural kind) → `consolidateSkills` (Jaccard ≥0.85 → archive duplicate) → `markStaleFacts` (last_used > 30d, never delete) → `markRun`.
- **Rules**: `applyBlock` 3-case merger (create / append / replace between `<!-- BEGIN: brain-injection -->` markers). Idempotent.
- **Sanitization**: never trust recalled content. Strip `<brain-context>`, `</brain-context>`, `<memory-context>`, `</memory-context>` before injection. System note marks content as informational, not user input.

Schema: `src/storage/schema.ts` (PRD §4). Migrations idempotent via `IF NOT EXISTS`.

LLM provider: `src/curator/llm.ts` default Anthropic Haiku (`claude-haiku-4-5-20251001`), env `ANTHROPIC_API_KEY`. Tests mock via msw.

Constants nominated: `STALE_DAYS=30`, `PATTERN_REPEAT_THRESHOLD=3`, `IDLE_THRESHOLD_HOURS=2`, `CURATOR_INTERVAL_HOURS=24`, `FTS_LIMIT_DEFAULT=5`. Never inline magic numbers.

## Hard rules — enforced every change

### Loose ends — zero tolerance

Never advance to next phase, next feature, or next task with loose ends. A loose end is:
- Functionality wired in one layer but not exposed at boundary (e.g. logic exists, CLI shows `noop`)
- Test gap where coverage ratchet would drop
- Build/lint/typecheck/mutation thresholds not met
- TODO/FIXME without issue link + expiry date
- Test asserting outdated behavior after refactor
- Dependency installed but not used, or used but not declared
- Goal plan in `docs/goals/` not marked DONE while phase is complete (sync README index)

Before declaring any task complete, run the verify gate: `npm test && npm run lint && npm run typecheck && npm run build`. All exit 0. If any fails, fix root cause; never bypass.

### code-craftsman ALWAYS ON

Skill `code-craftsman` is mandatory for all interactions on this repo. Don't disable. Enforced rules:
- TDD non-negotiable: RED test first, GREEN minimal impl, REFACTOR
- Function ≤20 lines, ≤2 params (3+ → object), ≤2 indent levels
- File ≤500 lines, ≤120 char lines
- No `Manager`/`Helper`/`Util`/`Processor`/generic `Service`
- No interface without 2nd real implementation (mocks don't count)
- No boolean flag param → split into 2 functions
- No magic numbers → named constants
- No `// @ts-ignore`, no `eslint-disable`, no `--no-verify`
- No commented-out code (git has history)
- No cross-domain imports (boundary list above)
- Snapshot test when output shape stable; contract test (msw + zod) when external HTTP; E2E only opt-in after unit+contract pass
- Mutation score ≥70% per touched module
- Coverage ratchet: changed files ≥80%, total never drops
- Caveman output: no filler, fragments OK, technical terms exact

### Stack lock (PRD §2)

Adding deps requires explicit user order. v0.1.0 stack: TypeScript ≥5.4, Node ≥20, `@modelcontextprotocol/sdk`, `better-sqlite3`, `@anthropic-ai/sdk`, `zod`, `commander`, `gray-matter`, `vitest`, `@stryker-mutator/core`, `@biomejs/biome`, `msw`. No ORM. No template engine. No embeddings v0.1.

### Phase discipline

Phases F1-F8 in `docs/goals/` are sequential. F1-F8 currently all DONE per `docs/goals/README.md`. Future work creates new dated goal files (`<YYYY-MM-DD>-<verb-target>.md`); never edits the historical ones. If a phase failed, create `-v2.md` with "Lições da versão anterior" section.

### Storage rules

- Never delete facts or skills — only archive (`archived=1`). PRD REQ-10.
- FTS5 inserts must mirror parent table inserts (manual sync, no triggers v0.1).
- Always pass `Database` handle by parameter; never instantiate inside business logic.
- Migrations idempotent; rerunning never throws.

### MCP rules

- Every tool output passes through `wrapBrainContext` if returning recalled content.
- Zod validates input at tool boundary; throw on invalid, never silent return.
- Tool handlers ≤80 lines including validation.
- Server registration only in `src/mcp/server.ts`; tools are pure functions.

### Curator rules

- Never call real LLM in tests — msw or vi.fn() mock.
- Procedural patterns → `skill-gen`. Preference/fact patterns → `promote`. Don't crossover.
- Scheduler is idle-triggered only. No cron, no setInterval.

## Distribution

`bin: { brain: "./dist/cli/index.js" }`. `files` whitelist: `dist`, `README.md`, `LICENSE`. Publish via `npm publish --dry-run` first; never publish without explicit order.

## What's NOT here yet (out of scope v0.1, do not implement without order)

Embeddings, HRR, HTTP transport, Honcho/Mem0 adapters, dashboard, i18n curator, gateway messaging. See PRD §14.
