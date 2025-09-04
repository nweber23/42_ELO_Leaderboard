.PHONY: up down build clean logs deploy prod-up prod-down

# Development commands
up:
	docker-compose up --build -d

down:
	docker-compose down

build:
	docker-compose build

# Production deployment commands
deploy:
	./scripts/deploy.sh

prod-up:
	docker-compose -f docker-compose.prod.yml up --build -d

prod-down:
	docker-compose -f docker-compose.prod.yml down

prod-build:
	docker-compose -f docker-compose.prod.yml build

# SSL setup
setup-ssl:
	sudo ./scripts/setup-ssl.sh $(DOMAIN) $(EMAIL)

# Clean up containers and images
clean:
	docker-compose down -v
	docker-compose -f docker-compose.prod.yml down -v
	docker system prune -f

# View logs
logs:
	docker-compose logs -f

logs-prod:
	docker-compose -f docker-compose.prod.yml logs -f

# View logs for specific service
logs-frontend:
	docker-compose logs -f frontend

logs-backend:
	docker-compose logs -f backend

logs-nginx:
	docker-compose logs -f nginx

# Production service logs
logs-frontend-prod:
	docker-compose -f docker-compose.prod.yml logs -f frontend

logs-backend-prod:
	docker-compose -f docker-compose.prod.yml logs -f backend

logs-nginx-prod:
	docker-compose -f docker-compose.prod.yml logs -f nginx

# Start development mode
dev-backend:
	cd Backend && go run main.go

dev-frontend:
	cd Frontend && npm run dev

# Health checks
health:
	curl -f http://localhost:8081/api/health

health-prod:
	curl -f https://$(DOMAIN)/api/health || curl -f http://$(DOMAIN)/api/health

# Backup
backup:
	./scripts/backup.sh