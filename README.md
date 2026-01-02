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
| 🔍 **Player Search** | Search players by display name or intra login |
| 📈 **Statistics** | Win streaks, highest ELO, win rates, and more |
| 📜 **Match History** | Filter by sport, opponent, date range, and outcome |
| 💬 **Social** | React with emojis and comment on matches |
| 📊 **Statistics Dashboard** | Charts for ELO history, win rates, and trends |
| 🎯 **ELO Prediction** | See predicted rating change before match submission |
| 👨‍💼 **Admin Panel** | Manage users, revert matches, ban players |
| 📱 **Responsive** | Mobile-friendly design for all devices |
| ⚡ **Performance** | Gzip compression, caching, code splitting, lazy loading |
| 🛡️ **Error Handling** | Graceful error boundaries and user-friendly messages |
| 🇪🇺 **GDPR Compliant** | Full EU data protection compliance |

## 🔒 GDPR / DSGVO Compliance

This application is fully compliant with the EU General Data Protection Regulation (GDPR / DSGVO) for deployment in Germany and the EU.

### Legal Pages
- **Impressum** (`/impressum`) - Legal notice as required by German law (§ 5 TMG)
- **Datenschutzerklärung** (`/privacy`) - Privacy policy with data processing details
- **Nutzungsbedingungen** (`/terms`) - Terms of service and acceptable use

### User Rights Implementation

| Right | Implementation |
|-------|----------------|
| **Right to Access (Art. 15)** | `/api/users/me/data-export` - Download all personal data as JSON |
| **Right to Erasure (Art. 17)** | `/api/users/me/delete` - Delete account and anonymize matches |
| **Right to Information (Art. 13/14)** | Clear privacy policy describing all data processing |
| **Cookie Consent** | Banner with accept/reject before any non-essential cookies |

### Data Collected
| Field | Purpose | Retention |
|-------|---------|-----------|
| `intra_id` | User identification | Until deletion |
| `login` | 42 username display | Until deletion |
| `display_name` | Profile display | Until deletion |
| `avatar_url` | Profile picture | Until deletion |
| `campus` | Campus verification | Until deletion |

### Security Measures
- ✅ HTTPS enforcement in production (HSTS headers)
- ✅ Secure cookie settings (`HttpOnly`, `Secure`, `SameSite`)
- ✅ JWT with 24-hour expiration
- ✅ Security headers (CSP, XSS protection, etc.)
- ✅ Input sanitization and validation
- ✅ Rate limiting on sensitive endpoints

### Production Deployment Checklist
1. Set `COOKIE_SECURE=true` for HTTPS-only cookies
2. Configure valid SSL certificate (e.g., Let's Encrypt)
3. Update legal pages with actual operator information
4. Update privacy email addresses

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
- In-memory caching with TTL
- Gzip response compression
- Rate limiting middleware
- Input sanitization utilities

</td>
<td align="center" width="50%">

### Frontend

![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=flat-square&logo=reactrouter&logoColor=white)

- **React 18** + **TypeScript**
- **Vite** for fast development
- React.lazy code splitting
- Axios for API calls
- Custom hooks & utilities
- Lazy image loading
- Error boundaries for resilience
- Glassmorphism 2.0 CSS design

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
│   ├── cmd/api/              # Application entrypoint
│   ├── internal/
│   │   ├── cache/            # In-memory caching with TTL
│   │   ├── config/           # Configuration management
│   │   ├── handlers/         # HTTP handlers (auth, match, admin)
│   │   ├── middleware/       # Auth, rate limiting, ban middleware
│   │   ├── models/           # Data models
│   │   ├── repositories/     # Database layer
│   │   ├── services/         # Business logic (ELO, caching)
│   │   └── utils/            # JWT, response, sanitization
│   └── migrations/           # SQL migrations
├── frontend/
│   ├── src/
│   │   ├── api/              # API client (Axios)
│   │   ├── components/       # Reusable components
│   │   ├── constants/        # Shared validation constants
│   │   ├── hooks/            # Custom React hooks
│   │   ├── layout/           # App shell and page layouts
│   │   ├── pages/            # Page components
│   │   ├── state/            # State management
│   │   ├── styles/           # Global styles and CSS tokens
│   │   ├── types/            # TypeScript definitions
│   │   ├── ui/               # UI primitives
│   │   └── utils/            # Utility functions
│   └── nginx.conf            # Production server config
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
| `users` | Player profiles with dual ELO ratings, admin flags, ban status |
| `matches` | Match records with scores, status, ELO deltas, and notes |
| `reactions` | Emoji reactions on matches |
| `comments` | Text comments on matches with pagination |

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
| `POST` | `/api/matches/:id/cancel` | Cancel a match |
| `GET` | `/api/matches` | List matches (with filters) |
| `POST` | `/api/matches/:id/reactions` | Add emoji reaction |
| `GET` | `/api/matches/:id/comments` | Get comments (paginated) |
| `POST` | `/api/matches/:id/comments` | Add comment |
| `GET` | `/api/users/:id` | Get player profile |
| `GET` | `/api/users/:id/stats` | Get player statistics |

### Admin Endpoints (Admin Only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/users` | List all users |
| `PUT` | `/api/admin/users/:id` | Update user (ban, admin) |
| `GET` | `/api/admin/matches` | List confirmed matches |
| `POST` | `/api/admin/matches/:id/revert` | Revert a match (restore ELO) |

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
- **CSRF protection** for OAuth state validation
- **Campus validation** ensures only Heilbronn students can access
- **JWT tokens** with httpOnly cookie option for secure storage
- **Rate limiting** to prevent API abuse (10-100 req/min by endpoint)
- **Input sanitization** on all user-provided data
- **SQL injection prevention** via prepared statements
- **Emoji validation** against whitelist
- **Ban enforcement** middleware blocks banned users
- **Error boundaries** prevent cascading UI failures
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
| JWT errors | Ensure `JWT_SECRET` is at least 32 characters |
| White screen / React error | Check browser console; ErrorBoundary will display recovery options |

## 📄 License

This project is built for 42 Heilbronn students.

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

---

<div align="center">

</div>
