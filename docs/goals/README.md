# Goals — Roadmap de Execução

Sequência obrigatória. Cada goal roda em sessão separada do Claude Code com `/goal` + auto mode.

## Status execução (atualizado 2026-05-15)

| # | Fase | Arquivo | Bound | Pré-req | Status |
|---|---|---|---|---|---|
| 1 | F1 Bootstrap | `2026-05-15-bootstrap-second-brain-mcp.md` | 15 turns | — | ✅ DONE |
| 2 | F2 Storage | `2026-05-15-add-storage-layer.md` | 20 turns | F1 | ✅ DONE |
| 3 | F3 MCP tools | `2026-05-15-add-mcp-tools.md` | 25 turns | F2 | ✅ DONE |
| 4 | F4 Curator | `2026-05-15-add-curator.md` | 25 turns | F2,F3 | ✅ DONE |
| 5 | F5 Skills | `2026-05-15-add-skills-format.md` | 15 turns | F2 | ✅ DONE |
| 6 | F6 CLI | `2026-05-15-add-cli.md` | 15 turns | F2,F4,F5 | ✅ DONE |
| 7 | F7 Rules gen | `2026-05-15-add-rules-generator.md` | 15 turns | F2,F6 | ✅ DONE |
| 8 | F8 Polish | `2026-05-15-polish-v0-1-release.md` | 15 turns | F1-F7 | ✅ DONE |

Restante: ~110 turns. Total inicial: ~145 turns / ~14 dias úteis solo.

## Métricas atingidas

| Total | Tests | Coverage | Mutation | Build | Lint | Publish dry-run |
|---|---|---|---|---|---|---|
| v0.1.0 | **107** | **92.19%** | **75.77%** | ✅ | ✅ | ✅ |

## Antes de cada /goal

1. Abrir sessão Claude Code em `<repo>/`
2. Ativar auto mode (`/auto on` ou setting)
3. Copiar bloco "Condição final" do .md correspondente
4. Colar no prompt prefixado com `/goal `
5. Deixar rodar até hit bound ou estado final

## Após cada /goal

1. Verificar transcript: estado final atingido?
2. Commit explícito da fase: `feat(FN): <slug>`
3. Se falhou → criar v2 do plano com seção "Lições da versão anterior"
4. Avançar pra próxima fase

## Cláusula de auto mode

`/goal` remove prompts por-turn. Auto mode remove prompts por-tool. Pra execução desassistida real, **ambos** ligados.

## Headless (opcional)

Cada fase pode rodar headless:
```bash
claude -p "/goal <condição>"
```
Bom pra CI/cron. Sem auto mode = pergunta tools.

## Replanejar

Se algum bound for atingido sem estado final → criar v2:
- Nome: `<data>-<slug>-v2.md`
- Seção 0 obrigatória: "Lições da versão anterior"
- Ajustar bound + restrições baseado no que falhou
