*This project has been created as part of the 42 curriculum by efinda, dnzita, cgama, jbofengo.*

# ft_transcendence - Task Manager Kanban

Sistema de gestão de tarefas que combina a experiência visual do Notion com a estrutura organizacional do Kanban, especificamente desenvolvido para atender às necessidades dos estudantes da Escola 42.

## 🚀 Quick Start

Para iniciar todo o projeto com um único comando:

```bash
./scripts/setup.sh
```

Este comando irá:
- ✅ Verificar se o Docker está rodando
- ✅ Criar arquivo `.env` a partir do `.env.example`
- ✅ Construir todas as imagens Docker
- ✅ Iniciar todos os serviços (frontend, backend, databases)
- ✅ Verificar a saúde de todos os serviços

## 📋 Pré-requisitos

- **Docker** (versão 20.10+)
- **Docker Compose** (versão 2.0+)
- **Git**

### Configuração das Credenciais OAuth

Antes de executar o projeto pela primeira vez, você precisa configurar as credenciais OAuth da 42 Intra:

1. Acesse: https://profile.intra.42.fr/oauth/applications
2. Crie uma nova aplicação OAuth
3. Configure a URL de callback: `http://localhost:3001/api/auth/42/callback`
4. Copie o `Client ID` e `Client Secret`
5. Edite o arquivo `.env` e adicione suas credenciais:
   ```
   INTRA_42_CLIENT_ID=seu_client_id
   INTRA_42_CLIENT_SECRET=seu_client_secret
   ```

## 🏗️ Arquitetura do Projeto

O projeto utiliza uma **arquitetura monolítica** simples e eficiente:

```
ft_transcendence/
├── backend/                   # Backend unificado (Express + Socket.IO)
│   ├── src/
│   │   ├── routes/           # Rotas da API
│   │   ├── controllers/      # Lógica de controle
│   │   ├── services/         # Regras de negócio
│   │   ├── models/           # Modelos de dados
│   │   ├── middlewares/      # Middlewares (auth, validation)
│   │   ├── config/           # Configurações
│   │   └── utils/            # Utilitários
│   └── prisma/               # Schema do banco de dados
├── frontend/                  # React Application
├── config/                    # Nginx, Database configs
├── scripts/                   # Scripts de automação
└── docker-compose.yml         # Orquestração dos containers
```

### Serviços e Portas

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| Frontend | 3000 | Interface React |
| Backend | 3001 | API REST + WebSocket (Socket.IO) |
| PostgreSQL | 5432 | Banco de dados principal |
| Redis | 6379 | Cache e sessões |
| Nginx | 80 | Reverse proxy (opcional) |

## 🛠️ Comandos Disponíveis

### Inicialização e Setup

```bash
# Setup inicial completo
./scripts/setup.sh

# Modo desenvolvimento (com logs visíveis)
./scripts/dev.sh

# Executar migrations do banco de dados
./scripts/migrate.sh

# Verificar saúde dos serviços
./scripts/health-check.sh
```

### Gerenciamento de Containers

```bash
# Iniciar todos os serviços em background
make up
# ou
docker-compose up -d

# Parar todos os serviços
make down
# ou
docker-compose down

# Ver logs de um serviço específico
make logs-backend    # Logs do backend
make logs-frontend   # Logs do frontend
# ou
docker-compose logs -f [nome-do-serviço]

# Ver status de todos os containers
make ps
# ou
docker-compose ps

# Reiniciar todos os serviços
make restart
### Limpeza e Reset

```bash
# Limpar tudo (containers, volumes, images)
make clean
# ou
./scripts/clean.sh

# Apenas parar e remover containers
make down

# Reset completo do banco de dados (PERDE DADOS)
make reset-db

# Reset completo do projeto (PERDE TUDO)
make reset-all
```penas parar e remover containers
docker-compose down

# Parar e remover volumes (PERDE DADOS)
docker-compose down -v
```

