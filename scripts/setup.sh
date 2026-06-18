#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_NAME="ft_prodd"
COMPOSE_FILE="./config/docker-compose.yaml"
ENV_FILE="./config/.env"
ENV_EXAMPLE="./config/.env.example"
DOCKER="docker compose -f $COMPOSE_FILE --env-file $ENV_FILE"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}║          ${PROJECT_NAME} - Setup Inicial               ║${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker não está rodando. Por favor, inicie o Docker e tente novamente.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker está rodando${NC}"

# Check if .env exists, if not create from .env.example
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠ Arquivo .env não encontrado. Criando a partir de .env.example...${NC}"

    if [ -f "$ENV_EXAMPLE" ]; then
        cp "$ENV_EXAMPLE" "$ENV_FILE"
        echo -e "${GREEN}✓ Arquivo .env criado${NC}"
        echo -e "${YELLOW}⚠ IMPORTANTE: Edite o arquivo .env com suas credenciais antes de continuar!${NC}\n"
        read -p "Pressione ENTER depois de configurar o .env para continuar..."
    else
        echo -e "${RED}✗ Arquivo .env.example não encontrado!${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Arquivo .env encontrado${NC}"
fi

# Stop any running containers
echo -e "${YELLOW}⏸  Parando containers existentes...${NC}"
$DOCKER down

# Remove old volumes (optional - ask user)
read -p "Deseja remover volumes antigos? (dados serão perdidos) [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⏸  Removendo volumes...${NC}"
    $DOCKER down -v
    echo -e "${GREEN}✓ Volumes removidos${NC}"
fi

# Build all images
echo -e "${BLUE}🔨 Construindo imagens Docker...${NC}"
$DOCKER build

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Erro ao construir imagens Docker${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Imagens construídas com sucesso${NC}"

# Start containers
echo -e "${BLUE}🚀 Iniciando containers...${NC}"
$DOCKER up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Erro ao iniciar containers${NC}"
    exit 1
fi

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Aguardando serviços ficarem prontos...${NC}"
sleep 10

# Check service health
echo -e "${BLUE}🏥 Verificando saúde dos serviços...${NC}"

services=("postgres" "redis" "backend" "frontend")

for service in "${services[@]}"; do
    status=$($DOCKER ps "$service" | grep -i "up\|healthy" || echo "down")
    if [[ $status == *"down"* ]]; then
        echo -e "${RED}✗ $service - não está rodando${NC}"
    else
        echo -e "${GREEN}✓ $service - rodando${NC}"
    fi
done

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}║         Setup Concluído com Sucesso! 🎉                ║${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📍 Serviços disponíveis:${NC}"
echo -e "   Frontend:              ${GREEN}http://localhost:3000${NC}"
echo -e "   Backend API:           ${GREEN}http://localhost:3001${NC}"
echo -e "   Health Check:          ${GREEN}http://localhost:3001/api/health${NC}"
echo -e "   PostgreSQL:            ${GREEN}localhost:5432${NC}"
echo -e "   Redis:                 ${GREEN}localhost:6379${NC}"
echo ""
echo -e "${BLUE}📋 Comandos úteis:${NC}"
echo -e "   Ver logs:              ${YELLOW}make logs${NC}"
echo -e "   Parar tudo:            ${YELLOW}make down${NC}"
echo -e "   Reiniciar:             ${YELLOW}make restart${NC}"
echo -e "   Ver status:            ${YELLOW}make ps${NC}"
echo -e "   Health check:          ${YELLOW}make health${NC}"
echo -e "   Ver todos comandos:    ${YELLOW}make help${NC}"
echo ""
