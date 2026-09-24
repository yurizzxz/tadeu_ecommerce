# ADR-004 — Better Auth com e-mail e senha

## Status

ACCEPTED

## Contexto

Adicionar ao carrinho e concluir jornada de compra exigem conta. O MVP não terá provedores sociais, confirmação de e-mail ou recuperação de senha.

## Problema

Fornecer identidade e sessão seguras sem implementar armazenamento de senha ou protocolo de sessão manualmente.

## Alternativas consideradas

1. Better Auth com adapter Drizzle;
2. autenticação própria;
3. serviço SaaS de identidade externo;
4. autenticação simulada no navegador.

## Decisão

Usar Better Auth com e-mail/senha habilitado e adapter Drizzle para PostgreSQL. Cadastro exige nome, e-mail único e senha. Confirmação de e-mail, recuperação de senha e login social ficam fora do MVP.

## Justificativa

A biblioteca assume hashing, sessão e schema de autenticação. Autenticação própria amplia risco. Simulação no navegador não protege dados reais. SaaS externo adicionaria outro fornecedor sem benefício necessário.

## Consequências

### Positivas

- senha e sessão seguem biblioteca especializada;
- integração com banco e Next.js;
- menor superfície de código de segurança próprio.

### Negativas

- dependência do schema e API da biblioteca;
- migrations precisam acompanhar versão fixada;
- ausência de confirmação/rate limiting mantém risco aceito para projeto de portfólio.

## RF/RN/RNF/UC relacionados

RF-005 a RF-012; RN-005 a RN-016; RNF-001, RNF-013; UC-004 a UC-011.

