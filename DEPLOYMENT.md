# ELO Leaderboard - Server Deployment Guide

This guide will help you deploy the ELO Leaderboard application on your server with SSL/HTTPS support.

## Prerequisites

Before deploying, ensure your server has:

- **Docker** (version 20.10+)
- **Docker Compose** (version 2.0+)
- A **domain name** pointing to your server's IP address
- **Root/sudo access** on the server
- **Ports 80 and 443** open in your firewall

## Quick Deployment

### 1. Server Setup

```bash
# Update your system
sudo apt update && sudo apt upgrade -y

# Install Docker (if not already installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add your user to docker group (optional)
sudo usermod -aG docker $USER
# Log out and log back in for this to take effect
```

### 2. Deploy the Application

```bash
# Clone or upload your project to the server
git clone <your-repo-url> /opt/elo-leaderboard
# OR upload the project files to /opt/elo-leaderboard

cd /opt/elo-leaderboard

# Copy and configure environment file
cp .env.example .env
nano .env  # Edit with your configuration
```

### 3. Configure Environment

Edit the `.env` file with your settings:

```bash
# Domain Configuration
DOMAIN=yourdomain.com

# SSL/TLS Configuration
USE_SSL=true

# Email for Let's Encrypt certificates
LETSENCRYPT_EMAIL=your-email@example.com

# Application Environment
NODE_ENV=production

# Security
SECRET_KEY=your_generated_secret_key
```

### 4. Deploy

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Deploy the application
./scripts/deploy.sh
```

### 5. Setup SSL (Recommended)

```bash
# Setup SSL certificates with Let's Encrypt
sudo ./scripts/setup-ssl.sh yourdomain.com your-email@example.com
```

### 6. Restart with SSL

```bash
# After SSL setup, restart the application
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

## Manual Deployment Steps

If you prefer manual deployment or need to customize the process:

### Step 1: Prepare Configuration Files

1. **Update domain in nginx configuration:**
   ```bash
   sed -i 's/your-domain.com/yourdomain.com/g' Nginx/production.conf
   ```

2. **Update CORS settings in backend:**
   ```bash
   sed -i 's/your-domain.com/yourdomain.com/g' Backend/main.go
   ```

### Step 2: SSL Certificate Setup

```bash
# Install certbot
sudo apt install certbot

# Create webroot directory
sudo mkdir -p /var/www/html

# Stop any running nginx
docker stop elo-leaderboard-nginx 2>/dev/null || true

# Get SSL certificate
sudo certbot certonly \
  --webroot \
  --webroot-path=/var/www/html \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d yourdomain.com \
  -d www.yourdomain.com
```

### Step 3: Deploy Application

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up --build -d

# Verify deployment
curl -f http://localhost:8081/api/health
curl -f https://yourdomain.com
```

## Post-Deployment

### Verify Everything is Working

1. **Check container status:**
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

2. **Check application accessibility:**
   - Frontend: https://yourdomain.com
   - API Health: https://yourdomain.com/api/health
   - API Documentation: https://yourdomain.com/swagger/index.html

3. **Monitor logs:**
   ```bash
   # All services
   docker-compose -f docker-compose.prod.yml logs -f
   
   # Specific service
   docker-compose -f docker-compose.prod.yml logs -f backend
   ```

### SSL Certificate Auto-Renewal

The SSL setup script automatically configures certificate renewal. Verify it's working:

```bash
# Check cron job
sudo crontab -l | grep certbot

# Test renewal (dry run)
sudo certbot renew --dry-run
```

## Maintenance

### Update Application

```bash
cd /opt/elo-leaderboard

# Pull latest changes (if using git)
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up --build -d
```

### Backup

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p backups
tar -czf backups/elo-leaderboard-$DATE.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=backups \
  .
EOF

chmod +x backup.sh
./backup.sh
```

### Monitor Resources

```bash
# Check container resource usage
docker stats

# Check disk usage
df -h
```

## Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Check what's using port 80/443
   sudo netstat -tulpn | grep :80
   sudo netstat -tulpn | grep :443
   
   # Stop conflicting services
   sudo systemctl stop apache2  # or nginx
   ```

2. **SSL certificate issues:**
   ```bash
   # Check certificate status
   sudo certbot certificates
   
   # Renew certificate manually
   sudo certbot renew --force-renewal
   ```

3. **Container build failures:**
   ```bash
   # Clean up Docker
   docker system prune -a
   
   # Rebuild from scratch
   docker-compose -f docker-compose.prod.yml build --no-cache
   ```

### View Logs

```bash
# Application logs
docker-compose -f docker-compose.prod.yml logs -f [service-name]

# Nginx access logs
docker exec elo-leaderboard-nginx tail -f /var/log/nginx/access.log

# System logs
sudo journalctl -u docker -f
```

## Security Considerations

1. **Firewall Configuration:**
   ```bash
   # Enable UFW
   sudo ufw enable
   
   # Allow necessary ports
   sudo ufw allow 22     # SSH
   sudo ufw allow 80     # HTTP
   sudo ufw allow 443    # HTTPS
   ```

2. **Regular Updates:**
   ```bash
   # System updates
   sudo apt update && sudo apt upgrade -y
   
   # Docker image updates
   docker-compose -f docker-compose.prod.yml pull
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Monitoring:**
   - Set up log rotation
   - Monitor disk space
   - Set up alerts for service failures

## Support

If you encounter issues:

1. Check the logs for error messages
2. Verify your domain DNS settings
3. Ensure all ports are open
4. Check SSL certificate validity

For additional help, check the main README.md or create an issue in the project repository.

---

**🎉 Your ELO Leaderboard should now be running at https://yourdomain.com!**