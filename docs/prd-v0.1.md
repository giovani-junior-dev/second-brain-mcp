# PRD — second-brain-mcp v0.1

## 0. Identidade

| Campo | Valor |
|---|---|
| Nome | `second-brain-mcp` |
| Pacote npm | `second-brain-mcp` |
| License | MIT |
| Repo | `giovani-junior-dev/second-brain-mcp` |
| Stack | TypeScript + Node 20 + MCP SDK + better-sqlite3 |
| Inspiração | NousResearch/hermes-agent (memory core) |

## 1. Contexto

Cérebro persistente plugável a qualquer cliente MCP (Claude Code, Cursor, Codex, Continue, Allos). Dá ao agente memória eterna 3 camadas + auto-aprendizado via skills, sem depender de wrapper proprietário.

Problema: agentes esquecem tudo entre sessões. User reenvia contexto diário. Hermes Agent provou que SQLite + FTS5 + curator idle-triggered resolve. Mas Hermes é monolítico Python — não pluga em outros clientes.

Solução: extrair core de memória do Hermes, reimplementar TS, expor via MCP. Qualquer cliente pluga, mesmo cérebro.

## 2. Stack

| Camada | Pacote | Versão | Razão |
|---|---|---|---|
| Runtime | Node | ≥20 | LTS, MCP SDK suportado |
| Linguagem | TypeScript | ≥5.4 | strict mode |
| MCP | `@modelcontextprotocol/sdk` | latest | ref Anthropic, stdio transport |
| DB | `better-sqlite3` | ^11 | FTS5 + trigram, sync API |
| LLM | `@anthropic-ai/sdk` | latest | curator default Haiku |
| LLM opt | `openai` | latest | provider alternativo |
| Validação | `zod` | ^3 | schemas MCP + LLM |
| CLI | `commander` | ^12 | subcomandos |
| Frontmatter | `gray-matter` | ^4 | parse SKILL.md |
| Test | `vitest` | ^2 | runner |
| Mutation | `@stryker-mutator/core` | ^8 | ≥70% |
| Lint | `@biomejs/biome` | latest | zero config |
| Bundler | `tsup` | latest | esm+cjs |

## 3. Arquitetura

```
second-brain-mcp/
├── src/
│   ├── storage/         # SQLite + FTS5 + migrations
│   ├── recall/          # busca multi-scope + sanitização fence
│   ├── curator/         # pattern extract + skill promote (LLM)
│   ├── skills/          # agentskills.io reader/writer
│   ├── mcp/             # server stdio + tools (recall/write/skills)
│   ├── cli/             # commander brain init/status/curator/rules
│   └── rules/           # gerador CLAUDE.md/AGENTS.md
├── tests/
│   ├── unit/
│   ├── contract/        # MCP+LLM via msw
│   └── integration/     # stdio E2E
├── docs/
│   ├── prd-v0.1.md
│   ├── adr/
│   └── goals/
└── skills/              # runtime gen, gitignored
```

Boundaries (regra dura):
1. `storage/` não importa nada do projeto
2. `recall/` importa só `storage/`
3. `curator/` importa `storage/` + `skills/`
4. `mcp/` importa todos exceto `cli/` e `rules/`
5. `cli/` standalone, chama `rules/` + `curator/`
6. Cross-domain import = lint error

## 4. Schema DB

