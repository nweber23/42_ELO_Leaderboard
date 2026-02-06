# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a full-stack competitive ranking system for Table Tennis and Table Football at 42 Heilbronn using the ELO rating system. The stack consists of:
- **Backend**: Go 1.21 with Gin framework, PostgreSQL 15
- **Frontend**: React 18, TypeScript 5.3, Vite
- **Infrastructure**: Docker, Docker Compose, Nginx

Authentication is via 42 Intra OAuth with JWT tokens. The system uses a modular ELO architecture where each sport maintains separate ratings per user.

## Development Commands

### Running the Application

```bash
# Start all services (recommended for development)
docker-compose up --build

# Access points:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8080
# - Health check: http://localhost:8080/health
```

### Backend Development

```bash
cd backend

# Install dependencies
go mod download

# Run locally (requires PostgreSQL running)
go run cmd/api/main.go

# Build binary
go build -o bin/api cmd/api/main.go

# Format code
go fmt ./...

# Run linter (if golangci-lint installed)
golangci-lint run
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Run dev server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Database

Database migrations are embedded in Go code at `backend/internal/migrations/*.sql` and are automatically applied on backend startup via the Migrator. There is no separate migration CLI tool.

To reset the database:
```bash
docker-compose down -v  # Removes volumes
docker-compose up --build
```

## Architecture Overview

### Backend Architecture (Go/Gin)

The backend follows a clean architecture pattern with clear separation of concerns:

```
cmd/api/main.go                 # Entry point, dependency injection, route setup
internal/
├── config/                     # Environment variable loading and validation
├── handlers/                   # HTTP request handlers (thin layer)
│   ├── auth_handler.go         # OAuth flow, JWT generation
│   ├── match_handler.go        # Match CRUD, confirmation workflow
│   ├── admin_handler.go        # Admin operations (bans, ELO adjustments)
│   ├── sport_handler.go        # Dynamic sport configuration
│   ├── health_handler.go       # Health checks
│   └── gdpr_handler.go         # GDPR endpoints (data export, deletion)
├── middleware/                 # Request processing layers
│   ├── auth.go                 # JWT validation (Auth + OptionalAuth variants)
│   ├── rate_limiter.go         # In-memory rate limiting
│   ├── security.go             # Security headers
│   ├── admin.go                # Admin privilege verification
│   └── recovery.go             # Panic recovery
├── repositories/               # Data access layer (DB operations only)
│   ├── user_repository.go
│   ├── match_repository.go
│   ├── user_sports_repository.go  # Per-sport stats (modular ELO)
│   └── ...
├── services/                   # Business logic layer
│   ├── elo_service.go          # ELO calculations (K-factor: 32)
│   ├── match_service.go        # Match validation, ELO application
│   └── sport_service.go        # Sport configuration management
├── models/                     # Data structures (User, Match, Comment, etc.)
├── utils/                      # Utilities (JWT, response, validation, sanitization)
├── migrations/                 # SQL migrations (auto-applied on startup)
│   └── *.sql
└── server/                     # HTTP server with graceful shutdown
```

**Key Patterns:**
- **Repository Pattern**: All database access goes through repositories
- **Service Layer**: Business logic lives in services, never in handlers
- **Dependency Injection**: Constructor-based injection throughout
- **Middleware Chain**: Composable request processing (auth → rate limit → ban check → handler)

**ELO System**:
- Standard ELO formula with K-factor of 32
- Expected score: `E = 1 / (1 + 10^((opponentELO - playerELO) / 400))`
- Modular architecture: each sport has separate ratings via `user_sports_data` table

**Match Workflow**:
```
Submit Match → status=pending → Opponent Confirms → status=confirmed → ELO Updated
                              ↓
                         Opponent Denies → status=denied
```

### Frontend Architecture (React/TypeScript)

```
src/
├── App.tsx                     # Root router with lazy loading
├── main.tsx                    # React DOM entry
├── api/
│   └── client.ts               # Centralized Axios instance with all API calls
├── pages/                      # Page components (lazy-loaded for performance)
│   ├── Arena.tsx               # Leaderboard view
│   ├── SubmitMatch.tsx         # Match submission form
│   ├── Admin.tsx               # Admin dashboard
│   └── ...
├── components/                 # Reusable components
│   ├── PlayerPanel.tsx         # Player profile mini-drawer
│   ├── StatsDashboard.tsx      # Charts (ELO history, win rates)
│   └── ...
├── layout/
│   └── Shell.tsx               # Main layout (header, nav, footer)
│       └── PanelContext        # Global player panel state
├── ui/                         # UI primitives (Button, Card, Field, etc.)
├── config/
│   └── sports.ts               # Dynamic sport config fetching with 5-min cache
├── types/
│   └── index.ts                # TypeScript interfaces
├── hooks/                      # Custom React hooks
└── utils/                      # Utility functions
```

**Key Patterns:**
- **Code Splitting**: Pages are lazy-loaded via `React.lazy()`
- **API Client**: All API calls organized by resource type in `api/client.ts`
- **Sport Configuration**: Dynamically fetched from `/api/sports`, cached for 5 minutes, graceful degradation to hardcoded defaults
- **State Management**: Simple React hooks + Context API for global state (theme, player panel)
- **Error Handling**: Global ErrorBoundary component with recovery options

### Database Schema

**Core Tables:**
- `users` - Player profiles with admin flags, ban status
- `user_sports_data` - **Per-sport statistics** (modular ELO system)
- `matches` - Match records with scores, status, ELO deltas
- `comments` - Comments on matches
- `sports` - Dynamic sport configuration (K-factor, score ranges)

**Important**: The system migrated from dual ELO columns on `users` to a modular `user_sports_data` table. Each user can have different ELO ratings for different sports.

## Important Conventions

### Backend

1. **Error Handling**: Always use `utils.JSONError()` for consistent API error responses
2. **Input Validation**: All user input must go through `utils.SanitizeString()` to prevent XSS
3. **SQL Queries**: Always use parameterized queries (already followed everywhere)
4. **Rate Limiting**: Different endpoints have different limits defined in `main.go`:
   - Strict: 10 req/min (match submission)
   - Moderate: 30 req/min (comments)
   - Loose: 100 req/min (read operations)
5. **Authentication**:
   - Use `middleware.Auth()` for protected endpoints
   - Use `middleware.OptionalAuth()` for endpoints that enhance behavior with auth but don't require it
   - Use `middleware.AdminAuth()` for admin-only endpoints
6. **Migrations**: Add new `.sql` files to `backend/internal/migrations/` with incrementing prefixes (`006_`, `007_`, etc.). They are automatically discovered and applied on startup.

### Frontend

1. **API Calls**: Always use functions from `api/client.ts`, never create Axios instances elsewhere
2. **Error Handling**: The Axios interceptor automatically handles 401 redirects and extracts error messages
3. **Sport Configuration**: Always use `getSportConfig()` from `config/sports.ts` to get sport settings (supports dynamic config)
4. **Lazy Loading**: New pages should be lazy-loaded in `App.tsx` using `React.lazy()`
5. **TypeScript**: Interfaces are defined in `types/index.ts` and should match backend models

## Security Considerations

- **OAuth Flow**: 42 Intra OAuth with CSRF token validation on callback
- **JWT**: Tokens are stored in httpOnly cookies (if `USE_HTTPONLY_COOKIE=true`) or localStorage as fallback
- **JWT Secret**: Must be at least 32 characters in production
- **Campus Validation**: Backend enforces that only Heilbronn campus users can access
- **Rate Limiting**: Applied per-endpoint with combined IP + user ID keys
- **Input Sanitization**: All user inputs are sanitized via `utils.SanitizeString()`
- **Ban Enforcement**: Middleware checks `is_banned` flag on protected routes
- **Security Headers**: HSTS, X-Frame-Options, X-Content-Type-Options automatically added

## Environment Configuration

Required variables (see `.env.example`):
- `FT_CLIENT_UID`, `FT_CLIENT_SECRET`, `FT_REDIRECT_URI` - 42 OAuth credentials
- `JWT_SECRET` - Must be 32+ characters for production
- `DATABASE_URL` - PostgreSQL connection string
- `VITE_API_URL` - Frontend API endpoint

Optional but important:
- `DEFAULT_ELO` - Starting ELO (default: 1000)
- `ELO_K_FACTOR` - Rating volatility (default: 32)
- `USE_HTTPONLY_COOKIE` - Use httpOnly cookies for JWT storage (recommended)
- `GIN_MODE` - Set to `release` in production

## Common Tasks

### Adding a New API Endpoint

1. Add handler method to appropriate handler in `backend/internal/handlers/`
2. Register route in `backend/cmd/api/main.go` with appropriate middleware
3. Add corresponding API call to `frontend/src/api/client.ts`
4. Update TypeScript types in `frontend/src/types/index.ts` if needed

### Adding a New Sport

Sports are now dynamically configured. To add a new sport:
1. Insert into `sports` table via admin panel or direct SQL
2. Frontend will automatically fetch and display new sport
3. Users will automatically get `user_sports_data` entries when they play

### Modifying ELO Calculation

The ELO calculation is centralized in `backend/internal/services/elo_service.go`. The K-factor can be adjusted per-sport via the `sports` table or globally via `ELO_K_FACTOR` environment variable.

## Data Flow Example

**Match Submission Flow:**
1. User submits via `SubmitMatch.tsx` → `matchAPI.submitMatch()` in `api/client.ts`
2. Backend receives at `match_handler.SubmitMatch()`
3. Validates sport, scores, opponent, prevents duplicates
4. `MatchService.SubmitMatch()` calculates predicted ELO changes
5. Match created with `status="pending"`
6. Opponent confirms via `POST /api/matches/:id/confirm`
7. `ELOService.CalculateELO()` computes final values
8. `UserSportsRepository` updates ELO in `user_sports_data`
9. Match status updated to `"confirmed"`
10. Cache invalidated, frontend updates leaderboard

## Performance Optimizations

- **Backend**: Gzip compression, in-memory caching (5-min TTL for leaderboards), connection pooling (25 max connections)
- **Frontend**: Code splitting via React.lazy, lazy image loading, 5-minute sport config cache with stale fallback
- **Database**: Composite indexes on frequently queried columns (see `003_add_composite_indexes.sql`)

## Troubleshooting

- **Migrations not applied**: Check backend logs on startup. Migrations are auto-applied.
- **OAuth fails**: Verify `FT_REDIRECT_URI` matches 42 app settings exactly
- **CORS errors**: Check `ALLOWED_ORIGINS` environment variable
- **JWT errors**: Ensure `JWT_SECRET` is at least 32 characters
- **Database connection fails**: Verify PostgreSQL container is healthy and `DATABASE_URL` is correct
