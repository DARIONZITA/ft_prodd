# Backlog detalhado – Task Manager

## NÍVEL A — CRÍTICO (produto mínimo utilizável)

Estado entregue: plataforma básica funcional com workspaces, colunas customizáveis (com defaults), tarefas em colunas e drag & drop completo.

### US-01 – Setup de Arquitetura React + Express

- Criar estrutura inicial do projeto frontend (React) e backend (Express) separadamente.
- Criar pastas para cada camada:
  - Frontend: components, pages, services, hooks, context
  - Backend: routes, controllers, services, models, middlewares
- Configurar comunicação básica frontend ↔ backend via HTTP (axios/fetch)
- Inicializar banco de dados com Prisma, definir schema inicial (incluindo tabelas para workspaces, colunas, tarefas) e conectar ao backend
- Garantir que o projeto roda localmente com comandos simples (npm run dev ou yarn dev para frontend e backend)
- Criar README com instruções básicas de setup, variáveis de ambiente e comandos para toda a equipe

### US-41 – Gestão Básica de Colunas do Board (CRUD Inicial)

- Cada workspace tem um board com colunas persistentes no banco
- Ao criar um workspace, criar automaticamente colunas padrão: To Do, Doing, Code Review, Done (com ordem sequencial)
- Permitir ao Admin do workspace:
  - Criar nova coluna (nome e posição/ordem)
  - Editar nome da coluna
  - Reordenar colunas (drag & drop na configuração ou via setas)
  - Deletar coluna apenas se estiver vazia (sem tarefas)
- Interface simples de gestão de colunas (botão "Gerenciar colunas" no header do board)
- Persistência: tabela de colunas com campos id, workspaceId, name, order (integer)
- Tarefas derivadas:
  - Modelo Prisma para colunas
  - Endpoint para CRUD de colunas (protegido por permissão Admin)
  - Lista horizontal de colunas no board, renderizada dinamicamente
  - Feedback visual ao adicionar/reordenar (coluna aparece imediatamente)
  - Migração inicial para criar colunas padrão

### US-32 – CRUD Básico de Tarefas (Cards)

- Criar tarefas com título, descrição e coluna inicial (escolher entre colunas existentes do workspace)
- Cada tarefa referencia coluna por ID (não nome fixo)
- Permitir editar título, descrição e coluna da tarefa
- Permitir deletar tarefa permanentemente
- Permitir arquivar soft delete para manter histórico
- Persistência das tarefas no banco com Prisma
- Atualização automática da interface ao criar, editar ou mover
- Tarefas derivadas:
  - Botão “+ Nova Tarefa” em cada coluna
  - Modal/formulário para criação e edição com dropdown de colunas
  - Renderização dinâmica de cards por coluna
  - Botão temporário “Mover para coluna X” (até drag & drop completo)

### US-20 – CRUD de Organizações (Workspaces)

- Criar workspace com nome e descrição (e criação automática de colunas padrão)
- Editar nome e descrição do workspace
- Deletar workspace (com confirmação, deleta colunas e tarefas associadas)
- Associar usuários a workspaces
- Permitir que um usuário pertença a múltiplos workspaces
- Visualização de lista de workspaces disponíveis ao usuário logado
- Tarefas derivadas:
  - Página inicial com listagem de workspaces
  - Formulário de criação e edição
  - Seleção de workspace ativo (carrega suas colunas e tarefas)

### US-21 – Gestão de Membros da Organização

- Adicionar usuários ao workspace via nickname ou email
- Remover usuários do workspace
- Definir papel básico ao adicionar (Admin, User, Guest)
- Listagem de membros com nome, avatar e papel
- Tarefas derivadas:
  - Modal de convite com campo de busca de usuário
  - Lista de membros com botão de remover e alterar papel
  - Badge visual de papel ao lado do nome

### US-06 – Sistema de Permissões (RBAC mínimo)

- Definir papéis: Admin (tudo, incluindo gerir colunas), User (criar/editar/mover tarefas), Guest (somente visualizar)
- Verificar papel em rotas de colunas, tarefas, etc.
- Ocultar ou desabilitar botões no frontend conforme papel (ex.: só Admin vê "Gerenciar colunas")
- Tarefas derivadas:
  - Middleware de autorização no backend
  - Hook ou context no frontend para checar permissões
  - Testes de ações bloqueadas para cada papel

### US-07 – Autenticação Básica (Email + Senha)

