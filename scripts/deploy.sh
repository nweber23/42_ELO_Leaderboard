#!/bin/bash

# Deployment script for ELO Leaderboard
# This script handles the complete deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN=${DOMAIN:-"your-domain.com"}
USE_SSL=${USE_SSL:-"true"}

echo -e "${BLUE}🚀 ELO Leaderboard Deployment Script${NC}"
echo "========================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  No .env file found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}📝 Please edit .env file with your configuration before continuing.${NC}"
    read -p "Press Enter to continue after editing .env file..."
fi

# Load environment variables
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

echo -e "${YELLOW}🔧 Configuration:${NC}"
echo "   Domain: ${DOMAIN}"
echo "   SSL Enabled: ${USE_SSL}"

# Update domain in nginx configuration
if [ "$DOMAIN" != "your-domain.com" ]; then
    echo -e "${YELLOW}📝 Updating domain in nginx configuration...${NC}"
    sed -i "s/your-domain.com/$DOMAIN/g" Nginx/production.conf
    
    # Update CORS origins in backend
    sed -i "s/your-domain.com/$DOMAIN/g" Backend/main.go
fi

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Clean up any orphaned containers
echo -e "${YELLOW}🧹 Cleaning up orphaned containers...${NC}"
docker container prune -f 2>/dev/null || true

# Build and start containers
echo -e "${YELLOW}🏗️  Building and starting containers...${NC}"
docker-compose -f docker-compose.prod.yml up --build -d

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 10

# Health check
echo -e "${YELLOW}🔍 Performing health checks...${NC}"
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost:8081/api/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is healthy${NC}"
        break
    else
        echo -e "${YELLOW}⏳ Waiting for backend... (attempt $attempt/$max_attempts)${NC}"
        sleep 2
        ((attempt++))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    echo -e "${RED}❌ Backend health check failed${NC}"
    echo -e "${YELLOW}📋 Container logs:${NC}"
    docker-compose -f docker-compose.prod.yml logs backend
    exit 1
fi

# Check if frontend is accessible
if curl -f http://localhost >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${RED}❌ Frontend is not accessible${NC}"
    echo -e "${YELLOW}📋 Container logs:${NC}"
    docker-compose -f docker-compose.prod.yml logs nginx
    docker-compose -f docker-compose.prod.yml logs frontend
fi

echo ""
echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo "========================================"
echo -e "${BLUE}📍 Your application is available at:${NC}"

if [ "$USE_SSL" = "true" ] && [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "   🌐 https://$DOMAIN"
    echo "   📚 API Documentation: https://$DOMAIN/swagger/index.html"
else
    echo "   🌐 http://$DOMAIN (or http://your-server-ip)"
    echo "   📚 API Documentation: http://$DOMAIN/swagger/index.html"
fi

echo ""
echo -e "${YELLOW}🔧 Useful commands:${NC}"
echo "   📋 View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   🛑 Stop: docker-compose -f docker-compose.prod.yml down"
echo "   🔄 Restart: docker-compose -f docker-compose.prod.yml restart"

if [ "$USE_SSL" = "true" ] && [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo ""
    echo -e "${YELLOW}🔒 To enable SSL, run:${NC}"
    echo "   sudo ./scripts/setup-ssl.sh $DOMAIN $LETSENCRYPT_EMAIL"
fi