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
if ! $DOCKER ps | grep -q "Up"; then
    echo -e "${RED}✗ Containers não estão rodando. Execute ./scripts/setup.sh primeiro.${NC}"
    exit 1
fi

echo -e "${BLUE}📊 Executando migrations...${NC}"

# Run migrations for each service
services=("auth-service" "core-service" "social-service" "gamification-service")

for service in "${services[@]}"; do
    echo -e "${YELLOW}⏳ Migrando $service...${NC}"
    
    # Try to run migrations (adjust command based on your ORM)
    $DOCKER exec $service npm run migrate || \
    $DOCKER exec $service npx prisma migrate deploy || \
    $DOCKER exec $service npm run typeorm migration:run || \
    echo -e "${YELLOW}⚠ Nenhum comando de migration encontrado para $service${NC}"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $service migrado com sucesso${NC}"
    else
        echo -e "${YELLOW}⚠ Verifique o $service manualmente${NC}"
    fi
done

echo ""
echo -e "${GREEN}✓ Migrations concluídas${NC}"
echo ""
