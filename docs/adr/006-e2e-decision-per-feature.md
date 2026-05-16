# ADR-006: E2E decisão por feature (opt-in)

## Status
Accepted — 2026-05-15

## Contexto
E2E testes (Playwright/integration full-stack) custam caro de manter e rodar. Code-craftsman skill recomenda perguntar por feature após unit/snapshot/contract estarem prontos.

## Decisão
- E2E é **opt-in por feature**, não default
- Decisão registrada em ADR `docs/adr/e2e-NNNN-<feature>.md`
- Pergunta padrão após F-N concluir: "Justifica E2E? [s/n/d=defer]"

## Razões
- CLI tools + MCP servers raramente precisam E2E full-stack (unit + contract cobre)
- F8 (integration test stdio subprocess) já cobre wiring end-to-end mínimo
- Evita test suite lenta que vira fricção

## Rejeitados
- **E2E sempre**: overkill pra MCP server
- **E2E nunca**: cego pra integração real

## Aplicação no projeto
| Fase | E2E justifica? | Razão |
|---|---|---|
| F1 Bootstrap | não | smoke build é suficiente |
| F2 Storage | não | unit + mutation cobre |
| F3 MCP tools | **considerar** | subprocess stdio integration test |
| F4 Curator | não | LLM mock via msw |
| F5 Skills | não | parse round-trip suficiente |
| F6 CLI | não | snapshot stdout suficiente |
| F7 Rules gen | não | snapshot output suficiente |
| F8 Polish | **sim** | E2E subprocess MCP no integration test |

## Trade-offs aceitos
- Bugs de integração entre módulos só pegos em F8 — risco controlado pelo escopo MVP
