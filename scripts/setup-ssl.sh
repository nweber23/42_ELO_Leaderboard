#!/bin/bash

# SSL Setup Script for ELO Leaderboard
# This script sets up SSL certificates using Let's Encrypt

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN=${1:-"your-domain.com"}
EMAIL=${2:-"your-email@example.com"}
WEBROOT="/var/www/html"

echo -e "${GREEN}Setting up SSL certificates for ${DOMAIN}${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}Installing certbot...${NC}"
    
    if command -v apt-get &> /dev/null; then
        apt-get update
        apt-get install -y certbot
    elif command -v yum &> /dev/null; then
        yum install -y certbot
    elif command -v dnf &> /dev/null; then
        dnf install -y certbot
    else
        echo -e "${RED}Could not install certbot. Please install it manually.${NC}"
        exit 1
    fi
fi

# Create webroot directory
mkdir -p $WEBROOT

# Stop nginx if running
if docker ps | grep -q elo-leaderboard-nginx; then
    echo -e "${YELLOW}Stopping nginx container...${NC}"
    docker stop elo-leaderboard-nginx || true
fi

# Start a temporary nginx container for certificate verification
echo -e "${YELLOW}Starting temporary nginx for certificate verification...${NC}"
docker run --rm -d --name temp-nginx \
    -p 80:80 \
    -v $WEBROOT:/usr/share/nginx/html \
    nginx:alpine

# Obtain SSL certificate
echo -e "${YELLOW}Obtaining SSL certificate for ${DOMAIN}...${NC}"
certbot certonly \
    --webroot \
    --webroot-path=$WEBROOT \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

# Stop temporary nginx
docker stop temp-nginx

echo -e "${GREEN}SSL certificate obtained successfully!${NC}"
echo -e "${YELLOW}Certificate files are located at:${NC}"
echo -e "Certificate: /etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
echo -e "Private key: /etc/letsencrypt/live/${DOMAIN}/privkey.pem"

# Set up certificate renewal cron job
echo -e "${YELLOW}Setting up automatic certificate renewal...${NC}"
CRON_JOB="0 12 * * * /usr/bin/certbot renew --quiet --deploy-hook 'docker restart elo-leaderboard-nginx'"

# Add cron job if it doesn't exist
if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo -e "${GREEN}Automatic renewal cron job added${NC}"
else
    echo -e "${YELLOW}Cron job for certificate renewal already exists${NC}"
fi

echo -e "${GREEN}SSL setup completed successfully!${NC}"
echo -e "${YELLOW}You can now start your application with SSL enabled.${NC}"