#!/bin/bash
set -e

COMPOSE_FILE="./config/docker-compose.yaml"
ENV_FILE="./config/.env"
ENV_EXAMPLE="./config/.env.example"
DOCKER="docker compose -f $COMPOSE_FILE --env-file $ENV_FILE"

echo "ft_prodd( ... ) - Setup"

# Generate TLS certificates
CERTS_DIR="./config/certs"
if [ ! -f "$CERTS_DIR/nginx-selfsigned.crt" ]; then
	echo "Generating TLS certificates..."
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout "$CERTS_DIR/nginx-selfsigned.key" \
		-out "$CERTS_DIR/nginx-selfsigned.crt" \
		-subj "/C=PT/ST=Lisboa/L=Lisboa/O=ft_prodd/CN=localhost" \
		-addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
	echo "Certificates generated in $CERTS_DIR"
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
	echo "Docker is not running. Please start Docker and try again."
	exit 1
fi

echo "Docker is running"

# Check if .env exists, if not create from .env.example
if [ ! -f "$ENV_FILE" ]; then
	echo ".env file not found. Creating from .env.example..."

	if [ -f "$ENV_EXAMPLE" ]; then
		cp "$ENV_EXAMPLE" "$ENV_FILE"
		echo ".env file created"
		echo "IMPORTANT: Edit the .env file with your credentials before continuing!"
		read -p "Press ENTER after configuring .env to continue..."
	else
		echo ".env.example file not found!"
		exit 1
	fi
else
	echo ".env file found"
fi

# Stop any running containers
echo "Stopping existing containers..."
$DOCKER down

# Remove old volumes (optional)
read -p "Remove old volumes? (data will be lost) [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
	echo "Removing volumes..."
	$DOCKER down -v
	echo "Volumes removed"
fi

# Build all images
echo "Building Docker images..."
$DOCKER build

echo "Images built successfully"

# Start containers
echo "Starting containers..."
$DOCKER up -d

# Wait for services to be ready
echo "Waiting for services..."
sleep 10

# Check service health
echo "Checking service health..."

services=("nginx" "postgres" "backend" "frontend")

for service in "${services[@]}"; do
	status=$($DOCKER ps "$service" | grep -i "up\|healthy" || echo "down")
	if [[ $status == *"down"* ]]; then
		echo "$service - not running"
	else
		echo "$service - running"
	fi
done

echo ""
echo "Setup complete"
echo ""
echo "Services:"
echo "  Frontend:    https://localhost:3000"
echo "  Backend API: https://localhost:3001"
echo "  Health:      https://localhost:3001/api/health"
