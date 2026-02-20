#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║     Limpeza Completa - ft_transcendence                ║${NC}"
echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}⚠  ATENÇÃO: Esta ação irá remover:${NC}"
echo -e "${YELLOW}   - Todos os containers${NC}"
echo -e "${YELLOW}   - Todos os volumes (DADOS SERÃO PERDIDOS)${NC}"
echo -e "${YELLOW}   - Todas as imagens construídas${NC}"
echo -e "${YELLOW}   - Todas as redes criadas${NC}"
echo ""

read -p "Tem certeza que deseja continuar? [y/N]: " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}Operação cancelada.${NC}"
    exit 0
fi

echo ""
echo -e "${RED}🧹 Limpando tudo...${NC}"

# Stop all containers
echo -e "${YELLOW}⏸  Parando containers...${NC}"
docker-compose down

# Remove volumes
echo -e "${YELLOW}⏸  Removendo volumes...${NC}"
docker-compose down -v

# Remove images
echo -e "${YELLOW}⏸  Removendo imagens...${NC}"
docker-compose down --rmi all

# Remove orphaned containers
echo -e "${YELLOW}⏸  Removendo containers órfãos...${NC}"
docker-compose down --remove-orphans

# Prune system
echo -e "${YELLOW}⏸  Limpando sistema Docker...${NC}"
docker system prune -f

echo ""
echo -e "${GREEN}✓ Limpeza concluída!${NC}"
echo -e "${BLUE}Para reiniciar o projeto, execute: ./scripts/setup.sh${NC}"
echo ""
