# ADR-003 — PostgreSQL gerenciado pelo Neon

## Status

ACCEPTED

## Contexto

Carrinho, estoque, pedido e cancelamento exigem integridade relacional e transações. A hospedagem futura prevista é Vercel.

## Problema

Escolher persistência que suporte constraints, concorrência, ambiente de teste isolado e operação simples.

## Alternativas consideradas

1. PostgreSQL no Neon;
2. PostgreSQL em outro provedor;
3. banco documental;
4. armazenamento local no navegador.

## Decisão

Usar PostgreSQL gerenciado pelo Neon desde a versão 1.0. Desenvolvimento/teste usam conexão separada, preferencialmente uma branch Neon dedicada. Drizzle Kit controla migrations e seed controlado popula catálogo.

## Justificativa

PostgreSQL fornece transações e constraints adequadas às invariantes. Neon reduz operação, integra bem com ambientes serverless e permite branches isoladas. `localStorage` não atende autenticação, concorrência ou fonte central de verdade.

## Consequências

### Positivas

- integridade relacional;
- transações atômicas;
- ambientes isoláveis;
- operação simplificada.

### Negativas

- dependência do provedor e da rede;
- limites e custos seguem plano contratado;
- testes de integração precisam gerenciar dados e conexão.

## RF/RN/RNF/UC relacionados

RF-002 a RF-012; RN-001 a RN-018; RNF-002, RNF-005, RNF-009, RNF-012; UC-001 a UC-011.

