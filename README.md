# second-brain-mcp

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/giovani-junior-dev/second-brain-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/giovani-junior-dev/second-brain-mcp/actions/workflows/ci.yml)

Persistent memory for any MCP client (Claude Code, Cursor, Codex, Continue). 3-layer memory + auto-learned skills, plug-and-play via stdio.

## Why

Agents forget everything between sessions. You re-paste context daily. This server gives them long-term memory backed by SQLite + FTS5, exposed via Model Context Protocol — no vendor lock-in.

## Quick install (Claude Code)

Clone + build + setup uma vez:

```bash
git clone https://github.com/giovani-junior-dev/second-brain-mcp.git
cd second-brain-mcp
npm install
npm run build
node dist/cli/index.js init
node dist/cli/index.js setup-claude
```

O comando `setup-claude` faz tudo (idempotente):

- Copia `brain-memory` skill para `~/.claude/skills/brain-memory/`
- Cria flag de ativação `~/.claude/skills/brain-memory/state/enabled.flag`
- Insere/atualiza bloco `<!-- BEGIN: brain-memory -->` em `~/.claude/CLAUDE.md`
- Adiciona entrada `mcpServers.brain` em `~/.claude.json` (preserva existentes)

Saída esperada:
```json
{
  "skillCopied": true,
  "flagCreated": true,
  "claudeMdUpdated": true,
  "mcpJsonUpdated": true,
  "warnings": []
}
```

**Reinicie o Claude Code** após executar. Verifique com `/mcp` — deve listar `brain · connected · 5 tools`.

## Como usar

Após instalar, o agente Claude Code automaticamente:

1. No início de cada sessão: chama `mcp__brain__recall` para carregar contexto global + do projeto atual
2. Quando você declara preferência/regra/decisão durável: chama `mcp__brain__write` no scope correto
3. Antes de decisões arquiteturais: chama `mcp__brain__recall` para checar prior art

Você também pode invocar manualmente:

```
Use mcp__brain__write content="prefiro biome sobre eslint", type="preference", scope="global"
```

```
Use mcp__brain__recall query="biome"
```

### Ligar / desligar auto-behaviors

| Frase pro agente | O que faz |
|---|---|
| `brain-memory on` | Cria flag de ativação |
| `brain-memory off` | Remove flag — auto-behaviors desligam |
| `brain-memory status` | Mostra ON/OFF |

## Tools expostas (MCP)

| Tool | Input | Output |
|---|---|---|
| `brain.recall` | `{query, scope?, limit?}` | facts wrapped in `<brain-context>` |
| `brain.write` | `{content, type, scope?}` | `{id, status}` |
| `brain.list_skills` | `{scope?}` | array of skills |
| `brain.skill_invoke` | `{name}` | SKILL.md content |
| `brain.session_search` | `{query, limit?}` | messages wrapped in `<brain-context>` |

## Scopes

- `global` — preferências universais e regras pessoais
- `project:<basename-cwd>` — contexto específico do projeto (auto-detectado pelo basename do cwd)
- `session:<uuid>` — conversa atual (auto-gerado pelo MCP server)

## CLI

```bash
brain setup-claude                     # instala skill + config em ~/.claude (idempotente)
brain init                             # cria ~/.brain com DB
brain status                           # mostra path DB, fact count, skill count, último curator run
brain serve                            # roda MCP stdio server (usado pelo Claude Code)
brain curator run                      # força ciclo curator (precisa ANTHROPIC_API_KEY no env)
brain skills list --scope=global       # lista skills aprendidas
brain rules generate --target=claude   # injeta bloco em CLAUDE.md de outro projeto
brain export --scope=global            # JSON dump
```

## Autoaprendizado

Após acumular interações (CC grava tudo via mensagem automática), rode:

```bash
brain curator run
```

LLM Anthropic Haiku (default, configurável) analisa mensagens, extrai padrões repetidos em ≥3 sessões, promove fatos e gera SKILL.md para padrões procedurais. Custo ~$0.001 por execução.

**Pré-req:** `ANTHROPIC_API_KEY` no env:

```powershell
# Windows
[Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "sk-ant-...", "User")
```

```bash
# Unix
export ANTHROPIC_API_KEY="sk-ant-..."
```

## Logs em tempo real

Toda chamada de tool é registrada em `~/.brain/mcp.log` (JSON Lines):

```powershell
Get-Content $env:USERPROFILE\.brain\mcp.log -Wait -Tail 0
```

```bash
tail -f ~/.brain/mcp.log
```

## Stack

TypeScript strict + Node 20 + `@modelcontextprotocol/sdk` + `better-sqlite3` + `zod` + `commander` + `gray-matter` + `@anthropic-ai/sdk`. Vitest + Stryker + Biome.

## Quality

- 170 tests passing
- 98%+ coverage (v8 ratchet 90/85/90/90)
- 77.24% mutation score (Stryker break 75)
- Build / lint / typecheck clean
- `npm publish --dry-run` succeeds

## Roadmap v0.2+

- Embeddings semantic recall
- HTTP transport
- Multi-LLM provider switch (Ollama / OpenAI / Groq)
- Honcho / Mem0 provider adapters
- Dashboard web

## License

MIT
