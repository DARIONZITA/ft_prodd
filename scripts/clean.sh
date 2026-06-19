#!/bin/bash
set -e

COMPOSE_FILE="./config/docker-compose.yaml"
ENV_FILE="./config/.env"
DOCKER="docker compose -f $COMPOSE_FILE --env-file $ENV_FILE"

echo "Complete Cleanup - ft_prodd( ... )"
echo ""
echo "WARNING: This will remove:"
echo "  - All containers"
echo "  - All volumes (DATA WILL BE LOST)"
echo "  - All built images"
echo "  - All created networks"
echo ""

read -p "Are you sure you want to continue? [y/N]: " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
	echo "Operation cancelled."
	exit 0
fi

echo ""

# Stop all containers
echo "Stopping containers..."
$DOCKER down

# Remove volumes
echo "Removing volumes..."
$DOCKER down -v

# Remove images
echo "Removing images..."
$DOCKER down --rmi all

# Remove orphaned containers
echo "Removing orphaned containers..."
$DOCKER down --remove-orphans

# Prune system
echo "Cleaning Docker system..."
docker system prune -f

echo ""
echo "Cleanup complete!"
echo "To restart the project, run: make setup"
