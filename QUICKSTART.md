# 🚀 Quick Start Guide

## Setup (5 minutes)

1. **Start the application**
```bash
docker-compose up --build
```

Wait for all services to start (this may take a few minutes on first run).

2. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Health check: http://localhost:8080/health

## Using the Application

### Login
1. Click "Login with 42 Intra"
2. Authorize the application
3. You'll be redirected back and logged in automatically
4. **Important**: Only Heilbronn campus students can access

### Submit a Match
```bash
curl -X POST http://localhost:8080/api/matches \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sport": "table_tennis",
    "opponent_id": 2,
    "player_score": 21,
    "opponent_score": 18
  }'
```

### View Leaderboards
- Table Tennis: http://localhost:3000/leaderboard/table_tennis
- Table Football: http://localhost:3000/leaderboard/table_football

## Environment Variables

The `.env` file is already configured with:
- ✅ 42 OAuth credentials
- ✅ Database connection
- ✅ Default ELO settings

**⚠️ Before production**:
- Change `JWT_SECRET` to a secure random string (min 32 chars)
- Update `POSTGRES_PASSWORD`
- Update `FT_REDIRECT_URI` to your production domain

### Security Configuration (Production)

For production, enable httpOnly cookies for JWT storage (more secure than localStorage):

```bash
# In your .env file
USE_HTTPONLY_COOKIE=true    # Use httpOnly cookies instead of localStorage
COOKIE_DOMAIN=.yourdomain.com  # Cookie domain (leave empty for localhost)
COOKIE_SECURE=true          # Require HTTPS for cookies
```

Generate a secure JWT secret:
```bash
openssl rand -hex 32
```

### Rate Limiting

The API has built-in rate limiting to prevent abuse:
- **Strict** (10 req/min): Match submission, confirm/deny/cancel
- **Moderate** (30 req/min): Comments
- **Loose** (100 req/min): Read operations

## Development

### Backend Development (without Docker)
```bash
cd backend
go mod download
export $(cat ../.env | xargs)
go run cmd/api/main.go
```

### Frontend Development (without Docker)
```bash
cd frontend
npm install
npm run dev
```

## Testing the Flow

1. **User A logs in** → Gets ELO 1000/1000
2. **User B logs in** → Gets ELO 1000/1000
3. **User A submits match** → Creates pending match (sees ELO prediction)
4. **User B confirms** → ELO ratings updated
5. **Check leaderboard** → Rankings updated
6. **View profiles** → See Statistics Dashboard with charts
7. **Admin actions** → Promote users, revert matches if needed

## Troubleshooting

### Port Already in Use
```bash
docker-compose down
docker-compose up --build
```

### Database Connection Failed
```bash
docker-compose down -v  # Remove volumes
docker-compose up --build
```

### OAuth Callback Not Working
- Check `FT_REDIRECT_URI` matches your OAuth app settings
- Must be: `http://localhost:3000/api/auth/callback`

### CORS Errors
- Backend is configured for `localhost:3000` and `localhost:5173`
- If using different ports, update `backend/cmd/api/main.go`

## Project Structure

```
42_ELO_Leaderboard/
├── backend/                  # Go API
│   ├── cmd/api/             # Main entry point
│   ├── internal/            # Business logic
│   │   ├── cache/           # In-memory caching with TTL
│   │   ├── config/          # Configuration
│   │   ├── handlers/        # HTTP handlers (auth, match, admin)
│   │   ├── services/        # Business logic (ELO, caching)
│   │   ├── repositories/    # Database layer
│   │   ├── models/          # Data models
│   │   ├── middleware/      # Auth, rate limiting, ban middleware
│   │   └── utils/           # JWT, response, sanitization utilities
│   └── migrations/          # SQL migrations
│
├── frontend/                # React app
│   ├── src/
│   │   ├── api/            # API client (Axios)
│   │   ├── components/     # Reusable components
│   │   │   ├── Comments.tsx      # Match comments
│   │   │   ├── ErrorBoundary.tsx # Error handling
│   │   │   ├── LazyImage.tsx     # Lazy-loaded images
│   │   │   └── StatsDashboard.tsx # Statistics charts
│   │   ├── hooks/          # Custom hooks (useUsers, usePerformance)
│   │   ├── layout/         # App shell and page layouts
│   │   ├── pages/          # Page components
│   │   │   ├── Admin.tsx         # Admin panel
│   │   │   ├── Leaderboard.tsx   # Rankings
│   │   │   ├── Matches.tsx       # Match history
│   │   │   ├── PlayerProfile.tsx # Player stats
│   │   │   ├── SubmitMatch.tsx   # Submit matches
│   │   │   └── Login.tsx         # OAuth login
│   │   ├── state/          # State management (theme, toast)
│   │   ├── styles/         # Global styles and CSS tokens
│   │   ├── types/          # TypeScript types
│   │   ├── ui/             # UI primitives (Button, Card, etc.)
│   │   └── utils/          # Utility functions
│   └── Dockerfile
│
├── docker-compose.yml       # Container orchestration
├── .env                     # Environment variables
└── README.md               # Full documentation
```

## Next Steps

1. ✅ Application is running
2. 📝 Customize the UI (frontend/src/pages/)
3. 👨‍💼 Set up admin users for moderation
4. 📊 Explore the Statistics Dashboard
5. 🚀 Deploy to production

## Features Overview

| Feature | Description |
|---------|-------------|
| **Leaderboard** | View rankings by sport with search |
| **Match Submission** | Submit matches with ELO prediction |
| **Player Profiles** | View stats, history, and charts |
| **Admin Panel** | Manage users, revert matches, ban players |
| **Statistics** | ELO history, win rates, head-to-head |
| **Social** | React with emojis and comment on matches |
| **Statistics** | ELO history, win rates, head-to-head |
| **Social** | Comment on matches |

- Check the full README.md for detailed documentation
- Backend API docs: http://localhost:8080/health
- Frontend: http://localhost:3000

Happy coding! 🎉