- Registro com email, nickname, senha (hash segura)
- Login com email/senha
- JWT básico para sessão (expiração curta)
- Proteção mínima de rotas (middleware auth)
- Página de login/registro simples
- Tarefas derivadas:
  - Formulários de login e registro
  - Endpoint /register e /login
  - Armazenamento de hash de senha
  - Redirecionamento após login para lista de workspaces

### US-38 – Drag & Drop Fluido (UX Core)

- Implementar arrastar e soltar cards entre colunas existentes (dinâmicas)
- Feedback visual durante arrasto: sombra, linha de inserção, destaque da coluna alvo
- Atualizar coluna e ordem da tarefa no banco ao soltar
- Atualizar interface imediatamente após movimento
- Tarefas derivadas:
  - Definir drop zones dinâmicas em cada coluna
  - Biblioteca (react-beautiful-dnd ou dnd-kit)
  - Endpoint backend para atualizar coluna e ordem
  - Testar em desktop e mobile (touch)
  - Suporte a reordenação dentro da mesma coluna

## NÍVEL B — ESSENCIAL (regra de negócio e segurança) (Estado entregue: workflows reais aplicados, autenticação institucional e segurança de sessão.)

### US-01 (Regras Kanban) – Validação de Movimentos entre Colunas

- Bloquear movimentos inválidos:
  - To Do → Done direto
  - To Do → Code Review direto
  - Code Review → To Do
  - Done → qualquer outra coluna
- Mostrar mensagem clara ao tentar movimento inválido
- Validação no frontend e backend
- Tarefas derivadas:
  - Função centralizada que verifica ordem das colunas
  - Testes para fluxos válidos/inválidos

### US-02 – Checklist Obrigatório para Conclusão

- Cada tarefa pode ter lista de itens de checklist
- Adicionar, remover e marcar itens como concluídos
- Bloquear movimento para Done se algum item estiver pendente
- Mostrar progresso visual (ex.: 3/5 concluídos)
- Tarefas derivadas:
  - Seção de checklist dentro do modal do card
  - Checkboxes interativos
  - Validação antes de mover para Done

### US-04 – Limite de Work In Progress (WIP)

- Configurar limite máximo de cards na coluna Doing (por workspace ou board)
- Mostrar contador atual/limite no cabeçalho da coluna
- Bloquear movimento ou criação de nova tarefa quando limite atingido
- Mensagem clara quando tentativa de ultrapassar
- Tarefas derivadas:
  - Campo de configuração WIP no workspace settings
  - Validação no drag & drop e nos botões de mover
  - Destaque visual quando próximo do limite

### US-03 – Code Review Obrigatório

- Para mover de Doing → Done, exigir aprovação de outro membro (não o autor)
- Campo para designar reviewer(s)
- Botão “Aprovar” visível apenas para reviewer designado
- Registrar quem aprovou e data
- Bloquear movimento até aprovação
- Tarefas derivadas:
  - Seção de review no modal do card
  - Notificação básica de pedido de review (ainda sem sistema completo)
  - Histórico de aprovação

### US-26 – Login com OAuth 42/ Login com Email e senha

- Integração com Intra 42 para autenticação
- Redirecionamento para login 42
- Após sucesso, criar ou atualizar usuário no banco com dados do perfil 42
- Redirecionar para dashboard com workspaces
- Tarefas derivadas:
  - Configuração de client ID/secret no backend
  - Rota de callback OAuth
  - Mapeamento de campos (nome, email, avatar)

### US-03-AUTH – Segurança de Sessão

- JWT para autenticação com expiração curta
- Refresh token com expiração longa armazenado em httpOnly cookie
- Middleware para validar token em rotas protegidas
- Endpoint de refresh automático
- Logout que invalida refresh token
- Tarefas derivadas:
  - Armazenamento seguro de tokens no frontend
  - Interceptor axios para refresh automático
  - Proteção contra CSRF

## NÍVEL C — IMPORTANTE (funcionalidades de colaboração e notificações)

Estado entregue: colaboração assíncrona eficiente com notificações, comentários e histórico.

### US-10 / US-14 – Sistema Completo de Notificações

- Criar notificações para eventos: criação/edição/movimento de tarefa, menção, convite, aprovação, comentário, mudança de papel
- Lista de notificações no header ou sidebar
- Marcar como lida individualmente ou todas
- Remover notificações antigas opcionalmente
- Persistência no banco
- Tarefas derivadas:
  - Modelo de notificação com tipo, mensagem, link e data
  - Badge com contador de não lidas
  - Endpoint para listar, marcar lida e deletar

