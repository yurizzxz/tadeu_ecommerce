# Contrato operacional dos agentes

**Este documento define as regras obrigatórias para qualquer agente de programação que opere neste repositório.**

## 1. Objetivo

Implementar a DevStore de forma incremental, rastreável e limitada por TASK. O agente deve ensinar decisões relevantes, evitar overengineering e separar necessidade de MVP de complexidade futura.

Este documento não autoriza iniciar implementação. O usuário precisa autorizar cada TASK ou um conjunto explícito de TASKs.

## 2. Fontes de verdade

| Fonte | Responsabilidade |
|---|---|
| `README.md` | requisitos, regras, domínio, arquitetura, interfaces e escopo |
| `docs/adr/` | decisões arquiteturais aceitas e suas consequências |
| `AGENTS.md` | processo, comportamento e restrições do agente |
| `TASKS.md` | backlog, dependências, estados, critérios e Scope Guard |
| código/testes | implementação atual, nunca autoridade para mudar requisito sozinho |

### Precedência para leitura

1. requisitos aprovados do `README.md`;
2. ADRs `ACCEPTED`;
3. este contrato;
4. TASK atual;
5. código e testes existentes.

Precedência ajuda a detectar conflito; não autoriza resolvê-lo. Conflito relevante exige parada e decisão do usuário.

## 3. Ordem obrigatória de leitura

Antes de executar uma TASK:

1. ler `AGENTS.md` completo;
2. ler seções relacionadas do `README.md`;
3. ler índice e TASK completa em `TASKS.md`;
4. ler ADRs relacionados;
5. inspecionar código e testes existentes;
6. verificar estado Git e alterações do usuário;
7. validar dependências e Definition of Ready;
8. confirmar autorização do usuário.

## 4. Proibições permanentes

- não executar comando, instalar pacote, alterar arquivo, criar branch ou commit antes de autorização para a TASK;
- não fazer deploy sem pedido explícito e separado;
- não acessar, migrar, seedar ou alterar produção sem pedido explícito;
- não implementar TASK `BLOCKED`;
- não ignorar dependência;
- não inventar requisito ou regra de negócio;
- não alterar arquitetura sem ADR aceito;
- não criar repository: ADR-002 aceita acesso direto ao Drizzle;
- não antecipar funcionalidade de TASK futura;
- não remover teste, validação ou constraint para obter verde;
- não confiar em `userId`, preço, total, estoque, estado ou horário vindos do cliente;
- não registrar senha, token, cookie, string de conexão ou endereço completo;
- não alterar contrato público sem autorização;
- não usar alteração incidental para scope creep;
- não afirmar que comando/teste passou sem executá-lo;
- não sobrescrever alteração existente do usuário;
- não usar comandos Git destrutivos sem pedido explícito.

## 5. Seleção da TASK

Quando o usuário autorizar continuar:

1. localizar primeira TASK `READY` no índice;
2. confirmar que todas as `DEPENDS_ON` estão `DONE`;
3. confirmar que artefatos das dependências existem;
4. executar testes relevantes das dependências quando exigidos;
5. validar RF, RN, RNF, UC e ADR relacionados;
6. validar critérios de aceitação e Scope Guard;
7. confirmar Definition of Ready;
8. criar/selecionar branch da TASK;
9. mudar `READY -> IN_PROGRESS`;
10. implementar somente a TASK.

Se nenhuma TASK estiver `READY`, informar motivo e parar.

## 6. Autorização e comandos

- pedido explícito como “execute TASK-001” autoriza comandos e mudanças locais necessários dentro do Scope Guard dessa TASK;
- instalação de dependências somente é permitida quando constar nos artefatos necessários da TASK autorizada;
- comando adicional fora do escopo exige nova autorização;
- operação externa, deploy, produção e exclusão destrutiva sempre exigem autorização explícita própria;
- ferramentas devem ser escolhidas pelo menor impacto necessário;
- falha de sandbox ou rede não autoriza contorno silencioso.

## 7. Branches

Branch estável: `main`.

Nunca desenvolver diretamente em `main`.

Padrões:

```text
feature/TASK-xxx-descricao-curta
fix/TASK-xxx-descricao-curta
chore/TASK-xxx-descricao-curta
test/TASK-xxx-descricao-curta
```

Regras:

- uma branch por TASK, salvo decisão explícita;
- se TASK-001 encontrar diretório sem Git, inicializar repositório e `main` faz parte do bootstrap somente após autorização;
- não apagar, resetar ou limpar alterações preexistentes;
- worktree suja exige distinguir mudanças do usuário e da TASK;
- conflito com mudança do usuário exige parar.

## 8. Commits

Usar Conventional Commits:

```text
<tipo>(<escopo>): <descrição> [TASK-xxx]
```

Tipos: `feat | fix | test | refactor | docs | chore | build | ci`.

Regras:

- commits pequenos, coesos e ligados à TASK;
- não misturar mudança alheia;
- não fazer amend, rebase, force push ou push sem pedido explícito;
- commit local faz parte da DoD somente quando Git existe e usuário autorizou execução completa da TASK;
- estado final e relatório precisam citar commits realmente existentes.

## 9. Scope Guard

### PRIMARY

Mudança diretamente necessária ao objetivo e dentro de `Allowed Changes`.

### INCIDENTAL

Mudança fora do escopo primário permitida somente quando for simultaneamente:

- pequena e localizada;
- diretamente causada pela TASK;
- tecnicamente necessária;
- sem valor funcional independente;
- incapaz de ampliar escopo;
- sem nova regra de negócio;
- sem decisão arquitetural relevante;
- fora de qualquer `Forbidden Changes`.

Exemplos: import, export, tipo compartilhado diretamente afetado, ajuste mínimo de configuração.

Não incidental: nova dependência relevante, migration imprevista, mudança pública, alteração multi-módulo, refatoração estrutural, regra nova ou arquitetura nova.

### FORBIDDEN

Fronteira absoluta da TASK. Necessidade de cruzá-la exige `SCOPE ESCALATION` e parada.

### Validação pós-implementação

Classificar todo arquivo alterado como `PRIMARY` ou `INCIDENTAL`. Registrar toda mudança incidental no relatório. Se nenhuma existir, registrar `Incidental Changes: NONE`.

## 10. Scope Escalation

Quando mudança necessária não for incidental:

```text
## SCOPE ESCALATION

TASK: TASK-xxx
Necessidade identificada: ...
Motivo: ...
Arquivos/módulos afetados: ...
Allowed Changes atual: ...
Forbidden Changes relacionado: ...
Por que não é Incidental Change: ...
Impacto se não realizada: ...
Alternativas:
1. ampliar Allowed Changes;
2. criar nova TASK;
3. alterar dependências;
4. criar/atualizar ADR;
5. revisar arquitetura.
Recomendação: ...
Decisão necessária: ...
```

Parar e aguardar decisão.

## 11. Regras arquiteturais

- manter monólito modular definido no ADR-001;
- Server Components fazem leituras de página;
- Server Actions fazem mutações e são tratadas como endpoints públicos;
- Better Auth pode usar Route Handler exigido pela biblioteca;
- Server Actions acessam Drizzle diretamente conforme ADR-002;
- não criar repository “para o futuro”;
- extrair serviço/use case somente com reutilização ou complexidade comprovada e TASK/ADR apropriada;
- módulos não importam internals de outro módulo sem contrato claro;
- cliente nunca importa módulo server-only, Drizzle ou segredo;
- regra de domínio crítica precisa existir no servidor, mesmo quando UI também valida;
- PostgreSQL é fonte de verdade.

## 12. Segurança obrigatória

Cada Server Action deve:

1. validar entrada em runtime;
2. obter sessão no servidor;
3. derivar `userId` da sessão;
4. validar propriedade do recurso;
5. carregar preço, estoque, estado e tempo no servidor;
6. executar mutação protegida;
7. retornar erro seguro e serializável.

Checkout e cancelamento exigem transação PostgreSQL. Baixa de estoque deve ser condicional. Cancelamento só repõe estoque após transição única de `FINALIZED` para `CANCELLED`.

## 13. Dados e migrations

- usar Drizzle Kit e migrations versionadas;
- nunca editar migration aplicada em ambiente compartilhado; criar nova;
- usar `timestamptz` para instantes;
- usar centavos inteiros para dinheiro;
- representar invariantes simples com constraints/índices;
- schema Better Auth precisa acompanhar versão fixada;
- teste usa banco separado e descartável;
- seed precisa ser reproduzível e nunca roda em produção sem autorização;
- mudança de schema não prevista pela TASK exige parada.

## 14. Qualidade de código

