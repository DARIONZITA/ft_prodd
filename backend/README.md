# ft_prodd Backend

Backend unificado do Task Manager Kanban para ft_prodd.

## Estrutura do Projeto

```
backend/
├── src/
│   ├── config/          # Configurações (DB, Redis, JWT, etc.)
│   ├── controllers/     # Lógica de controle das rotas
│   ├── middlewares/     # Middlewares (auth, validation, error handling)
│   ├── models/          # Modelos de dados (interfaces, tipos)
│   ├── routes/          # Definição de rotas da API
│   ├── services/        # Lógica de negócio
│   ├── utils/           # Funções utilitárias
│   └── index.ts         # Entry point da aplicação
├── prisma/
│   └── schema.prisma    # Schema do banco de dados
├── Dockerfile           # Container Docker
├── package.json         # Dependências
└── tsconfig.json        # Configuração TypeScript
```

## Módulos Principais

### 1. **Authentication** (`/api/auth`)
- Login com email/senha
- OAuth (42, Google, GitHub)
- JWT tokens
- Refresh tokens
- Session management

### 2. **Workspaces** (`/api/workspaces`)
- CRUD de workspaces
- Gestão de membros
- Configurações (WIP limit)
- Permissões (RBAC)

### 3. **Kanban Board** (`/api/boards`)
- CRUD de colunas
- Reordenação de colunas
- Colunas padrão automáticas

### 4. **Tasks** (`/api/tasks`)
- CRUD de tarefas
- Drag & drop (movimentação)
- Checklists
- Code review workflow
- Timers
- Labels/tags

### 5. **Comments** (`/api/comments`)
- Comentários em tarefas
- Menções (@username)
- Histórico

### 6. **Notifications** (`/api/notifications`)
- Sistema de notificações
- Eventos diversos
- Marcação de lidas

### 7. **Chat** (WebSocket)
- Chat em tempo real por workspace
- Socket.IO
- Persistência de mensagens

### 8. **Gamification** (`/api/gamification`)
- Sistema de XP
- Badges/conquistas
- Leaderboards

### 9. **Analytics** (`/api/analytics`)
- Estatísticas de tarefas
- Tempo por coluna
- Métricas por usuário

## Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build
npm start

# Testes
npm test
npm run test:watch
npm run test:coverage

# Prisma
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio

# Code quality
npm run lint
npm run format
```

## Variáveis de Ambiente

Veja `config/.env.example` na raiz do projeto.

## API Documentation

A documentação completa da API estará disponível em:
- Development: http://localhost:3001/api-docs (Swagger)
- Health check: http://localhost:3001/health

## Tecnologias

- **Runtime:** Node.js 18 + TypeScript
- **Framework:** Express
- **Database:** PostgreSQL + Prisma ORM
- **Cache:** Redis
- **Real-time:** Socket.IO
- **Authentication:** JWT + Passport
- **Validation:** express-validator
- **Logging:** Winston + Morgan
- **Security:** Helmet + CORS