### US-35 – Comentários e Menções (@)

- Seção de comentários em cada card
- Escrever comentário com suporte a @username para menção
- Menção gera notificação para o usuário mencionado
- Mostrar comentários em ordem cronológica com autor e data
- Tarefas derivadas:
  - Editor simples de comentário
  - Autocomplete de membros ao digitar @
  - Renderização com destaque para menções

### US-40 – Histórico de Atividades (Audit Log Simples)

- Registrar eventos por card: criação, edição, movimento, comentário, aprovação, checklist
- Mostrar histórico cronológico no modal do card
- Cada entrada com autor, ação e data/hora
- Tarefas derivadas:
  - Tabela de logs no banco ligada ao card
  - Trigger automático ao realizar ações
  - Lista visual com ícones por tipo de ação

### US-37 – Filtros e Busca Básica

- Barra de busca por texto (título, descrição, comentários)
- Filtros por responsável, etiqueta (quando implementada), coluna, data
- Aplicar filtros em tempo real no board
- Tarefas derivadas:
  - Componente de filtros acima do board
  - Query no backend com parâmetros de filtro
  - Destaque nos cards que match a busca

### US-05 – Timer por Task na Coluna Doing

- Iniciar/parar timer ao entrar na coluna Doing
- Configurar tempo estimado por tarefa
- Aviso visual quando tempo expirar (card vermelho, contador piscando)
- Registrar tempo gasto ao mover para Done
- Tarefas derivadas:
  - Botão play/pause no card
  - Contador visível na coluna Doing
  - Persistência do tempo gasto

## NÍVEL D — QUALIDADE E COLABORAÇÃO EM TEMPO REAL

Estado entregue: experiência multiusuário em tempo real com presença e edição simultânea.

### US-08 – Chat em Tempo Real por Workspace

- Chat único por workspace (não por card)
- Enviar e receber mensagens em tempo real via Socket.IO
- Persistência das mensagens no banco
- Lista de mensagens com autor, data e hora
- Tarefas derivadas:
  - Sidebar ou aba de chat no workspace
  - Input de mensagem com botão enviar
  - Scroll automático para última mensagem

### US-15 – Gestão Robusta de Conexões WebSocket

- Reconexão automática em caso de perda de conexão
- Indicador de status de conexão
- Sincronização completa do board ao reconectar
- Limpeza de sockets inativos no servidor
- Tarefas derivadas:
  - Evento de reconnect no frontend
  - Broadcast de estado atual ao conectar
  - Timeout para desconexão

### US-28 – Live Presence

- Mostrar quais usuários estão visualizando o mesmo board ou card
- Indicador no header do board e no modal do card
- Avatar ou nome dos usuários online
- Tarefas derivadas:
  - Emitir evento “viewing board/card” ao entrar
  - Lista dinâmica de usuários presentes
  - Remover ao sair da página

### US-29 – Edição Simultânea de Descrição

- Permitir múltiplos usuários editarem descrição do card ao mesmo tempo
- Usar lock otimista ou atualização em tempo real (mostrar cursor de outros)
- Aviso se outro usuário salvou enquanto editava
- Tarefas derivadas:
  - Broadcast de alterações de descrição via socket
  - Indicador “alguém está editando”
  - Merge simples ou sobrescrever com aviso

### US-17 – Botão de Panic (Pedido de Ajuda)https://github.com/DARIONZITA/webserv.git

- Botão visível no card com ícone de alerta
- Ao clicar, enviar notificação urgente a todos os membros do workspace
- Mensagem padrão “Preciso de ajuda nesta tarefa” + link para o card
- Tarefas derivadas:
  - Botão no header do modal do card
  - Notificação destacada (vermelha) para todos

### US-18 – Reações Rápidas (Emoji)

- Reagir a comentários e mensagens de chat com emojis
- Mostrar contagem de cada emoji
- Clique rápido para adicionar/remover reação
- Tarefas derivadas:
  - Picker de emojis ao hover
  - Atualização em tempo real via socket
  - Renderização abaixo da mensagem/comentário

## NÍVEL E — ADMIN, ANALYTICS E INTEGRAÇÃO

Estado entregue: gestão avançada, segurança de API e métricas operacionais.