## 🗄️ Estrutura de Desenvolvimento

### Variáveis de Ambiente

O arquivo `.env.example` contém todas as variáveis necessárias. Copie-o para `.env` e configure:

```bash
cp .env.example .env
```

Principais variáveis que você deve configurar:
- `INTRA_42_CLIENT_ID` - Client ID da 42 OAuth
- `INTRA_42_CLIENT_SECRET` - Client Secret da 42 OAuth  
- `JWT_SECRET` - Chave secreta para JWT (mínimo 32 caracteres)
- `JWT_REFRESH_SECRET` - Chave para refresh tokens
- `POSTGRES_PASSWORD` - Senha do PostgreSQL
- `REDIS_PASSWORD` - Senha do Redis

### Hot Reload

Todos os serviços estão configurados com **hot reload** em modo desenvolvimento:
- Backend: Nodemon detecta mudanças em `.ts` e reinicia automaticamente
- Frontend: Vite HMR (Hot Module Replacement)

## 🧪 Testes

```bash
# Executar testes do backend
make test-backend

# Executar testes do frontend
make test-frontend

# Executar todos os testes
make test-all

# Executar testes com coverage
make test-coverage
```

### Health Checks

O backend possui endpoint de health check:

- Backend: http://localhost:3001/health
- Frontend: http://localhost:3000

Use o script de verificação:
```bash
make health
# ou
./scripts/health-check.sh
```

### Logs

```bash
# Ver logs de todos os serviços
make logs

# Ver logs dos últimos 100 linhas
docker-compose logs --tail=100

# Ver logs de serviços específicos
make logs-backend    # Backend
make logs-frontend   # Frontend
make logs-db         # PostgreSQL
make logs-redis      # Redis
```
docker-compose logs --tail=100

# Ver logs de serviços específicos
docker-compose logs -f auth-service core-service
```

# Ver logs de serviços específicos
docker-compose logs -f backend frontend
### Container não inicia

```bash
# Ver logs do container com problema
docker-compose logs [nome-do-serviço]

# Rebuild forçado
docker-compose build --no-cache [nome-do-serviço]
docker-compose up -d [nome-do-serviço]
```

### Porta já em uso

```bash
# Verificar o que está usando a porta
lsof -i :3000  # ou a porta com problema

### Banco de dados com problemas

```bash
# Reset completo do banco (PERDE DADOS)
make reset-db

# Apenas executar migrations novamente
make migrate
# ou
./scripts/migrate.sh

# Abrir Prisma Studio para visualizar dados
make prisma-studio

# Acessar shell do PostgreSQL
make db-shell
```eset completo do banco (PERDE DADOS)
docker-compose down -v
./scripts/setup.sh

# Apenas executar migrations novamente
./scripts/migrate.sh
```

## 🔒 Segurança

- Nunca commitar o arquivo `.env` (já está no `.gitignore`)
- Trocar todas as senhas padrão em produção
- Usar HTTPS em produção (configuração nginx incluída)
- Revisar e atualizar dependências regularmente
- Redis e PostgreSQL com senhas fortes
- Rate limiting configurado para proteger contra abuso

## 📚 Comandos Úteis (Resumo)

```bash
# Iniciar projeto
make setup          # Primeira vez (setup completo)
make up             # Iniciar serviços
make dev            # Modo desenvolvimento com logs

# Desenvolvimento
make logs-backend   # Ver logs do backend
make shell-backend  # Acessar shell do backend
make test-backend   # Executar testes
make prisma-studio  # GUI para visualizar banco

# Manutenção
make health         # Verificar saúde dos serviços
make restart        # Reiniciar tudo
make clean          # Limpar tudo

# Informações
make help           # Ver todos os comandos
make info           # Ver URLs dos serviços
```

## 🔗 URLs Importantes

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost:3000 | Interface do usuário |
| **Backend API** | http://localhost:3001 | API REST |
| **Health Check** | http://localhost:3001/health | Status do backend |
| **PostgreSQL** | localhost:5432 | Banco de dados |
| **Redis** | localhost:6379 | Cache e sessões |

---o chown -R $USER:$USER .
```

