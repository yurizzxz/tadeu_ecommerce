# ADR-001 — Monólito modular com Next.js App Router

## Status

ACCEPTED

## Contexto

DevStore é um MVP de portfólio com catálogo, autenticação, carrinho e pedidos. A equipe não precisa operar serviços independentes, filas ou integrações externas complexas.

## Problema

Escolher uma arquitetura que mantenha fronteiras compreensíveis sem criar custo operacional ou abstrações prematuras.

## Alternativas consideradas

1. monólito modular em Next.js;
2. frontend Next.js + API backend separada;
3. microsserviços por domínio.

## Decisão

Usar uma aplicação Next.js App Router organizada por módulos funcionais. Server Components atendem leituras. Server Actions atendem mutações. Better Auth usa o Route Handler exigido pela integração.

## Justificativa

Uma unidade de deploy cobre todo o escopo. Módulos preservam separação conceitual. Backend separado duplicaria contratos e operação sem necessidade atual. Microsserviços seriam incompatíveis com escala e equipe previstas.

## Consequências

### Positivas

- menor custo de desenvolvimento e operação;
- tipos e componentes compartilhados;
- transações locais ao mesmo banco;
- evolução incremental por domínio.

### Negativas

- aplicação e backend evoluem juntos;
- fronteiras dependem de disciplina estrutural;
- extração futura de serviço exigirá novo contrato e ADR.

## RF/RN/RNF/UC relacionados

RF-001 a RF-014; RNF-005, RNF-009, RNF-010; UC-001 a UC-011.

