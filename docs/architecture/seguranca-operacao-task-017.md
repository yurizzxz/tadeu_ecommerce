# Segurança e operação — TASK-017

## Revisão

- As actions de perfil, carrinho, checkout e cancelamento validam entradas e obtêm sessão no servidor. Consultas de carrinho e pedidos restringem propriedade; checkout e cancelamento usam transações. Os testes existentes exercitam isolamento, entradas inválidas e concorrência.
- Persistência e autenticação server-side usam `server-only`. `next.config.ts` restringe imagens remotas a `https://placehold.co/800x800/png`.
- `.env` está ignorado e apenas `.env.example` é versionado. O teste `secret-exposure.test.mjs` não encontrou os valores configurados de URLs de banco e segredo de autenticação nos arquivos rastreados examinados ou no bundle cliente existente; isso não é uma varredura de todos os segredos possíveis, histórico Git ou arquivos não rastreados.
- Falhas inesperadas tratadas nas actions de perfil, carrinho, checkout e cancelamento e nas leituras públicas da home e do catálogo produzem JSON com nível, evento e operação fixa. Nenhum objeto de erro, dado de formulário ou identificador é incluído. Testes injetam falhas e verificam o formato e a ausência da mensagem do erro. A biblioteca e o runtime podem gerar seus próprios logs; sua sanitização completa não foi comprovada.
- O servidor de teste agora recusa URLs de teste e aplicação idênticas. Igualdade textual não detecta aliases ou URLs diferentes para o mesmo banco; confirme a identidade e o isolamento no provedor antes de executar testes que alterem dados.

## Operação local e testes

1. Use Node e pnpm compatíveis com o projeto. Configure as variáveis de `.env.example` em `.env` local sem compartilhar seus valores. Use segredo aleatório exclusivo e URLs de bancos separados.
2. Confirme no provedor que `TEST_DATABASE_URL` aponta para banco descartável distinto do desenvolvimento e de produção. Comparar strings não basta para comprovar isolamento.
3. Para aplicar migrations versionadas **ao banco de teste**, use `node tests/integration/db/migrate-test.mjs`. Esse comando modifica o banco de teste; não use o argumento `resolve-initial` como procedimento normal de recuperação.
4. Para popular o catálogo demonstrativo **no banco de teste**, use `node node_modules/tsx/dist/cli.mjs src/db/seed/index.ts`. O seed usa upsert e atualiza produtos existentes; execute somente em banco descartável autorizado.
5. Execute `pnpm test` para regras e integração, `node tests/integration/db/constraints.mjs` para constraints e `node tests/integration/auth/test-server.mjs` seguido de `pnpm test:e2e` para Playwright. O servidor de teste exige build anterior e usa `TEST_DATABASE_URL`.

## Recuperação e produção

Não foi testado backup ou restauração. Consulte as capacidades e o plano contratado do provedor; antes de restaurar, identifique ambiente, ponto de recuperação, impacto e destino isolado, e obtenha autorização específica. Nenhuma migration, seed, restauração ou deploy em produção está autorizado por este documento. Não registre URLs, tokens, cookies, senhas ou endereços completos em logs ou relatórios.