## 🔒 Segurança

- Nunca commitar o arquivo `.env` (já está no `.gitignore`)
- Trocar todas as senhas padrão em produção
- Usar HTTPS em produção (configuração nginx incluída)
- Revisar e atualizar dependências regularmente

---

# Team Information

#### *efinda* - Project Manager & Frontend Developer
  - **Project Management:**
    - Facilitate sprint planning and retrospective sessions.
    - Monitor project timeline and milestone completion.
    - Coordinate team communication and remove obstacles.
    - Identify and mitigate potential project risks.
  - **Frontend Development:**
    - Build user interfaces with React.
    - Create responsive, mobile-friendly layouts.
    - Develop reusable UI components.

#### *dnzita* - Product Owner & Developer
  - **Product Ownership:**
    - Manage and prioritize the feature backlog.
    - Define what gets built and in what order.
    - Review and approve completed deliverables.
    - Serve as primary contact during evaluations.
  - **Development:**
    - Connect frontend and backend systems.
    - Build gamification features and UI.

#### *cgama* - Technical Lead & Developer
  - **Technical Leadership:**
    - Design the overall system architecture.
    - Select frameworks, libraries, and tools.
    - Establish coding standards and practices.
    - Conduct critical code quality reviews.
  - **Development:**
    - Build technically challenging features.
    - Handle complex system integrations.
    - Set up deployment infrastructure.

#### *jbofengo* - Pure Backend Developer
  - **Backend Development:**
    - Develop server-side features and APIs.
    - Review teammates' code for quality.
    - Test backend implementations thoroughly.
    - Maintain clear technical documentation.




# Project Management

### How We Organize Our Work

We follow the **Agile Kanban methodology** to manage our workflow efficiently. Our process works like this:

At the project's start, we break down all required work into small, manageable tasks — what we call "**salami slicing**" the work. These slices are distributed across team members based on their specific roles (PM, PO, Tech Lead, Dev).

**Our bi-weekly meeting rhythm:**

- **Monday @ 12:00 PM - Sprint Planning:** We select task slices from the backlog and distribute them among team members to work on throughout the week. Each member knows exactly what they need to "eat" (complete) before Friday.

- **Friday @ 6:00 PM - Sprint Review:** We check if all the salami slices distributed on Monday were successfully "eaten" (completed). Members demonstrate their completed work, the Product Owner validates functionality, and the Technical Lead reviews code quality.

This cadence keeps everyone accountable and ensures continuous progress without overwhelming any single team member.

### Project Management Tools

We use **Trello** as our Kanban board platform. The board is shared among all team members, providing complete visibility into the project's state.

Our Trello board structure:
- **Backlog** - All upcoming tasks waiting to be picked up
- **To Do** - Tasks assigned for the current sprint
- **In Progress** - Work currently being developed
- **Review** - Completed work awaiting validation
- **Done** - Validated and merged work

Team members move their assigned cards across columns as they progress, giving everyone real-time visibility into what's being worked on, what's blocked, and what's completed.

### Communication Channels

We use a **two-channel communication strategy** to balance urgency and organization:

#### **WhatsApp Group - Quick Communication**
Used for time-sensitive messages and urgent coordination. Since most team members check WhatsApp frequently throughout the day, it's our go-to for:
- Urgent blockers or issues
- Last-minute meeting changes
- Quick yes/no questions
- General team coordination

#### **Slack Workspace - Structured Work Discussion**
Our primary platform for organized, topic-specific communication. The workspace is divided into focused channels:

- **#avisos** - Team-wide announcements and important updates
- **#standup-check-in** - Weekly progress updates (mandatory Wednesday check-in)
- **#frontend** - React, UI/UX, and component discussions
- **#backend** - API, database, and server-side topics
- **#devops** - Docker, deployment, and infrastructure
- **#review** - Features reviews and technical feedback
- **#docs-and-resources** - Documentation, tutorials, and learning materials

