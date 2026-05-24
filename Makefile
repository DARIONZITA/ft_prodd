# Makefile para ft_prodd
# Facilita o uso dos scripts com comandos mais curtos

NAME = ft_prodd
DOCKER-COMPOSE = ./config/docker-compose.yaml
ENV_FILE = ./config/.env

DOCKER := docker compose -f $(DOCKER-COMPOSE) --env-file $(ENV_FILE)

.PHONY: help setup up down restart logs ps clean rebuild rebuild-all rebuild-% health migrate dev test

all: 
	@$(DOCKER) up -d

help: ## Mostra esta mensagem de ajuda
	@echo "╔════════════════════════════════════════════════════════╗"
	@echo "║             $(NAME) - Comandos Disponíveis            ║"
	@echo "╚════════════════════════════════════════════════════════╝"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ===========================
# SETUP E INICIALIZAÇÃO
# ===========================

setup: ## Setup inicial completo do projeto (inclui geração de certificados TLS)
	@make certs
	@./scripts/setup.sh

certs: ## Gerar certificados TLS self-signed para desenvolvimento
	@echo " A gerar certificados TLS self-signed..."
	@mkdir -p ./config/certs
	@openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout ./config/certs/nginx-selfsigned.key \
		-out ./config/certs/nginx-selfsigned.crt \
		-subj "/C=PT/ST=Lisboa/L=Lisboa/O=ft_prodd/CN=localhost" \
		-addext "subjectAltName=DNS:localhost,IP:127.0.0.1" 2>/dev/null
	@echo " Certificados gerados em ./config/certs/"

up: ## Iniciar todos os serviços em background
	@$(DOCKER) up -d

down: ## Parar todos os serviços
	@$(DOCKER) down

restart: ## Reiniciar todos os serviços
	@$(DOCKER) restart

logs: ## Ver logs de todos os serviços
	@$(DOCKER) logs -f

ps: ## Ver status de todos os containers
	@$(DOCKER) ps

clean: ## Limpar tudo (containers, volumes, images)
	@./scripts/clean.sh

rebuild: rebuild-all ## Alias para rebuild-all

rebuild-all: ## Rebuild completo de todos os serviços
	@echo "🔨 Rebuild de todos os serviços..."
	@$(DOCKER) build --no-cache
	@$(DOCKER) up -d

rebuild-%: ## Rebuild um serviço específico (ex: make rebuild-backend)
	@echo "🔨 Rebuild do serviço: $*"
	@$(DOCKER) build --no-cache $*
	@$(DOCKER) up -d $*

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
	@$(DOCKER) logs -f backend

logs-frontend: ## Ver logs do frontend
	@$(DOCKER) logs -f frontend

logs-db: ## Ver logs do PostgreSQL
	@$(DOCKER) logs -f postgres

logs-redis: ## Ver logs do Redis
	@$(DOCKER) logs -f redis

logs-nginx: ## Ver logs do Nginx (proxy)
	@$(DOCKER) logs -f nginx

# ===========================
# SHELL/ACESSO AOS CONTAINERS
# ===========================

shell-backend: ## Abrir shell no container backend
	@$(DOCKER) exec backend sh

shell-frontend: ## Abrir shell no container frontend
	@$(DOCKER) exec frontend sh

db-shell: ## Acessar shell do PostgreSQL
	@$(DOCKER) exec postgres psql -U transcendence -d transcendence_db

redis-cli: ## Acessar Redis CLI
	@$(DOCKER) exec redis redis-cli -a redis_password

# ===========================
# TESTES
# ===========================

test-backend: ## Executar testes do backend
	@$(DOCKER) exec backend npm test

test-frontend: ## Executar testes do frontend
	@$(DOCKER) exec frontend npm test

test-coverage: ## Executar testes com coverage (backend)
	@$(DOCKER) exec backend npm run test:coverage

test-all: ## Executar todos os testes
	@echo "🧪 Executando testes..."
	@make test-backend
	@make test-frontend

# ===========================
# PRISMA (ORM)
# ===========================

prisma-generate: ## Gerar Prisma Client
	@$(DOCKER) exec backend npm run prisma:generate

prisma-migrate: ## Executar migrations do Prisma
	@$(DOCKER) exec backend npm run prisma:migrate

prisma-studio: ## Abrir Prisma Studio (GUI para DB)
	@$(DOCKER) exec backend npm run prisma:studio

# ===========================
# INSTALAÇÃO DE DEPENDÊNCIAS
# ===========================

install-backend: ## Instalar dependências do backend
	@$(DOCKER) exec backend npm install

install-frontend: ## Instalar dependências do frontend
	@$(DOCKER) exec frontend npm install

install-all: ## Instalar dependências de todos os serviços
	@echo " Instalando dependências..."
	@make install-backend
	@make install-frontend

# ===========================
# COMANDOS DE RESET
# ===========================

reset-db: ## Reset completo do banco de dados (PERDE DADOS)
	@echo "  ATENÇÃO: Isso irá deletar todos os dados!"
	@read -p "Tem certeza? [y/N]: " confirm && [ "$$confirm" = "y" ] || exit 1
	@$(DOCKER) down -v
	@$(DOCKER) up -d postgres redis
	@sleep 5
	@make prisma-migrate

reset-all: ## Reset completo do projeto (PERDE TUDO)
	@echo "  ATENÇÃO: Isso irá deletar containers, volumes e dados!"
	@read -p "Tem certeza? [y/N]: " confirm && [ "$$confirm" = "y" ] || exit 1
	@make clean
	@make setup

# ===========================
# INFORMAÇÕES
# ===========================

info: ## Mostrar informações do projeto
	@echo "╔════════════════════════════════════════════════════════╗"
	@echo "║                  $(NAME) - Informações                ║"
	@echo "╚════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "  Frontend:    https://localhost"
	@echo "  Backend API: https://localhost/api"
	@echo "  Health:      https://localhost/api/health"
	@echo "  Swagger:     https://localhost/api/docs"
	@echo ""
	@echo "  (acesso interno — apenas dentro da rede Docker)"
	@echo "  PostgreSQL:  postgres:5432"
	@echo "  Redis:       redis:6379"
	@echo ""
	@echo "  Certificado self-signed: aceite no browser em 'Avançado > Continuar'"
	@echo ""
	@echo "Para ver todos os comandos disponíveis, execute: make help"
	@echo ""
