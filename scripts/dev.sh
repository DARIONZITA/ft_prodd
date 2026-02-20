#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Development Mode - ft_transcendence                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}✗ Arquivo .env não encontrado!${NC}"
    echo -e "${YELLOW}Execute ./scripts/setup.sh primeiro.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Iniciando em modo de desenvolvimento...${NC}"
echo ""

# Start with logs following
docker-compose up

# This script will keep running and show logs
# Press Ctrl+C to stop all services