### US-23 – Admin Dashboard (Gestão de Usuários)

- Interface exclusiva para Super Admins
- Listagem de todos os usuários com nome, email, data de registro, status
- Ações: editar, desativar, banir, resetar senha
- Tarefas derivadas:
  - Página protegida por papel Super Admin
  - Tabela com filtros e busca
  - Modais de confirmação para ações críticas

### US-24 / US-25 – API Pública Segura (v1)

- Expor pelo menos 5 endpoints públicos (ex.: tarefas concluídas, métricas gerais)
- Autenticação via API Key no header
- Rate limiting por IP ou key
- Documentação com Swagger/OpenAPI
- Versionamento /api/v1
- Tarefas derivadas:
  - Geração automática de API keys para usuários
  - Middleware de rate limit e validação de key
  - Página de documentação acessível

### US-31 / TASK-30 – Health / Status Page + Backup

- Rota /status retornando saúde do servidor, banco e serviços
- Configurar backup diário automatizado do banco
- Documento com plano de migração para microservices (opcional)
- Tarefas derivadas:
  - Endpoint de health check
  - Script de backup (cron ou serviço externo)
  - Página pública de status

### US-19 / US-29 – Dashboard Analítico Avançado

- Gráficos de tarefas concluídas por semana/mês
- Tempo médio por tarefa, por coluna, por usuário
- Filtros por data e workspace
- Exportação CSV/PDF
- Tarefas derivadas:
  - Queries agregadas otimizadas no backend
  - Biblioteca de gráficos (Chart.js ou similar)
  - Botões de export

### US-18 (API Logs/Segurança) – Logs e Middleware de Segurança

- Registrar todas as requisições (endpoint, IP, usuário, status)
- Configurar CORS apenas para domínios permitidos
- Rate limiting global
- Validações de entrada em todos os endpoints
- Tarefas derivadas:
  - Middleware de logging
  - Armazenamento de logs (arquivo ou banco)
  - Configuração de segurança de headers

## NÍVEL F — STRETCH / POLIMENTO / GAMIFICAÇÃO AVANÇADA

Estado entregue: produto maduro, engajador e visualmente atraente.

### US-12 – Sistema de Badges (Conquistas)

- Definir badges por marcos (primeira tarefa, 10 tarefas concluídas, 5 aprovações, etc.)
- Exibir badges no perfil do usuário
- Notificação ao ganhar badge
- Tarefas derivadas:
  - Tabela de badges destravados por usuário
  - Trigger automático ao completar ação
  - Galeria de badges no perfil

### US-26 / US-27 – Sistema de XP e Leaderboard

- Atribuir XP por ações (criar tarefa, concluir, aprovar, ajudar)
- Subir de nível ao acumular XP
- Leaderboard semanal por workspace com ranking
- Histórico de posições
- Tarefas derivadas:
  - Cálculo e armazenamento de XP
  - Tabela de leaderboard atualizada diariamente
  - Página de ranking com filtros

### US-17 (Design) – Sistema de Etiquetas (Labels)

- Criar etiquetas com nome e cor (HEX)
- Aplicar múltiplas etiquetas por tarefa
- Filtrar board por etiqueta
- Tarefas derivadas:
  - Gerenciador de etiquetas no workspace settings
  - Chips coloridos nos cards
  - Filtro rápido por etiqueta

### US-33 – Editor de Texto Rico (Markdown)

- Suporte completo a Markdown na descrição e comentários
- Preview em tempo real
- Blocos de código com sintaxe highlight
- Tarefas derivadas:
  - Biblioteca Markdown (react-markdown + remark)
  - Editor com toolbar opcional
  - Sanitização de HTML

### US-11 – Notificações Push e Notificações no Email (opcional)

- Enviar push notifications para navegador (Web Push)
- Envia notificações no Email
- Configurar para eventos críticos (menção, panic, aprovação)
- Permissão do usuário ao primeiro login
- Tarefas derivadas:
  - Service worker e configuração VAPID
  - Integração com notificações existentes
  - Teste cross-browser

### US-37 (UX) – Design System e Componentes Reutilizáveis

- Criar biblioteca de componentes (Button, Card, Modal, Input, etc.)
- Definir tokens de cor, tipografia, espaçamento
- Garantir acessibilidade (ARIA, contraste)
- Tarefas derivadas:
  - Storybook para documentar componentes
  - Aplicar componentes em todo o projeto
  - Guidelines de uso no README