# Verificação parcial de acessibilidade — TASK-016

Em 20/11/2026 foram inspecionadas capturas do Chrome em 320 e 1280 pixels da home, catálogo, entrada, conta, perfil, carrinho, checkout e histórico de pedidos com dados de teste. A inspeção identificou campos de autenticação sem contorno visível e ações da conta sem diferenciação visual; foram aplicadas correções localizadas. A entrada corrigida foi inspecionada novamente nos dois tamanhos; a conta corrigida ainda não foi inspecionada visualmente.

O código foi examinado quanto a idioma, regiões, títulos, rótulos, foco visível e mensagens de estado. Os testes executados no Chrome verificaram axe nas páginas públicas e na jornada autenticada, noindex, ausência de overflow e ativação por teclado de ações de checkout e cancelamento. A jornada aguarda agora o fim das navegações antes dessas verificações.

O usuário informou que a inspeção manual interativa proposta funcionou. O roteiro solicitado cobriu navegação por teclado, foco visível, home, catálogo, autenticação, perfil, carrinho, checkout, cancelamento e revisão visual da conta, incluindo janela estreita. Este registro é baseado no relato do usuário; não recebemos detalhes sobre navegador, versão ou cada passo isoladamente.

Limites: não houve teste com leitor de tela nem comprovação de conformidade integral WCAG. O usuário aceitou Safari temporariamente não validado; WebKit no Windows não substitui Safari e o teste de foco inicial nesse ambiente falhou.
