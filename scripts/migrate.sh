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
DOCKER="docker compose -f $COMPOSE_FILE --env-file $ENV_FILE"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Database Migration - ${PROJECT_NAME}          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if containers are running
if ! docker compose ps | grep -q "Up"; then
    echo -e "${RED}✗ Containers não estão rodando. Execute ./scripts/dev.sh primeiro.${NC}"
    exit 1
fi

echo -e "${BLUE}📊 Executando migrations...${NC}"

# Define the correct service name based on your docker-compose
service="backend"

echo -e "${YELLOW}⏳ Migrando $service...${NC}"

# Tenta rodar a migração do Prisma
# Usa 'prisma migrate deploy' para produção/CI ou 'dev' para desenvolvimento
# Aqui vamos usar 'deploy' para garantir que o schema seja aplicado sem pedir confirmação
docker compose exec $service npx prisma migrate dev --name init --skip-generate || \
docker compose exec $service npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Banco de dados migrado e atualizado com sucesso!${NC}"
    
    # Opcional: Gerar o cliente novamente para garantir
    echo -e "${YELLOW}🔄 Regenerando Prisma Client...${NC}"
    docker compose exec $service npx prisma generate
else
    echo -e "${RED}⚠ Falha na migração do $service. Verifique os logs acima.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Processo concluído${NC}"
echo ""