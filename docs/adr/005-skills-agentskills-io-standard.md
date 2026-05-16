# ADR-005: Skills no formato agentskills.io

## Status
Accepted — 2026-05-15

## Contexto
Skills geradas pelo curator precisam formato definido. Opções: inventar próprio, agentskills.io standard, formato Anthropic Claude skills.

## Decisão
**agentskills.io standard**. Layout: `skills/<name>/SKILL.md` com frontmatter YAML.

```yaml
---
name: skill-name
description: One-line summary
version: 0.1.0
tags: [tag1, tag2]
scope: global | project:<id>
---

# Skill body markdown
```

## Razões
- Padrão aberto comunitário
- Compatibilidade Hermes (importa/exporta sem conversão)
- Compatibilidade OpenClaw migration path
- Não reinventa roda
- Skills Hub (agentskills.io) ecosystem rico

## Rejeitados
- **Formato próprio**: lock-in, fragmenta ecosystem
- **Anthropic Claude skills format**: proprietário, mudanças não-anunciadas

## Trade-offs aceitos
- Frontmatter YAML adiciona dep `gray-matter` (4kb)
- Mudanças no standard agentskills.io exigem update — risco baixo (community-driven)
