# second-brain-mcp

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Persistent memory for any MCP client (Claude Code, Cursor, Codex, Continue). 3-layer memory + auto-learned skills, plug-and-play via stdio.

## Why

Agents forget everything between sessions. You re-paste context daily. This server gives them long-term memory backed by SQLite + FTS5, exposed via Model Context Protocol — no vendor lock-in.

## Install

```bash
npx second-brain-mcp init
```

Creates `~/.brain/` with default config and DB.

## Configure Claude Code

Add to `.claude/settings.json`:

```json
{
  "mcpServers": {
    "brain": {
      "command": "npx",
      "args": ["second-brain-mcp"]
    }
  }
}
```

## Tools exposed

| Tool | Input | Output |
|---|---|---|
| `brain.recall` | `{query, scope?, limit?}` | facts wrapped in `<brain-context>` |
| `brain.write` | `{content, type, scope?}` | `{id, status}` |
| `brain.list_skills` | `{scope?}` | array of skills |
| `brain.skill_invoke` | `{name}` | SKILL.md content |
| `brain.session_search` | `{query, limit?}` | messages wrapped in `<brain-context>` |

## Scopes

- `global` — user-wide preferences
- `project:<id>` — project context (basename cwd)
- `session:<id>` — current conversation

## CLI

```bash
brain init                          # create ~/.brain
brain status                        # DB path, counts
brain curator run                   # force curator
brain skills list --scope=global    # list skills
brain rules generate --target=claude # write CLAUDE.md block
brain export --scope=global         # JSON dump
```

## Example flow

```bash
brain init
# Agent writes fact via MCP
# brain.write({content: "prefers TDD", type: "preference", scope: "global"})
# Next session, agent recalls
# brain.recall({query: "preference"})
# → <brain-context>...prefers TDD...</brain-context>
```

See `examples/` for full Claude Code integration.

## Stack

TypeScript + better-sqlite3 + @modelcontextprotocol/sdk + zod.

## Roadmap v0.2+

- Embeddings semantic recall
- HTTP transport
- Honcho/Mem0 provider adapters
- Dashboard web

## License

MIT
