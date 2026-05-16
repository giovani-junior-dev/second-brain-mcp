# ADR-001: TypeScript/Node sobre Python/Go

## Status
Accepted — 2026-05-15

## Contexto
Stack candidata: Python (igual Hermes), Node/TS, Go. Projeto = MCP server standalone plugável a múltiplos clientes (Claude Code, Cursor, Codex, Continue, Allos).

## Decisão
TypeScript + Node 20.

## Razões
- MCP SDK reference Anthropic = TS first (features novas primeiro)
- `npx second-brain-mcp` = zero install pro user (Node já vem com Cursor/CC)
- `better-sqlite3` tem FTS5 + trigram nativo + sync API
- Ecosystem MCP: ~80% dos servers MCP são TS
- Anthropic + OpenAI SDKs first-class em Node
- Allos é Node, integração natural

## Rejeitados
- **Python**: distribuição chata (user precisa Python instalado), perderia user base CC nativo
- **Go**: single binary atrai, mas LLM SDKs menos maduros, menos exemplos MCP, curva pro user

## Trade-offs aceitos
- Embeddings locais (sentence-transformers) requer Ollama HTTP externo no futuro (v0.2+)
- Sem reuso direto de código Hermes (Python) — reimplementar