- TypeScript estrito; evitar `any` e casts sem prova;
- nomes explícitos e consistentes com domínio;
- validar fronteiras, não espalhar validação redundante;
- manter Server Actions pequenas e coesas;
- evitar abstrações de uma implementação sem ganho real;
- preservar Server/Client Component boundary;
- tratar loading, vazio, erro e sucesso quando aplicável;
- manter HTML semântico, foco visível, labels e teclado;
- código, comentários, documentação e mensagens persistidas usam linguagem normal, não estilo conversacional comprimido.

## 15. Quality Gates

| Gate | Nome | Obrigatório quando |
|---|---|---|
| GATE-01 | Build | toda TASK com código/configuração de runtime |
| GATE-02 | Lint | toda TASK com código |
| GATE-03 | Typecheck | toda TASK com TypeScript |
| GATE-04 | Unit Tests | regras/validações alteradas |
| GATE-05 | Integration Tests | banco, auth, queries ou transações alterados |
| GATE-06 | E2E Tests | fluxo de usuário alterado |
| GATE-07 | Security Checks | autenticação, autorização ou dados alterados |
| GATE-08 | Acceptance Criteria | sempre |
| GATE-09 | Regression Tests | quando comportamento existente puder ser afetado |
| GATE-10 | Scope Validation | sempre |

N/A exige justificativa. Falha obrigatória impede `DONE`.

## 16. Definition of Ready

Confirmar todos:

- TASK está `READY`;
- requisitos e critérios definidos;
- dependências `DONE` e verificadas;
- ADRs necessários resolvidos;
- contratos e testes esperados definidos;
- nenhuma pendência bloqueante;
- Scope Guard executável;
- autorização recebida.

Caso contrário, mudar/manter `BLOCKED`, explicar e parar.

## 17. Ciclo de estado

Fluxo normal:

```text
BLOCKED -> READY -> IN_PROGRESS -> IN_REVIEW -> DONE
```

Falha:

```text
IN_PROGRESS | IN_REVIEW -> FAILED
```

Regras:

- `READY -> IN_PROGRESS` somente após validação e branch;
- `IN_PROGRESS -> IN_REVIEW` quando implementação/testes previstos terminarem;
- `IN_REVIEW -> DONE` somente após gates e Scope Guard;
- `FAILED` precisa correção e nova validação;
- nunca marcar `DONE` por proximidade ou intenção.

## 18. Critérios de parada

Parar quando houver:

- requisito ambíguo capaz de mudar comportamento;
- contradição entre fontes;
- dependência ausente/inválida;
- regra de negócio indefinida;
- arquitetura necessária sem ADR;
- mudança significativa de escopo;
- necessidade de violar `Forbidden Changes`;
- risco de segurança ou perda de dados não previsto;
- quebra de contrato público;
- teste anterior falhando por causa externa à TASK;
- alteração do usuário no mesmo trecho;
- necessidade de produção/deploy sem autorização.

Formato:

```text
## BLOCKER

TASK: TASK-xxx
Problema: ...
Impacto: ...
RF/RN/RNF/UC/ADR afetados: ...
Alternativas: ...
Recomendação: ...
Decisão necessária: ...
```

## 19. Atualização documental

### Atualizar `TASKS.md` quando

- estado mudar;
- blocker, falha, Scope Escalation ou TASK nova for aprovado;
- dependência/ordem operacional mudar;
- relatório de execução for registrado.

### Atualizar `README.md` somente quando

- requisito, regra, escopo, domínio, arquitetura, interface ou risco estrutural mudar.

Não atualizar README para status, comando, teste, branch ou commit.

### Atualizar ADR quando

- decisão arquitetural nova for necessária;
- decisão aceita mudar: criar ADR novo ou marcar `SUPERSEDED`, preservando histórico.

IDs RF/RN/RNF/UC/TASK/ADR/PD nunca são reutilizados ou renumerados por conveniência.

## 20. Relatório final

Ao concluir ou falhar, usar template de `TASKS.md`. Incluir:

- branch e commits reais;
- mudanças primárias;
- tabela de mudanças incidentais ou `NONE`;
- comandos/testes executados e resultados;
- gates PASS/FAIL/N/A;
- validação do Scope Guard;
- DoD;
- próxima TASK elegível.

Depois do relatório, parar. Próxima TASK exige nova autorização, salvo autorização contínua explícita.

## 21. Regra de continuidade

Concluir TASK não autoriza próxima. Autorização “execute todas as TASKs READY respeitando dependências” permite continuidade, mas exige ciclo completo, branch/escopo/gates/relatório para cada TASK.
