# Claude Code integration

## 1. Init brain

```bash
npx second-brain-mcp init
```

Output: `brain initialized at <home>/.brain/brain.db`

## 2. Register MCP server

Edit `.claude/settings.json` in your project:

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

## 3. Use from agent

In a Claude Code session, the agent has 5 new tools:

- `mcp__brain__recall` — search facts across sessions
- `mcp__brain__write` — persist new facts
- `mcp__brain__list_skills` — discover learned skills
- `mcp__brain__skill_invoke` — read SKILL.md content
- `mcp__brain__session_search` — search past messages

## 4. Generate CLAUDE.md injection

```bash
brain rules generate --target=claude
```

Writes block between markers in `CLAUDE.md`. Idempotent — re-run safe.

## 5. Inspect state

```bash
brain status
brain skills list --scope=global
brain export --scope=global > backup.json
```
