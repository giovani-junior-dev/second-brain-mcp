# Goal Plan — add-skills-format (F5)

## 1. Contexto
- Repo: `C:/Users/Script7/Desktop/second-brain-mcp/`
- Stack: TS + gray-matter (frontmatter YAML)
- Pré-req: F2 (storage) done. Recomendado F4 (curator) done.
- Standard: agentskills.io (compatibilidade Hermes/OpenClaude)

## 2. Estado final mensurável
- `src/skills/parser.ts` lê `skills/<name>/SKILL.md` com frontmatter YAML
- `src/skills/writer.ts` escreve SKILL.md com frontmatter (name, description, version, tags, scope)
- `src/skills/validator.ts` valida schema (Zod) — campos obrigatórios: `name`, `description`
- `src/skills/discovery.ts` lista skills no dir `~/.brain/skills/` recursivo
- Round-trip parse→write→parse retorna conteúdo idêntico (idempotente)
- Snapshot tests do output SKILL.md gerado
- Skills duplicadas (mesmo name) bloqueadas (REQ unique)

## 3. Prova surfaceável
- Comandos:
  - `npm test -- skills 2>&1 | grep -E "Tests:|passed"`
  - `npm test -- --coverage 2>&1 | grep -E "src/skills"`
  - `npx stryker run --mutate "src/skills/**/*.ts" 2>&1 | tail -10`
  - `npm run build 2>&1 | tail -5`
- Output esperado:
  - `Tests: N passed` com N≥10
  - coverage src/skills ≥80%
  - mutation ≥70%
  - build sem erros

## 4. Restrições

### Projeto
- NÃO inventar formato — seguir agentskills.io spec
- NÃO importar fora de `src/skills/` exceto types compartilhados
- Frontmatter YAML único separador `---` no topo
- Função ≤20 linhas
- Sem boolean flag param
- Sem `Manager`/`Helper`/`Util`

### Padrão
- TDD obrigatório
- NÃO --no-verify, NÃO @ts-ignore, NÃO lint disable
- NÃO modificar lockfiles
- Commits descritivos

## 5. Bound
- 15 turns

## 7. Condição final

```
Implementar src/skills/ do second-brain-mcp seguindo agentskills.io standard. Estado final: parser.ts le skills/<name>/SKILL.md com frontmatter YAML via gray-matter, writer.ts escreve SKILL.md idempotente, validator.ts valida schema Zod (name e description obrigatorios), discovery.ts lista skills recursivo em ~/.brain/skills/. Round-trip parse-write-parse idempotente. Provar com `npm test -- skills 2>&1 | grep "Tests:"` mostrando >=10 testes passed 0 failed incluindo round-trip e snapshot SKILL.md, `npm test -- --coverage 2>&1 | grep "src/skills"` >=80% coverage, `npx stryker run --mutate "src/skills/**/*.ts" 2>&1 | tail -10` mutation >=70%, `npm run build 2>&1 | tail -5` sem erros. Sem inventar formato (seguir agentskills.io), sem importar fora de src/skills exceto types, frontmatter unico separador --- no topo, funcoes <=20 linhas, sem boolean flag param, sem Manager/Helper/Util, TDD obrigatorio, sem --no-verify, sem @ts-ignore, sem desabilitar lint, sem modificar lockfiles, sem mensagens de commit vagas, or stop after 15 turns. Report turn count, test count, coverage skills, mutation score e remaining bound each turn. Claude must echo full output of each verification command.
```

## 9. Checklist pré-entrega
- [x] ≤4000 chars
- [x] comandos + outputs
- [x] restrições projeto + padrão
- [x] bound 15 turns
- [x] echo obrigatório
