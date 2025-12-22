<div align="center">

# 🏓 42 Heilbronn ELO Leaderboard

**A competitive ranking system for Table Tennis & Table Football at 42 Heilbronn**

[![Go](https://img.shields.io/badge/Go-1.21-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://golang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

---

*Track your matches, climb the rankings, and become the ultimate champion!*

</div>

## 📖 About

The 42 Heilbronn ELO Leaderboard is a full-stack web application that enables students to track competitive rankings in **Table Tennis** and **Table Football** using the ELO rating system. Authenticate with your 42 Intra account, submit match results, and watch your rating evolve as you compete against fellow students.

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **42 OAuth** | Secure authentication via 42 Intra (Heilbronn campus only) |
| 🎮 **Match System** | Submit results with opponent confirmation workflow |
| 📊 **ELO Rankings** | Independent ratings for each sport (starting at 1000) |
| 📈 **Statistics** | Win streaks, highest ELO, win rates, and more |
| 📜 **Match History** | Filter by sport, opponent, and outcome |
| 💬 **Social** | React with emojis and comment on matches |
| 📱 **Responsive** | Mobile-friendly design for all devices |

## 🛠️ Tech Stack

<table>
<tr>
<td align="center" width="50%">

### Backend

![Go](https://img.shields.io/badge/Go-00ADD8?style=flat-square&logo=go&logoColor=white)
![Gin](https://img.shields.io/badge/Gin-008ECF?style=flat-square&logo=gin&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)

- **Go 1.21** with Gin framework
- **PostgreSQL 15** database
- Clean architecture pattern
- 42 Intra OAuth + JWT auth

</td>
<td align="center" width="50%">

### Frontend

![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=flat-square&logo=reactrouter&logoColor=white)

- **React 18** + **TypeScript**
- **Vite** for fast development
- Axios for API calls
- Custom CSS styling

</td>
</tr>
<tr>
<td align="center" colspan="2">

### Infrastructure

![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=flat-square&logo=nginx&logoColor=white)
![Docker Compose](https://img.shields.io/badge/Docker_Compose-2496ED?style=flat-square&logo=docker&logoColor=white)

Fully containerized with multi-stage builds, automated migrations, and production-ready configuration

</td>
</tr>
</table>

## 🚀 Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- 42 Intra OAuth credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nweber23/42_ELO_Leaderboard.git
   cd 42_ELO_Leaderboard
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   > ⚠️ **Important:** Update `JWT_SECRET` with a secure random string for production!

3. **Start the application**
   ```bash
   docker-compose up --build
   ```

4. **Access the app**
   | Service | URL |
   |---------|-----|
   | 🌐 Frontend | http://localhost:3000 |
   | 🔧 Backend API | http://localhost:8080 |
   | ❤️ Health Check | http://localhost:8080/health |

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    Frontend     │────▶│     Backend     │────▶│   PostgreSQL    │
│   (React/TS)    │     │    (Go/Gin)     │     │                 │
│   Port: 3000    │     │   Port: 8080    │     │   Port: 5432    │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
       Nginx              REST API              Database
```

### Project Structure

```
42_ELO_Leaderboard/
├── backend/
│   ├── cmd/api/          # Application entrypoint
│   ├── internal/
│   │   ├── config/       # Configuration management
│   │   ├── handlers/     # HTTP request handlers
│   │   ├── middleware/   # Auth middleware
│   │   ├── models/       # Data models
│   │   ├── repositories/ # Database layer
│   │   ├── services/     # Business logic
│   │   └── utils/        # JWT utilities
│   └── migrations/       # SQL migrations
├── frontend/
│   ├── src/
│   │   ├── api/          # API client
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── ui/           # UI primitives
│   │   └── styles/       # Global styles
│   └── nginx.conf        # Production server config
└── docker-compose.yml
```

## 🎮 How It Works

### ELO Rating System

The app uses the standard ELO formula with a **K-factor of 32**:

$$E_A = \frac{1}{1 + 10^{(R_B - R_A)/400}}$$

$$R'_A = R_A + K \cdot (S_A - E_A)$$

Where:
- $R_A$, $R_B$ = Current ratings
- $E_A$ = Expected score
- $S_A$ = Actual score (1 for win, 0 for loss)
- $K$ = 32 (rating volatility)

### Match Workflow

```
Submit Match → Pending → Opponent Confirms → ELO Updated
                  ↓
              Opponent Denies → Match Rejected
```

## 🗃️ Database Schema

| Table | Description |
|-------|-------------|
| `users` | Player profiles with dual ELO ratings (one per sport) |
| `matches` | Match records with scores, status, and ELO deltas |
| `reactions` | Emoji reactions on matches |
| `comments` | Text comments on matches |

## 📡 API Reference

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/auth/login` | Get 42 OAuth URL |
| `GET` | `/api/auth/callback` | Handle OAuth callback |
| `GET` | `/api/leaderboard/:sport` | Get sport leaderboard |
| `GET` | `/health` | Health check |

### Protected Endpoints (JWT Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/auth/me` | Get current user |
| `POST` | `/api/matches` | Submit a match |
| `POST` | `/api/matches/:id/confirm` | Confirm a match |
| `POST` | `/api/matches/:id/deny` | Deny a match |
| `GET` | `/api/matches` | List matches (with filters) |
| `POST` | `/api/matches/:id/reactions` | Add emoji reaction |
| `POST` | `/api/matches/:id/comments` | Add comment |

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FT_CLIENT_UID` | 42 OAuth client ID | - |
| `FT_CLIENT_SECRET` | 42 OAuth client secret | - |
| `FT_REDIRECT_URI` | OAuth callback URL | `http://localhost:3000/api/auth/callback` |
| `JWT_SECRET` | Secret for JWT signing | ⚠️ Change in production! |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `DEFAULT_ELO` | Starting ELO for new players | `1000` |
| `ELO_K_FACTOR` | Rating volatility factor | `32` |

## 🔒 Security

- **OAuth 2.0** authentication via 42 Intra
- **Campus validation** ensures only Heilbronn students can access
- **JWT tokens** for stateless session management
- **Input validation** on all endpoints
- **SQL injection prevention** via prepared statements
- **CORS** properly configured

## 🛠️ Development

### Running Locally (without Docker)

**Backend:**
```bash
cd backend
go mod download
go run cmd/api/main.go
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Running with Docker

```bash
docker-compose up --build
```

## 🚢 Production Deployment

1. **Update environment variables:**
   - Generate a secure `JWT_SECRET`
   - Update `FT_REDIRECT_URI` to your production URL

2. **Deploy:**
   ```bash
   docker-compose up -d --build
   ```

3. **Configure reverse proxy** (Nginx/Caddy) for HTTPS

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| OAuth callback fails | Verify `FT_REDIRECT_URI` matches 42 app settings |
| Database connection error | Check PostgreSQL container health and `DATABASE_URL` |
| CORS errors | Update CORS settings in `backend/cmd/api/main.go` |

## 📄 License

This project is built for 42 Heilbronn students.

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

---

<div align="center">

</div>
