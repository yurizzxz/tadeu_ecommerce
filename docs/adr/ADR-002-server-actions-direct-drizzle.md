# ADR-002 — Server Actions e acesso direto ao Drizzle

## Status

ACCEPTED

## Contexto

O usuário decidiu manter casos de uso simples dentro das Server Actions e dispensar repository. PostgreSQL existe desde a versão inicial; troca transparente de fonte de dados deixou de ser requisito.

## Problema

Definir onde ficam validação, autorização, regra da operação e persistência sem criar camadas sem uso real.

## Alternativas consideradas

1. Server Actions chamando Drizzle diretamente;
2. Server Actions chamando serviços/use cases separados;
3. repository + use cases independentes do ORM;
4. API REST interna consumida pelo frontend.

## Decisão

Leituras ocorrem em Server Components com Drizzle. Mutações usam Server Actions pequenas que validam entrada, sessão, propriedade e regra da operação antes de chamar Drizzle diretamente. Route Handlers próprios não serão criados sem necessidade externa.

## Justificativa

O escopo é pequeno, usa uma única interface e uma única fonte de dados. Repository não entregaria substituição necessária no MVP. Server Actions são adequadas a mutações originadas pela UI; leituras não usam actions porque podem ser feitas diretamente no servidor e actions são enfileiradas.

## Consequências

### Positivas

- menos indireção e arquivos;
- fluxo fácil de seguir;
- transações próximas da regra que protegem;
- menor tempo de implementação.

### Negativas

- acoplamento explícito ao Drizzle;
- troca de ORM/fonte exige refatoração;
- actions podem crescer se não houver disciplina;
- regras reutilizadas devem ser extraídas quando duplicação real surgir.

## Guardrails

- toda action valida sessão e autorização internamente;
- `userId`, preços, totais, estados e estoque nunca vêm como verdade do cliente;
- validação runtime precede acesso ao banco;
- regra transacional permanece dentro de uma única transação;
- extrair serviço é permitido somente por necessidade concreta e TASK autorizada.

## RF/RN/RNF/UC relacionados

RF-006 a RF-012; RN-006 a RN-016; RNF-001, RNF-002, RNF-010; UC-005 a UC-011.

