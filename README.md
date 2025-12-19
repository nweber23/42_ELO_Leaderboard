# 42 Heilbronn ELO Leaderboard

A production-ready, mobile-friendly web application for 42 Heilbronn students to track competitive rankings in **Table Tennis** and **Table Football** using ELO ratings.

## Features

- **42 Intra OAuth Authentication** - Only verified Heilbronn campus students can access
- **Match Submission & Confirmation** - Submit results with opponent confirmation required
- **Independent ELO Rankings** - Separate leaderboards for each sport
- **Match History** - Filter by sport, opponent, and win/loss
- **Player Statistics** - Win streaks, highest ELO, most played rival
- **Social Features** - Emoji reactions and comments on matches
- **Mobile-Friendly** - Responsive design for all devices

## Tech Stack

### Backend
- **Language**: Go 1.21
- **Framework**: Gin
- **Database**: PostgreSQL 15
- **Architecture**: Clean architecture (handlers/services/repositories)
- **Authentication**: 42 Intra OAuth + JWT

### Frontend
- **Language**: TypeScript
- **Framework**: React 18 + Vite
- **HTTP Client**: Axios
- **Routing**: React Router

### Deployment
- **Containerization**: Docker + docker-compose
- **Database**: PostgreSQL with automated migrations

## Quick Start

### Prerequisites

