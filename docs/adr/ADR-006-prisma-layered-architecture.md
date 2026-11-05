# ADR-006 — Prisma e arquitetura em camadas

## Status

ACCEPTED

## Contexto e decisão

O projeto permanece um monólito modular Next.js conforme ADR-001, com PostgreSQL como fonte de verdade. Por decisão do usuário, Prisma e Prisma Migrate substituem Drizzle e Drizzle Kit. Better Auth continua responsável por autenticação com e-mail e senha, usando seu adapter Prisma para PostgreSQL. Este ADR substitui ADR-002 e ADR-004; os demais requisitos de autenticação do ADR-004 permanecem válidos.

Cada módulo organiza suas responsabilidades em apresentação, aplicação e persistência. Server Components recebem dados para leituras; Server Actions são fronteiras públicas de mutação, validam entrada e sessão e delegam operações à camada de aplicação. A aplicação concentra autorização e regras de operação; a persistência executa consultas Prisma. Não é necessário criar interfaces de repository ou abstrações para uma troca hipotética de banco.

## Alternativas e consequências

O acesso direto nas actions exige menos arquivos, mas mistura coordenação e transporte. Uma arquitetura com interfaces para toda persistência aumenta isolamento, porém adiciona custo sem requisito atual de substituição de banco. Camadas simples explicitam responsabilidades ao custo de mais arquivos e chamadas; o ORM continua sendo uma dependência concreta da persistência.

## Restrições

- Sessão e identidade são verificadas no servidor; dados críticos nunca são confiados ao cliente.
- Checkout e cancelamento permanecem atômicos em uma única transação PostgreSQL, com atualizações condicionais de estoque e estado.
- Constraints, índices e migrations versionadas continuam obrigatórios; quando o schema Prisma não expressar uma constraint necessária, a migration SQL deve preservá-la.
- A integração Better Auth e o schema devem ser verificados com as versões fixadas e documentação oficial durante a TASK correspondente.
- Nenhum módulo de persistência, cliente Prisma ou segredo pode entrar em Client Components.

## Relacionamentos

RF-005 a RF-012; RN-005 a RN-016, RN-018; RNF-001, RNF-002, RNF-010, RNF-011; ADR-001, ADR-003, ADR-005.
