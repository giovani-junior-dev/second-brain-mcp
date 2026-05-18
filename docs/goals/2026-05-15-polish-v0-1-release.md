# Goal Plan — polish-v0-1-release (F8)

## 1. Contexto
- Repo: `<repo>/`
- Stack: TS + npm publish
- Pré-req: F1-F7 done

## 2. Estado final mensurável
- `README.md` completo:
  - O que é + por quê
  - Quick install (`npx second-brain-mcp`)
  - Config CC `.claude/settings.json` exemplo
  - Exemplo recall/write
  - Roadmap v0.2+
  - License MIT badge
- `LICENSE` MIT presente
- `package.json` campos completos: `name`, `version: 0.1.0`, `description`, `bin`, `main`, `types`, `files`, `keywords`, `author`, `license: MIT`, `repository`, `engines.node: >=20`
- Integration test E2E: subprocess stdio → MCP client mock → chama `brain.recall` → recebe `<brain-context>` fence válido
- `npm publish --dry-run` exits 0
- `npm pack` gera tarball válido
- Coverage total ≥80%
- Stryker mutation ≥70% global
- `examples/` dir com 1 exemplo Claude Code integration

## 3. Prova surfaceável
- Comandos:
  - `npm test 2>&1 | tail -10`
  - `npm test -- --coverage 2>&1 | grep -E "All files"`
  - `npx stryker run 2>&1 | tail -15`
  - `npm run build 2>&1 | tail -5`
  - `npm publish --dry-run 2>&1 | tail -20`
  - `npm pack --dry-run 2>&1 | tail -10`
  - `ls README.md LICENSE examples/ 2>&1`
- Output esperado:
  - `Tests: N passed` com N≥80 global
  - coverage All files ≥80%
  - mutation score ≥70%
  - build sem erros
  - publish dry-run sem erros
  - pack lista arquivos esperados (dist/, README, LICENSE)
  - README/LICENSE/examples existem

## 4. Restrições

### Projeto
- NÃO publicar de verdade (só dry-run)
- NÃO incluir `tests/`, `docs/`, `node_modules/` no tarball (`files` field whitelist)
- NÃO commitar `.npmrc` com token
- README sem emojis (regra global user)
- Examples práticos, não pseudo-código
- E2E test usa subprocess real, não mock total

### Padrão
- TDD para integration test (RED primeiro)
- NÃO --no-verify, NÃO @ts-ignore, NÃO lint disable
- NÃO modificar lockfiles
- Commit final: `chore: release v0.1.0`

## 5. Bound
- 15 turns

## 7. Condição final

```
Polish e release prep do second-brain-mcp v0.1.0. Estado final: README.md completo (descricao + quick install + config CC exemplo + exemplo recall/write + roadmap + MIT badge), LICENSE MIT presente, package.json com name/version 0.1.0/description/bin/main/types/files whitelist/keywords/author/license MIT/repository/engines.node >=20, integration test E2E subprocess stdio MCP chamando brain.recall recebendo <brain-context> fence, examples/ dir com 1 exemplo Claude Code integration. Provar com `npm test 2>&1 | tail -10` mostrando >=80 testes passed 0 failed, `npm test -- --coverage 2>&1 | grep "All files"` >=80% coverage total, `npx stryker run 2>&1 | tail -15` mutation score >=70% global, `npm run build 2>&1 | tail -5` sem erros, `npm publish --dry-run 2>&1 | tail -20` exits 0 sem erros, `npm pack --dry-run 2>&1 | tail -10` lista dist + README + LICENSE, `ls README.md LICENSE examples/` mostra os 3 existindo. Sem publicar de verdade (so dry-run), sem incluir tests/docs/node_modules no tarball (files field whitelist), sem .npmrc com token, README sem emojis, examples praticos nao pseudo-codigo, E2E test usa subprocess real, TDD para integration test (RED primeiro), sem --no-verify, sem @ts-ignore, sem desabilitar lint, sem modificar lockfiles, commit final chore: release v0.1.0, or stop after 15 turns. Report turn count, test count global, coverage total, mutation score global, publish dry-run status e remaining bound each turn. Claude must echo full output of each verification command.
```

## 9. Checklist pré-entrega
- [x] ≤4000 chars
- [x] comandos + outputs
- [x] restrições
- [x] bound 15 turns
- [x] echo obrigatório