- Docker and docker-compose
- 42 Intra OAuth credentials (provided)

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd 42_ELO_Leaderboard
```

2. **Configure environment variables**
```bash
cp .env.example .env
```

The `.env.example` already contains the correct 42 OAuth credentials:
- `FT_CLIENT_UID`: u-s4t2ud-af579aa150e1b3b246a696594d65d4e9e9835f7c6cee028fd09064b339c6b7b2
- `FT_CLIENT_SECRET`: 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
- `FT_REDIRECT_URI`: http://localhost:3000/api/auth/callback

**Important**: Update `JWT_SECRET` in production!

3. **Start the application**
```bash
docker-compose up --build
```

This will start:
- PostgreSQL database on port 5432
- Go backend API on port 8080
- React frontend on port 3000

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Health check: http://localhost:8080/health

## Architecture

### Database Schema

#### users table
- `id`, `intra_id` (unique), `login`, `display_name`, `avatar_url`, `campus`
- `table_tennis_elo` (default 1000), `table_football_elo` (default 1000)
- Timestamps: `created_at`, `updated_at`

#### matches table
- `id`, `sport` (table_tennis | table_football)
- `player1_id`, `player2_id`, `winner_id`
- `player1_score`, `player2_score`
- `status` (pending | confirmed | denied)
- ELO data: `*_elo_before`, `*_elo_after`, `*_elo_delta`
- `submitted_by`, `confirmed_at`, `denied_at`
- Timestamps: `created_at`, `updated_at`

#### reactions table
- `id`, `match_id`, `user_id`, `emoji`
- Unique constraint: (match_id, user_id, emoji)

#### comments table
- `id`, `match_id`, `user_id`, `content` (max 500 chars)
- Timestamps: `created_at`, `updated_at`

### API Endpoints

#### Public
- `GET /api/auth/login` - Get 42 OAuth URL
- `GET /api/auth/callback` - Handle OAuth callback
- `GET /api/leaderboard/:sport` - Get leaderboard

#### Protected (require JWT)
- `GET /api/auth/me` - Get current user
- `POST /api/matches` - Submit match
- `POST /api/matches/:id/confirm` - Confirm match
- `POST /api/matches/:id/deny` - Deny match
- `GET /api/matches` - List matches (with filters)
- `GET /api/matches/:id` - Get match details
- `POST /api/matches/:id/reactions` - Add reaction
- `GET /api/matches/:id/reactions` - Get reactions
- `POST /api/matches/:id/comments` - Add comment
- `GET /api/matches/:id/comments` - Get comments

## ELO Rating System

### Formula
The system uses the standard ELO formula:

1. **Expected Score**:
   ```
   E = 1 / (1 + 10^((opponent_elo - player_elo) / 400))
   ```

2. **New Rating**:
   ```
   R' = R + K * (S - E)
   ```

Where:
- `R` = current rating
- `K` = K-factor (32, configurable via `ELO_K_FACTOR`)
- `S` = actual score (1 for win, 0 for loss)
- `E` = expected score

### Key Points
- **Starting ELO**: 1000 (configurable via `DEFAULT_ELO`)
- **K-Factor**: 32 (higher = more volatile ratings)
- **Independent Ratings**: Each sport maintains separate ELO
- **Transaction-Safe**: ELO updates are atomic

## 42 Intra OAuth Flow

### Process
1. User clicks "Login with 42"
2. Frontend requests auth URL from backend
3. User redirected to 42 OAuth page
4. User authorizes application
5. 42 redirects back with authorization code
6. Backend exchanges code for access token
7. Backend fetches user info from 42 API
8. **Campus Validation**: Only "Heilbronn" campus allowed
9. User created/updated in database
10. JWT token generated and returned to frontend

### Campus Validation Logic

```go
// In auth_handler.go:66-69
if userInfo.Campus.Name != "Heilbronn" {
    c.JSON(http.StatusForbidden, gin.H{
        "error": "only Heilbronn campus students are allowed"
    })
    return
}
```

Only users with `campus.name == "Heilbronn"` from the 42 API response can proceed.

## Match Workflow

### 1. Submission
- User A submits match result against User B
- Validations:
  - Cannot play against yourself
  - Cannot have ties (must have winner)
  - No duplicate pending matches
- Match created with `status=pending`

### 2. Confirmation
- User B (opponent) receives notification
- **Only User B can confirm** (User A cannot confirm their own match)
- On confirmation:
  - ELO ratings calculated for both players
  - Match updated with ELO deltas
  - User ELO ratings updated atomically (transaction)
  - `status=confirmed`

### 3. Denial
- User B can deny the match
- **Only User B can deny** (User A cannot deny their own match)
- Denied matches stored but don't affect ELO
- `status=denied`

## Sports Definition

The valid sports are **EXACTLY**:
- `table_tennis` (displayed as "Table Tennis")
- `table_football` (displayed as "Table Football")

These are hardcoded in the database schema and validated in the backend.

## Security

### Authentication
- OAuth client secret stored only in backend (env var)
- JWT tokens for session management
- Token validation on all protected endpoints

### Input Validation
- All endpoints validate input using Gin's binding
- SQL injection prevented via prepared statements
- XSS prevention through sanitized inputs

### Database
- Foreign key constraints
- CHECK constraints (sport, status, scores >= 0)
- Unique constraints (no duplicate reactions)

## Development

### Backend Development
```bash
cd backend
go mod download
go run cmd/api/main.go
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Database Migrations
Migrations run automatically on container startup via PostgreSQL init scripts.

## Production Deployment

1. **Update environment variables**:
   - Generate secure `JWT_SECRET`
   - Use production database credentials
   - Update `FT_REDIRECT_URI` to production URL

2. **Build and deploy**:
```bash
docker-compose up -d --build
```

3. **Configure reverse proxy** (Nginx/Caddy) for HTTPS

## Troubleshooting

### OAuth Callback Fails
- Verify `FT_REDIRECT_URI` matches OAuth app settings
- Check that backend is accessible at the callback URL

### Database Connection Issues
- Ensure PostgreSQL container is healthy
- Check `DATABASE_URL` format
- Verify network connectivity between containers

### CORS Errors
- Backend CORS is configured for `localhost:3000` and `localhost:5173`
- Update CORS settings in `backend/cmd/api/main.go` for production

## License

This project is for 42 Heilbronn students only.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues or questions, please open a GitHub issue or contact the development team.

---

**Built with ❤️ for 42 Heilbronn**
