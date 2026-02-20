# Makefile para ft_transcendence
# Facilita o uso dos scripts com comandos mais curtos

.PHONY: help setup up down restart logs ps clean rebuild health migrate dev test

help: ## Mostra esta mensagem de ajuda
	@echo "╔════════════════════════════════════════════════════════╗"
	@echo "║         ft_transcendence - Comandos Disponíveis        ║"
	@echo "╚════════════════════════════════════════════════════════╝"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ===========================
# SETUP E INICIALIZAÇÃO
# ===========================

setup: ## Setup inicial completo do projeto
	@./scripts/setup.sh

up: ## Iniciar todos os serviços em background
	@docker-compose up -d

down: ## Parar todos os serviços
	@docker-compose down

restart: ## Reiniciar todos os serviços
	@docker-compose restart

logs: ## Ver logs de todos os serviços
	@docker-compose logs -f

ps: ## Ver status de todos os containers
	@docker-compose ps

clean: ## Limpar tudo (containers, volumes, images)
	@./scripts/clean.sh

rebuild: ## Rebuild completo de todos os serviços
	@docker-compose build --no-cache
	@docker-compose up -d

health: ## Verificar saúde dos serviços
	@./scripts/health-check.sh

migrate: ## Executar migrations do banco de dados
	@./scripts/migrate.sh

dev: ## Modo desenvolvimento (com logs visíveis)
	@./scripts/dev.sh

# ===========================
# LOGS POR SERVIÇO
# ===========================

logs-backend: ## Ver logs do backend
	@docker-compose logs -f backend

logs-frontend: ## Ver logs do frontend
	@docker-compose logs -f frontend

logs-db: ## Ver logs do PostgreSQL
	@docker-compose logs -f postgres

logs-redis: ## Ver logs do Redis
	@docker-compose logs -f redis

# ===========================
# SHELL/ACESSO AOS CONTAINERS
# ===========================

shell-backend: ## Abrir shell no container backend
	@docker-compose exec backend sh

shell-frontend: ## Abrir shell no container frontend
	@docker-compose exec frontend sh

db-shell: ## Acessar shell do PostgreSQL
	@docker-compose exec postgres psql -U transcendence -d transcendence_db

redis-cli: ## Acessar Redis CLI
	@docker-compose exec redis redis-cli -a redis_password

# ===========================
# TESTES
# ===========================

test-backend: ## Executar testes do backend
	@docker-compose exec backend npm test

test-frontend: ## Executar testes do frontend
	@docker-compose exec frontend npm test

test-coverage: ## Executar testes com coverage (backend)
	@docker-compose exec backend npm run test:coverage

test-all: ## Executar todos os testes
	@echo "🧪 Executando testes..."
	@make test-backend
	@make test-frontend

# ===========================
# PRISMA (ORM)
# ===========================

prisma-generate: ## Gerar Prisma Client
	@docker-compose exec backend npm run prisma:generate

prisma-migrate: ## Executar migrations do Prisma
	@docker-compose exec backend npm run prisma:migrate

prisma-studio: ## Abrir Prisma Studio (GUI para DB)
	@docker-compose exec backend npm run prisma:studio

# ===========================
# INSTALAÇÃO DE DEPENDÊNCIAS
# ===========================

install-backend: ## Instalar dependências do backend
	@docker-compose exec backend npm install

install-frontend: ## Instalar dependências do frontend
	@docker-compose exec frontend npm install

install-all: ## Instalar dependências de todos os serviços
	@echo "📦 Instalando dependências..."
	@make install-backend
	@make install-frontend

# ===========================
# LINTING E FORMATAÇÃO
# ===========================

lint-backend: ## Executar linter no backend
	@docker-compose exec backend npm run lint

lint-frontend: ## Executar linter no frontend
	@docker-compose exec frontend npm run lint

format-backend: ## Formatar código do backend
	@docker-compose exec backend npm run format

format-frontend: ## Formatar código do frontend
	@docker-compose exec frontend npm run format

# ===========================
# COMANDOS DE RESET
# ===========================

reset-db: ## Reset completo do banco de dados (PERDE DADOS)
	@echo "⚠️  ATENÇÃO: Isso irá deletar todos os dados!"
	@read -p "Tem certeza? [y/N]: " confirm && [ "$$confirm" = "y" ] || exit 1
	@docker-compose down -v
	@docker-compose up -d postgres redis
	@sleep 5
	@make prisma-migrate

reset-all: ## Reset completo do projeto (PERDE TUDO)
	@echo "⚠️  ATENÇÃO: Isso irá deletar containers, volumes e dados!"
	@read -p "Tem certeza? [y/N]: " confirm && [ "$$confirm" = "y" ] || exit 1
	@make clean
	@make setup

# ===========================
# INFORMAÇÕES
# ===========================

info: ## Mostrar informações do projeto
	@echo "╔════════════════════════════════════════════════════════╗"
	@echo "║              ft_transcendence - Informações            ║"
	@echo "╚════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "Frontend:    http://localhost:3000"
	@echo "Backend:     http://localhost:3001"
	@echo "Health:      http://localhost:3001/health"
	@echo "PostgreSQL:  localhost:5432"
	@echo "Redis:       localhost:6379"
	@echo ""
	@echo "Para ver todos os comandos disponíveis, execute: make help"
	@echo ""
