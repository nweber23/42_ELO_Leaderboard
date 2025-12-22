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
- Change `JWT_SECRET` to a secure random string
- Update `POSTGRES_PASSWORD`
- Update `FT_REDIRECT_URI` to your production domain

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
3. **User A submits match** → Creates pending match
4. **User B confirms** → ELO ratings updated
5. **Check leaderboard** → Rankings updated

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
├── backend/              # Go API
│   ├── cmd/api/         # Main entry point
│   ├── internal/        # Business logic
│   │   ├── config/      # Configuration
│   │   ├── handlers/    # HTTP handlers
│   │   ├── services/    # Business logic
│   │   ├── repositories/# Database layer
│   │   ├── models/      # Data models
│   │   ├── middleware/  # Auth middleware
│   │   └── utils/       # JWT utilities
│   └── migrations/      # SQL migrations
│
├── frontend/            # React app
│   ├── src/
│   │   ├── api/        # API client
│   │   ├── pages/      # Page components
│   │   ├── types/      # TypeScript types
│   │   └── App.tsx     # Main app
│   └── Dockerfile
│
├── docker-compose.yml   # Container orchestration
├── .env                 # Environment variables
└── README.md           # Full documentation
```

## Next Steps

1. ✅ Application is running
2. 📝 Customize the UI (frontend/src/)
3. 🎨 Add more features (reactions, comments)
4. 🚀 Deploy to production
5. 📊 Monitor usage

## Support

- Check the full README.md for detailed documentation
- Backend API docs: http://localhost:8080/health
- Frontend: http://localhost:3000

Happy coding! 🎉