This dual-channel approach ensures we never miss urgent issues (WhatsApp) while keeping technical discussions organized and searchable (Slack).



# Technical Stack

A stack tecnológica foi cuidadosamente selecionada para maximizar a produtividade da equipe de 4 pessoas, minimizar a curva de aprendizado e garantir um desenvolvimento ágil dentro do prazo de 4 meses.

## 📚 Tecnologias Core

| Componente | Tecnologia Escolhida | Justificativa Técnica para o Nosso Caso | Tempo Estimado para Aprender o Básico (para Beginners) |
|------------|---------------------|------------------------------------------|--------------------------------------------------------|
| **Linguagem Principal** | JavaScript (com TypeScript opcional) | Tudo na mesma linguagem evita aprender múltiplas sintaxes, facilitando colaboração em equipa de 4. Integra frontend/backend sem esforço, suporta multi-user e real-time nativamente. Alinha com o subject (ex.: React/Express como frameworks válidos). Simples para deployment Docker. | 1-2 semanas (se zero JS; se básico, 2-3 dias). Foco em variáveis, funções e async para Node. |
| **Frontend Framework** | React com Vite | React é listado como framework no document (ecossistema arquitetural), Vite é starter rápido (build em segundos vs. horas em outros). Integra fácil com Socket.IO para real-time (chat/jogos) e Tailwind para responsive. Ganha pontos em "frontend framework" (1-2 pts). Para 4 meses, evita overhead de Angular/Vue. | 2-4 semanas (fundamentos: components, state, hooks). Cursos de 1-2 horas aceleram, mas prática leva tempo. |
| **Styling/CSS Solution** | Tailwind CSS | Solução de styling recomendada no subject (rápida para responsive/acessível em dispositivos). Integra direto no React (classes inline), sem CSS separado, economizando tempo em equipa pequena. Suporta custom design system (módulo minor, 1 pt). | 1-2 dias (utility classes básicas). Shift mental de CSS tradicional leva 24 horas, mas tutoriais de 90 min bastam. |
| **Backend Framework** | Node.js com Express | Express é framework backend listado, leve e minimalista para APIs seguras (rate limiting, endpoints GET/POST/etc. para public API, 2 pts). Integra com Socket.IO para real-time e Prisma para DB. Para multi-user, lida concurrency sem crashes. Simples para 4 meses vs. NestJS (mais complexo). | Node: 1-3 semanas (runtime basics). Express: 3-5 dias (rotas, middleware). Se souberem JS, 1 dia. |
| **Real-Time/Comunicação** | Socket.IO | Tecnologia similar a WebSockets listada para real-time features (2 pts) e user interaction (chat, 2 pts). Integra em 1 linha no Express e React, lidando disconnections/broadcasts para jogos multiplayer. Essencial para multi-user sem polling. | 1-2 horas (eventos básicos: emit/on). Cursos de 30-80 min cobrem tudo. |
| **Base de Dados** | PostgreSQL | BD relacional com schema claro/relations (obrigatório). Suporta multi-user sem race conditions, integra com Prisma para validações. Robusta para stats jogos/user data. Gratuita e escalável para 4 meses. | 2-4 semanas (queries básicas: SELECT, JOIN). Se souberem SQL, 1 semana. |
| **ORM (Object-Relational Mapping)** | Prisma | ORM minor (1 pt) simples, com migrações auto e type-safety. Integra com Node/Express em minutos, valida inputs backend (obrigatório). Evita SQL raw para equipa beginner, facilitando user management. | 1-2 horas (schema, queries). Cursos de 60 min para basics. |
| **Autenticação** | JWT com bcrypt | JWT para sessions seguras (standard user management, 2 pts; OAuth minor se adicionar). Bcrypt para hashing passwords (salted, obrigatório). Integra com Express em middleware simples, suporta 2FA futuro. Seguro para multi-user. | JWT: 15-30 min (gerar/validar tokens). Bcrypt: 30 min-1 hora (hash/compare). Tutoriais de 4-15 min. |
| **Containerização/Deployment** | Docker com Docker Compose | Solução obrigatória para run single-command. Compose gerencia multi-containers (frontend/backend/DB) fácil, integra Nginx para HTTPS. Para 4 meses, evita setups manuais em máquinas diferentes. | Docker: 1-2 dias (imagens, containers). Compose: 1 dia (YAML básico). Tutoriais de 15-45 min + prática. |
| **Reverse Proxy/HTTPS** | Nginx | Para HTTPS everywhere (obrigatório). Integra como container no Compose, proxy para Express. Simples config para multi-user/performance. Evita certs complexos. | 1-2 dias (config básica: server blocks). Cursos de 1 hora para beginners. |

