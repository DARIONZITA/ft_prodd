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
echo -e "${BLUE}║         Development Mode - ${PROJECT_NAME}             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}✗ Arquivo .env não encontrado!${NC}"
    echo -e "${YELLOW}Execute ./scripts/setup.sh primeiro.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Iniciando em modo de desenvolvimento...${NC}"
echo ""

# Start with logs following
$DOCKER up

# This script will keep running and show logs
# Press Ctrl+C to stop all services