```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY,
  session_id TEXT NOT NULL,
  project TEXT,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE VIRTUAL TABLE messages_fts USING fts5(content, content=messages);
CREATE VIRTUAL TABLE messages_fts_trigram USING fts5(content, tokenize='trigram');

CREATE TABLE facts (
  id INTEGER PRIMARY KEY,
  scope TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  source_session TEXT,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER,
  pinned INTEGER DEFAULT 0,
  archived INTEGER DEFAULT 0
);
CREATE VIRTUAL TABLE facts_fts USING fts5(content, content=facts);

CREATE TABLE skills (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  scope TEXT NOT NULL,
  use_count INTEGER DEFAULT 0,
  last_used_at INTEGER,
  pinned INTEGER DEFAULT 0,
  archived INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE curator_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

## 5. MCP Tools expostas

| Tool | Input | Output |
|---|---|---|
| `brain.recall` | `{query, scope?, limit?}` | `<brain-context>...</brain-context>` top-K |
| `brain.write` | `{content, type, scope?}` | `{id, status}` |
| `brain.list_skills` | `{scope?}` | array nome/desc |
| `brain.skill_invoke` | `{name}` | conteúdo SKILL.md |
| `brain.session_search` | `{query}` | mensagens passadas top-K |

## 6. Scopes

```
global       → user-level (preferências, stack, idioma)
project:<id> → contexto projeto (id = basename cwd ou .brain.toml)
session:<id> → conversa atual (efêmera, vira persistent via curator)
```

Recall = union dos 3 + dedup + BM25 rerank.

## 7. EARS Requirements

| ID | Tipo | Requirement |
|---|---|---|
| REQ-1 | Event | When client calls `brain.recall(query)`, server shall return top-5 FTS5 BM25 ranked, wrapped in `<brain-context>` |
| REQ-2 | Event | When client calls `brain.write(content,type,scope)`, server shall persist in `facts` with created_at=now |
| REQ-3 | State | While idle >2h AND last_run >24h ago, curator shall trigger pattern extraction |
| REQ-4 | Event | When pattern repeats ≥3x cross sessions, system shall create skill at `skills/<name>/SKILL.md` |
| REQ-5 | Event | When CLI runs `brain rules generate --target=claude`, system shall update CLAUDE.md between markers |
| REQ-6 | Unwanted | If recalled content has `<memory-context>` or `</brain-context>`, sanitizer shall strip before injection |
| REQ-7 | State | While skill archived=1, recall shall exclude from results |
| REQ-8 | Event | When fact last_used_at >30d, curator shall mark stale (not delete) |
| REQ-9 | Unwanted | If SQLite write fails, MCP tool shall return error, never silent fail |
| REQ-10 | Ubiquitous | System shall never delete skills — only archive |
| REQ-11 | Event | When recall returns 0 results, server shall return empty `<brain-context></brain-context>` |
| REQ-12 | Event | When DB file missing, system shall auto-create on first connection |

## 8. Fases (roadmap)

| Fase | Nome | Days | Deliverables | Bound goal |
|---|---|---|---|---|
| F1 | Bootstrap | 1 | dir, npm init, tsconfig, biome, vitest, smoke build | 15 turns |
| F2 | Storage | 2 | better-sqlite3 + DDL + CRUD facts/messages/skills | 20 turns |
| F3 | MCP tools | 3 | server stdio + 5 tools + Zod contracts | 25 turns |
| F4 | Curator | 3 | LLM extractor + idle scheduler + skill promote | 25 turns |
| F5 | Skills | 1 | agentskills.io parser/writer | 15 turns |
| F6 | CLI | 1 | commander init/status/curator-run | 15 turns |
| F7 | Rules gen | 1 | CLAUDE.md/AGENTS.md merge entre markers | 15 turns |
| F8 | Polish | 2 | README, examples, publish dry-run | 15 turns |

Total estimado: ~14 dias úteis solo dev.

## 9. Test matrix

| Fase | Unit | Snapshot | Contract | Mutation | E2E |
|---|---|---|---|---|---|
| F1 | smoke build | — | — | ≥70% | — |
| F2 | CRUD + FTS5 query | — | — | ≥70% | — |
| F3 | tool dispatch | JSON shape | Zod MCP | ≥70% | pending |
| F4 | extract logic | — | LLM via msw | ≥70% | — |
| F5 | parse+write | SKILL.md output | — | ≥70% | — |
| F6 | command logic | stdout | — | ≥70% | — |
| F7 | merge markers | CLAUDE.md output | — | ≥70% | — |
| F8 | wiring full | — | — | — | opt-in |

Coverage ratchet: ≥80% new code, total only rises.

## 10. ADRs planejados

| ID | Decisão | Status |
|---|---|---|
| ADR-001 | TypeScript/Node vs Python/Go | accepted |
| ADR-002 | FTS5 puro sem embeddings v0.1 | accepted |
| ADR-003 | Curator idle-triggered (não cron) | accepted |
| ADR-004 | Anti-injection `<brain-context>` fence | accepted |
| ADR-005 | Skills formato agentskills.io | accepted |
| ADR-006 | E2E decisão por feature (opt-in) | accepted |

## 11. Constraints globais

- TDD obrigatório (RED→GREEN→REFACTOR)
- Função ≤20 linhas, ≤2 params, ≤2 níveis indent
- Arquivo ≤500 linhas
- Sem `Manager`/`Helper`/`Util` genérico
- Sem boolean flag param
- Sem interface sem 2ª implementação
- Sem magic numbers (constantes nomeadas)
- Sem cross-domain import
- Sem `--no-verify`, sem `@ts-ignore`, sem lockfile mexido sem ordem
- Commits descritivos

## 12. Distribuição

```bash
npx second-brain-mcp           # uso direto
npm install -g second-brain-mcp # global
```

Config cliente CC:
```json
{ "mcpServers": { "brain": { "command": "npx", "args": ["second-brain-mcp"] } } }
```

## 13. Estado final v0.1 (verificável)

- `npm run build` exits 0
- `npm test` exits 0 com ≥40 testes
- `npx stryker run` score ≥70%
- coverage ≥80% src/
- `node dist/cli.js init` cria `~/.brain/` com db válido
- `npx . --version` retorna `0.1.0`
- `npm publish --dry-run` sucesso
- README + 1 exemplo integração CC

## 14. Out of scope v0.1

- Embeddings semânticos
- HRR holographic
- Provider Honcho/Mem0
- Dashboard web
- Gateway messaging
- HTTP transport (só stdio)
- i18n curator
