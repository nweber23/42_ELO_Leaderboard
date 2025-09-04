# ELO Leaderboard

A web application for tracking player rankings using the ELO rating system. Built with a Golang backend, React/Next.js frontend, and nginx reverse proxy.

## Features

- Player management (add, view, update, delete players)
- Match recording with automatic ELO calculation
- Real-time leaderboard with rankings
- Match history tracking
- Statistics dashboard
- RESTful API with Swagger documentation

## Tech Stack

- **Backend**: Go (Gin framework)
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Reverse Proxy**: Nginx
- **Containerization**: Docker & Docker Compose

## Project Structure

```
├── Backend/              # Golang API server
│   ├── api/             # API handlers and models
│   ├── docs/            # Swagger documentation (auto-generated)
│   ├── main.go          # Application entry point
│   ├── go.mod           # Go dependencies
│   └── Dockerfile       # Backend container config
├── Frontend/            # Next.js application
│   ├── app/             # App router pages and components
│   │   ├── components/  # React components
│   │   ├── lib/         # API client and utilities
│   │   └── page.tsx     # Main page
│   ├── package.json     # Node.js dependencies
│   └── Dockerfile       # Frontend container config
├── Nginx/               # Reverse proxy configuration
│   ├── default.conf     # Nginx config
│   └── Dockerfile       # Nginx container config
├── docker-compose.yml   # Multi-container setup
├── Makefile            # Build and run commands
└── README.md           # This file
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- (Optional) Go 1.23+ and Node.js 20+ for development

### Quick Start

1. Clone the repository
2. Start all services:
   ```bash
   make up
   ```
3. Open your browser to http://localhost:80

The application will be available at:
- **Frontend**: http://localhost:80 (via nginx)
- **Backend API**: http://localhost:8081/api
- **API Documentation**: http://localhost:8081/swagger/index.html

### Development Mode

To run services individually for development:

1. **Backend**:
   ```bash
   cd Backend
   go mod tidy
   make dev-backend
   ```

2. **Frontend**:
   ```bash
   cd Frontend
   npm install
   make dev-frontend
   ```

### Available Commands

- `make up` - Start all services with Docker Compose
- `make down` - Stop all services
- `make build` - Build all Docker images
- `make clean` - Clean up containers and images
- `make logs` - View logs from all services
- `make logs-frontend` - View frontend logs only
- `make logs-backend` - View backend logs only
- `make logs-nginx` - View nginx logs only

## API Endpoints

The backend provides a RESTful API with the following endpoints:

- `GET /api/players` - List all players
- `POST /api/players` - Create a new player
- `GET /api/players/:id` - Get a specific player
- `PUT /api/players/:id` - Update a player
- `DELETE /api/players/:id` - Delete a player
- `GET /api/matches` - List all matches
- `POST /api/matches` - Create a new match
- `GET /api/matches/:id` - Get a specific match
- `GET /api/leaderboard` - Get ranked leaderboard
- `GET /api/stats` - Get overall statistics
- `GET /api/health` - Health check endpoint

For detailed API documentation, visit the Swagger UI at http://localhost:8081/swagger/index.html when the backend is running.

## ELO Rating System

The application uses the standard ELO rating system:
- New players start with an ELO rating of 1200
- Ratings are updated after each match using a K-factor of 32
- Supports wins, losses, and draws
- Players are ranked by their current ELO rating

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the changes
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).