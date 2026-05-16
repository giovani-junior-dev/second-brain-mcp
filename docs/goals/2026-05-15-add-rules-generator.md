# Goal Plan — add-rules-generator (F7)

## 1. Contexto
- Repo: `C:/Users/Script7/Desktop/second-brain-mcp/`
- Stack: TS puro (sem template engine externo)
- Pré-req: F2 (storage), F6 (cli) done

## 2. Estado final mensurável
- `src/rules/templates.ts` exporta templates `claude` (CLAUDE.md), `cursor` (AGENTS.md), `codex` (.codex/rules.md)
- `src/rules/merger.ts` faz merge entre markers:
  - `<!-- BEGIN: brain-injection -->`
  - `<!-- END: brain-injection -->`
- Se arquivo target não existe → cria com bloco gerado
- Se arquivo existe SEM markers → append bloco no final
- Se arquivo existe COM markers → substitui conteúdo entre markers
- Conteúdo gerado puxa facts scope `global` + `project:<cwd-basename>` via storage
- CLI integra: `brain rules generate --target=claude|cursor|codex [--out=PATH]`
- Default out: `CLAUDE.md`, `AGENTS.md`, `.codex/rules.md` no cwd
- Snapshot tests output gerado (estável)
- Idempotente: rodar 2x sem mudar facts → mesmo output

## 3. Prova surfaceável
- Comandos:
  - `npm test -- rules 2>&1 | grep -E "Tests:|passed"`
  - `npm test -- --coverage 2>&1 | grep -E "src/rules"`
  - `npx stryker run --mutate "src/rules/**/*.ts" 2>&1 | tail -10`
  - `npm run build 2>&1 | tail -5`
- Output esperado:
  - `Tests: N passed` com N≥10
  - coverage src/rules ≥80%
  - mutation ≥70%
  - build sem erros

## 4. Restrições

### Projeto
- NÃO usar template engine externo (Handlebars/EJS) — string literals TS
- NÃO sobrescrever conteúdo fora dos markers (preserva resto do CLAUDE.md user)
- NÃO criar arquivo target se dir destino não existe — erro estruturado
- Função ≤20 linhas
- Sem `Manager`/`Helper`/`Util`
- Sem boolean flag param
- Marker strings em constantes (`MARKER_BEGIN`, `MARKER_END`)

### Padrão
- TDD obrigatório
- NÃO --no-verify, NÃO @ts-ignore, NÃO lint disable
- NÃO modificar lockfiles
- Commits descritivos

## 5. Bound
- 15 turns

## 7. Condição final

```
Implementar src/rules/ do second-brain-mcp gerador CLAUDE.md/AGENTS.md/.codex/rules.md. Estado final: templates.ts com 3 templates (claude/cursor/codex), merger.ts faz merge entre markers <!-- BEGIN: brain-injection --> e <!-- END: brain-injection --> com 3 casos (arquivo nao existe = cria, existe sem markers = append, existe com markers = substitui conteudo interno), conteudo gerado puxa facts scope global + project:<cwd-basename>, CLI integra brain rules generate --target=claude|cursor|codex [--out=PATH], idempotente. Provar com `npm test -- rules 2>&1 | grep "Tests:"` mostrando >=10 testes passed 0 failed incluindo snapshot CLAUDE.md gerado e teste idempotencia (2x = mesmo output), `npm test -- --coverage 2>&1 | grep "src/rules"` >=80% coverage, `npx stryker run --mutate "src/rules/**/*.ts" 2>&1 | tail -10` mutation >=70%, `npm run build 2>&1 | tail -5` sem erros. Sem template engine externo (string literals TS), sem sobrescrever conteudo fora dos markers, sem criar arquivo se dir destino nao existe (erro estruturado), funcoes <=20 linhas, sem Manager/Helper/Util, sem boolean flag param, markers em constantes nomeadas, TDD obrigatorio, sem --no-verify, sem @ts-ignore, sem desabilitar lint, sem modificar lockfiles, sem mensagens de commit vagas, or stop after 15 turns. Report turn count, test count, coverage rules, mutation score e remaining bound each turn. Claude must echo full output of each verification command.
```

## 9. Checklist pré-entrega
- [x] ≤4000 chars
- [x] comandos + outputs
- [x] restrições
- [x] bound 15 turns
- [x] echo obrigatório
