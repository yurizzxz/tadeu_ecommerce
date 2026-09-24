# Visão arquitetural detalhada

## 1. Objetivo

Traduzir requisitos da DevStore em fronteiras implementáveis. Este documento detalha estrutura e fluxos; não substitui requisitos do `README.md`, decisões dos ADRs ou Scope Guard do `TASKS.md`.

## 2. Contexto

A aplicação roda como monólito modular Next.js na Vercel. Browser acessa páginas públicas e privadas. Next.js executa Server Components, Server Actions e handler do Better Auth. Drizzle acessa PostgreSQL no Neon. Imagens vêm de domínios externos permitidos.

## 3. Fronteiras funcionais

### Auth

- configura Better Auth e adapter Drizzle;
- fornece leitura server-side da sessão;
- mantém handler HTTP exigido pela biblioteca;
- não conhece carrinho ou pedidos.

### Catalog

- lê categorias, marcas e produtos;
- valida `searchParams`;
- produz consulta combinada;
- resolve produto por slug;
- não altera catálogo em runtime no MVP.

### Profile

- altera somente nome do usuário autenticado;
- cadastra um endereço manual;
- impede segundo endereço e acesso cruzado.

### Cart

- cria/obtém carrinho do usuário;
- adiciona um item por produto;
- altera ou remove quantidade;
- valida produto ativo e estoque atual;
- não calcula valor confiável para checkout fora do servidor.

### Orders

- monta revisão com valores atuais;
- finaliza pedido transacionalmente;
- lista/detalha pedidos próprios;
- cancela dentro da janela e repõe estoque;
- preserva snapshots comerciais.

### DB

- expõe cliente Drizzle server-only;
- define schema e relações;
- contém migrations versionadas e seed idempotente;
- não pode ser importado em Client Components.

## 4. Estrutura alvo indicativa

```text
src/
├── app/
│   ├── (public)/
│   ├── (auth)/
│   ├── (store)/
│   └── api/auth/[...all]/
├── features/
│   ├── auth/
│   ├── catalog/
│   ├── profile/
│   ├── cart/
│   └── orders/
├── db/
│   ├── schema/
│   ├── migrations/
│   └── seed/
├── components/
└── lib/
tests/
├── unit/
├── integration/
└── e2e/
```

Estrutura é direção, não autorização automática. Cada TASK define caminhos permitidos.

## 5. Regras de Server Components

- usar para consultas de páginas e metadata;
- validar `searchParams` antes de compor SQL;
- selecionar somente colunas necessárias;
- executar consultas independentes em paralelo quando útil;
- nunca importar segredo ou DB em Client Component;
- tratar `notFound`, estado vazio e erro esperado explicitamente.

## 6. Regras de Server Actions

Ordem mínima:

1. validar entrada;
2. obter sessão no servidor;
3. negar ausência de sessão;
4. derivar `userId` da sessão;
5. validar propriedade e invariantes;
6. executar Drizzle/transação;
7. invalidar dados afetados;
8. retornar resultado serializável e seguro.

Actions não recebem como verdade:

- `userId`;
- preço ou total;
- estado do pedido;
- estoque disponível;
- autorização;
- `createdAt` usado na janela de cancelamento.

## 7. Busca e filtros

Parâmetros previstos:

- `q`: texto normalizado;
- `category`: slug de categoria;
- `brand`: slug de marca;
- `minPrice`: centavos ou valor convertido com validação definida na implementação;
- `maxPrice`: idem;
- `available`: booleano normalizado.

Parâmetros vazios somem da URL. Combinações usam `AND`. Campos de texto buscáveis usam comparação case-insensitive. Valor inválido não chega ao ORM sem normalização.

## 8. Checkout

### Pré-condições

- sessão válida;
- carrinho pertencente ao usuário e não vazio;
- endereço único existente;
- todos os produtos ativos;
- todas as quantidades válidas.

### Transação

1. ler carrinho e linhas atuais de produto;
2. calcular valores em centavos no servidor;
3. baixar estoque com condição `stock >= quantity`;
4. confirmar que todas as baixas ocorreram;
5. criar `orders` com status `FINALIZED` e snapshot de endereço;
6. criar `order_items` com snapshots de nome, SKU e preço;
7. remover itens do carrinho;
8. commit.

Se qualquer passo falhar, rollback. O resultado de falha informa que catálogo/carrinho precisa ser revisto sem expor SQL.

## 9. Cancelamento

### Pré-condições

- sessão válida;
- pedido pertence ao usuário;
- estado atual `FINALIZED`;
- horário do servidor não ultrapassa `createdAt + 5 minutos`.

### Transação

1. efetuar transição condicional para `CANCELLED`;
2. verificar exatamente uma linha alterada;
3. incrementar estoque pelos snapshots de quantidade e referência do produto;
4. registrar `cancelledAt`;
5. commit.

Produto do pedido não deve ser removido fisicamente no ciclo normal. Caso referência seja anulável por retenção futura, a estratégia de reposição exige nova decisão.

## 10. Erros

- entrada inválida: resultado de validação por campo;
- não autenticado: redirecionamento/login ou erro tipado conforme contexto;
- recurso alheio: resposta sem revelar existência;
- conflito de estoque/preço: mensagem para revisar carrinho;
- janela expirada: mensagem determinística;
- erro inesperado: log server-side sanitizado + mensagem genérica.

## 11. Cache e consistência

- autenticação, carrinho e pedidos são dados personalizados e não usam cache público;
- catálogo pode usar estratégia de cache/revalidação compatível com seed/migrations;
- mutações revalidam somente caminhos/tags afetados;
- escolha final de cache ocorre na TASK correspondente após confirmar comportamento da versão fixada do Next.js.

## 12. Banco e migrations

- migrations são imutáveis após aplicadas em ambiente compartilhado;
- schema Better Auth deve ser gerado/validado contra versão fixada;
- constraints refletem invariantes simples;
- seed deve ser repetível ou falhar de forma clara sem duplicar chaves;
- banco de teste usa URL distinta e dados descartáveis;
- nenhuma TASK executa migration de produção ou deploy sem pedido explícito.

## 13. Qualidade

- TypeScript estrito;
- validação runtime nas fronteiras;
- componentes interativos mínimos;
- acessibilidade desde componentes base;
- testes de transação contra PostgreSQL real;
- E2E cobre jornada, não cada combinação interna;
- dependências adicionadas somente quando TASK autorizar.

## 14. Implantação futura

Vercel e Neon são alvos aprovados, mas planejamento não autoriza deploy. Antes de publicar, configurar variáveis, domínios de imagem, origem confiável do Better Auth, migrations e smoke tests. PD-004 permanece aberta até ambiente ser definido.

