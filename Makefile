NAME = ft_prodd( ... )
DOCKER-COMPOSE = ./config/docker-compose.yaml
ENV_FILE = ./config/.env

DOCKER := docker compose -f $(DOCKER-COMPOSE) --env-file $(ENV_FILE)

all: up

up:
	@$(DOCKER) up -d

setup:
	@./scripts/setup.sh

down:
	@$(DOCKER) down

restart:
	@$(DOCKER) restart

logs:
	@$(DOCKER) logs -f

ps:
	@$(DOCKER) ps

clean:
	@./scripts/clean.sh

rebuild: rebuild-all

rebuild-all:
	@echo "🔨 Rebuild de todos os serviços..."
	@$(DOCKER) build --no-cache
	@$(DOCKER) up -d

rebuild-%:
	@echo "🔨 Rebuild do serviço: $*"
	@$(DOCKER) build --no-cache $*
	@$(DOCKER) up -d $*

prisma-studio:
	@$(DOCKER) up -d postgres backend
	@$(DOCKER) exec backend npm run prisma:studio

reset-all: ## Reset completo do projeto (PERDE TUDO)
	@echo "  ATENÇÃO: Isso irá deletar containers, volumes e dados!"
	@read -p "Tem certeza? [y/N]: " confirm && [ "$$confirm" = "y" ] || exit 1
	@make clean
	@make setup

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
	@echo ""
	@echo "  Certificado self-signed: aceite no browser em 'Avançado > Continuar'"
	@echo ""
	@echo "Para ver todos os comandos disponíveis, execute: make help"
	@echo ""

help:
	@echo "╔════════════════════════════════════════════════════════╗"
	@echo "║             $(NAME) - Comandos Disponíveis            ║"
	@echo "╚════════════════════════════════════════════════════════╝"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

.PHONY: all up set down restart logs ps clean rebuild rebuild-all rebuild-% prisma-studio reset-all info help