## 🔧 Ferramentas de Desenvolvimento

- **Controle de Versão:** Git + GitHub
- **Gestão de Projeto:** Trello (Kanban Board)
- **Comunicação:** Slack + WhatsApp
- **IDE:** VS Code (recomendado)
- **Testes:** Jest (backend), React Testing Library (frontend)
- **Linting:** ESLint + Prettier
- **CI/CD:** GitHub Actions (opcional)

## 📦 Dependências Principais

### Backend Services
```json
{
  "express": "^4.18.2",
  "socket.io": "^4.6.1",
  "prisma": "^5.7.0",
  "@prisma/client": "^5.7.0",
  "jsonwebtoken": "^9.0.2",
  "bcrypt": "^5.1.1",
  "passport": "^0.6.0",
  "passport-oauth2": "^1.7.0",
  "redis": "^4.6.10",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "express-rate-limit": "^7.1.5"
}
```

### Frontend
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "vite": "^5.0.0",
  "tailwindcss": "^3.3.0",
  "socket.io-client": "^4.6.1",
  "react-router-dom": "^6.20.0",
  "axios": "^1.6.2"
}
```

## 🎯 Decisões Arquiteturais

### Por que Monolito (ao invés de Microserviços)?
- **Simplicidade:** Mais fácil de desenvolver e debugar para time de 4 pessoas
- **Performance:** Menos overhead de comunicação entre serviços
- **Desenvolvimento Rápido:** Deploy e iteração mais ágeis
- **Menos Complexidade:** Apenas 1 codebase backend para gerenciar
- **Facilita Colaboração:** Time pode trabalhar no mesmo repositório sem conflitos de integração

### Por que TypeScript (Opcional)?
- **Type Safety:** Reduz bugs em produção
- **IntelliSense:** Melhor experiência de desenvolvimento
- **Documentação Viva:** Tipos servem como documentação
- **Refatoração Segura:** Mudanças grandes com confiança

### Por que Prisma ORM?
- **Type-Safe Queries:** TypeScript nativo
- **Migrations Automáticas:** Versionamento de schema
- **Schema Declarativo:** Fácil de entender e manter
- **Validação Built-in:** Reduz código boilerplate

## 📊 Matriz de Compatibilidade

| Requisito do Subject | Tecnologia Utilizada | Status |
|----------------------|---------------------|--------|
| Frontend Framework | React + Vite | ✅ |
| Backend Framework | Express (Node.js) | ✅ |
| Database | PostgreSQL | ✅ |
| Real-time Features | Socket.IO | ✅ |
| User Management | JWT + bcrypt + Passport | ✅ |
| Standard Security | Helmet + CORS + Rate Limiting | ✅ |
| Docker Deployment | Docker Compose | ✅ |
| HTTPS | Nginx Reverse Proxy | ✅ |
| Multi-user Support | PostgreSQL + Redis Sessions | ✅ |
| Monolithic Architecture | Express unificado | ✅ |

# Database Schema




# Features List




# Modules




# Individual Contributions
