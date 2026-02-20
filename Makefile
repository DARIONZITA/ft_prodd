# Makefile para ft_transcendence
# Facilita o uso dos scripts com comandos mais curtos

.PHONY: help setup up down restart logs ps clean rebuild health migrate dev test

help: ## Mostra esta mensagem de ajuda
	@echo "╔════════════════════════════════════════════════════════╗"
	@echo "║         ft_transcendence - Comandos Disponíveis        ║"
	@echo "╚════════════════════════════════════════════════════════╝"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""

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

# Comandos específicos por serviço
logs-auth: ## Ver logs do auth-service
	@docker-compose logs -f auth-service

logs-core: ## Ver logs do core-service
	@docker-compose logs -f core-service

logs-social: ## Ver logs do social-service
	@docker-compose logs -f social-service

logs-gamification: ## Ver logs do gamification-service
	@docker-compose logs -f gamification-service

logs-frontend: ## Ver logs do frontend
	@docker-compose logs -f frontend

logs-db: ## Ver logs do PostgreSQL
	@docker-compose logs -f postgres

logs-redis: ## Ver logs do Redis
	@docker-compose logs -f redis

# Comandos de teste
test-auth: ## Executar testes do auth-service
	@docker-compose exec auth-service npm test

test-core: ## Executar testes do core-service
	@docker-compose exec core-service npm test

test-social: ## Executar testes do social-service
	@docker-compose exec social-service npm test

test-gamification: ## Executar testes do gamification-service
	@docker-compose exec gamification-service npm test

test-all: ## Executar testes de todos os serviços
	@echo "🧪 Executando testes..."
	@make test-auth
	@make test-core
	@make test-social
	@make test-gamification

# Comandos de banco de dados
db-shell: ## Acessar shell do PostgreSQL
	@docker-compose exec postgres psql -U transcendence -d transcendence_db

redis-cli: ## Acessar Redis CLI
	@docker-compose exec redis redis-cli -a redis_password

# Comandos úteis de desenvolvimento
shell-auth: ## Acessar shell do auth-service
	@docker-compose exec auth-service sh

shell-core: ## Acessar shell do core-service
	@docker-compose exec core-service sh

shell-social: ## Acessar shell do social-service
	@docker-compose exec social-service sh

shell-gamification: ## Acessar shell do gamification-service
	@docker-compose exec gamification-service sh

shell-frontend: ## Acessar shell do frontend
	@docker-compose exec frontend sh

# Instalação de dependências
install-auth: ## Instalar dependências do auth-service
	@docker-compose exec auth-service npm install

install-core: ## Instalar dependências do core-service
	@docker-compose exec core-service npm install

install-social: ## Instalar dependências do social-service
	@docker-compose exec social-service npm install

install-gamification: ## Instalar dependências do gamification-service
	@docker-compose exec gamification-service npm install

install-frontend: ## Instalar dependências do frontend
	@docker-compose exec frontend npm install

install-all: ## Instalar dependências de todos os serviços
	@echo "📦 Instalando dependências..."
	@make install-auth
	@make install-core
	@make install-social
	@make install-gamification
	@make install-frontend
