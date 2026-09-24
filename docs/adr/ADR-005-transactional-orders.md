# ADR-005 — Checkout e cancelamento transacionais

## Status

ACCEPTED

## Contexto

Não existe pagamento. Confirmar checkout já cria pedido `FINALIZED`. O cliente pode cancelar por 5 minutos. Estoque não pode ficar negativo nem ser reposto duas vezes.

## Problema

Proteger pedido, carrinho e inventário contra dados antigos, falhas intermediárias, repetição e concorrência.

## Alternativas consideradas

1. transação PostgreSQL síncrona com condições atômicas;
2. operações sequenciais sem transação;
3. reserva temporária de estoque;
4. fila/eventos e consistência eventual.

## Decisão

Checkout e cancelamento são transações PostgreSQL síncronas.

No checkout, servidor carrega dados atuais, valida propriedade/endereço, baixa cada estoque com condição suficiente, cria snapshots, cria pedido/itens e limpa carrinho. Qualquer falha reverte tudo.

No cancelamento, servidor condiciona a transição ao proprietário, estado `FINALIZED` e `createdAt + 5 minutos`. Somente uma transição bem-sucedida repõe estoque e grava `cancelledAt`.

## Justificativa

Operação é curta e local ao mesmo banco. Transação síncrona fornece consistência forte com menor complexidade. Reserva de estoque não serve ao fluxo sem etapa intermediária de pagamento. Fila seria excesso para o MVP.

## Consequências

### Positivas

- nenhuma finalização parcial;
- estoque protegido contra saldo negativo;
- cancelamento idempotente no efeito de estoque;
- histórico preservado por snapshots.

### Negativas

- contenção possível sob concorrência;
- implementação precisa tratar retry/erro transacional;
- testes exigem banco real e cenários concorrentes.

## RF/RN/RNF/UC relacionados

RF-009 a RF-012; RN-009 a RN-016, RN-018; RNF-002, RNF-009, RNF-011; UC-008 a UC-011.

