#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Health Check - ft_transcendence                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check HTTP endpoint
check_http() {
    local service=$1
    local url=$2
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" = "200" ] || [ "$response" = "301" ] || [ "$response" = "302" ]; then
        echo -e "${GREEN}✓ $service - OK (HTTP $response)${NC}"
        return 0
    else
        echo -e "${RED}✗ $service - FALHOU (HTTP $response)${NC}"
        return 1
    fi
}

# Function to check container status
check_container() {
    local container=$1
    local status=$(docker-compose ps "$container" 2>/dev/null | grep -i "up" || echo "down")
    
    if [[ $status == *"up"* ]]; then
        echo -e "${GREEN}✓ Container $container - Rodando${NC}"
        return 0
    else
        echo -e "${RED}✗ Container $container - Parado${NC}"
        return 1
    fi
}

echo -e "${BLUE}🐳 Verificando Containers Docker...${NC}"
echo ""

containers=("ft_transcendence_postgres" "ft_transcendence_redis" "ft_transcendence_backend" "ft_transcendence_frontend")

container_ok=0
for container in "${containers[@]}"; do
    if check_container "$container"; then
        ((container_ok++))
    fi
done

echo ""
echo -e "${BLUE}🌐 Verificando Endpoints HTTP...${NC}"
echo ""

# Wait a bit for services to be ready
sleep 2

endpoints_ok=0
total_endpoints=0

# Check each service endpoint
services=(
    "Frontend:http://localhost:3000"
    "Backend API:http://localhost:3001/health"
)

for service_url in "${services[@]}"; do
    IFS=':' read -r service url <<< "$service_url"
    ((total_endpoints++))
    if check_http "$service" "$url"; then
        ((endpoints_ok++))
    fi
done

echo ""
echo -e "${BLUE}📊 Resumo do Status:${NC}"
echo -e "   Containers: ${GREEN}$container_ok${NC}/${#containers[@]} rodando"
echo -e "   Endpoints:  ${GREEN}$endpoints_ok${NC}/$total_endpoints respondendo"
echo ""

# Overall health
if [ $container_ok -eq ${#containers[@]} ] && [ $endpoints_ok -eq $total_endpoints ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║         Sistema 100% Operacional! ✓                    ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    exit 0
elif [ $container_ok -gt 0 ] && [ $endpoints_ok -gt 0 ]; then
    echo -e "${YELLOW}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║         Sistema Parcialmente Operacional ⚠             ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════════════════╝${NC}"
    exit 1
else
    echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║         Sistema Inoperante ✗                           ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
    exit 2
fi
