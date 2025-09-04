# 42 Intra OAuth Authentication Setup

This document explains how to set up 42 Intra OAuth authentication for the ELO Leaderboard application.

## Prerequisites

1. A 42 Intra account (available to 42 School students)
2. Access to create OAuth applications on the 42 Intra platform

## Step 1: Create OAuth Application on 42 Intra

1. Go to [42 Intra Profile Settings](https://profile.intra.42.fr/)
2. Navigate to the "OAuth" section
3. Click "New App" to create a new OAuth application
4. Fill in the application details:
   - **Name**: `42 ELO Leaderboard` (or your preferred name)
   - **Website**: Your domain (e.g., `https://your-domain.com`)
   - **Redirect URI**: 
     - For production: `https://your-domain.com/api/auth/callback`
     - For local development: `http://localhost:8081/api/auth/callback`
   - **Scopes**: Select `public` scope
5. Save the application
6. Note down the **Client ID** and **Client Secret**

## Step 2: Configure Environment Variables

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and update the following variables:
   ```env
   # 42 OAuth Configuration
   INTRA_CLIENT_ID=your_actual_client_id_here
   INTRA_CLIENT_SECRET=your_actual_client_secret_here
   INTRA_REDIRECT_URI=http://localhost:8081/api/auth/callback
   
   # JWT Configuration
   JWT_SECRET=your_secure_jwt_secret_here
   
   # Frontend URL (for redirects after authentication)
   FRONTEND_URL=http://localhost:8080
   ```

   **Important Security Notes:**
   - Generate a strong JWT secret: `openssl rand -hex 32`
   - Never commit the `.env` file to version control
   - Use different secrets for production

## Step 3: Backend Dependencies

The backend already includes the necessary OAuth dependencies in `go.mod`:
- `golang.org/x/oauth2` - OAuth2 client library
- `github.com/golang-jwt/jwt/v5` - JWT token handling

To install dependencies, run:
```bash
cd Backend
go mod tidy
```

## Step 4: Campus Restriction

The application is configured to only allow users from **42 Heilbronn** campus. To modify this:

1. Edit `Backend/api/auth.go`
2. Find the campus validation section:
   ```go
   // Check if user is from 42 Heilbronn campus
   isValidCampus := false
   campusName := ""
   for _, campus := range user.Campus {
       if campus.Name == "Heilbronn" || campus.ID == 37 { // 42 Heilbronn campus ID
           isValidCampus = true
           campusName = campus.Name
           break
       }
   }
   ```
3. Update the campus name or ID to match your desired campus

## Step 5: Running the Application

1. **Start the Backend**:
   ```bash
   cd Backend
   go run main.go
   ```
   The backend will run on `http://localhost:8081`

2. **Start the Frontend**:
   ```bash
   # In the project root
   npm run dev
   ```
   The frontend will run on `http://localhost:8080`

## Authentication Flow

1. User visits the application
2. If not authenticated, they are redirected to `/login`
3. User clicks "Login with Intra" button
4. User is redirected to 42 Intra OAuth authorization page
5. User authorizes the application
6. 42 Intra redirects back to `/api/auth/callback` with authorization code
7. Backend exchanges the code for an access token
8. Backend fetches user profile from 42 Intra API
9. Backend validates the user's campus
10. Backend creates/updates user profile and generates JWT
11. User is redirected to the main application with authentication cookie

## Security Features

- **Campus Restriction**: Only allows users from specified 42 campus
- **JWT Tokens**: Secure session management with HTTP-only cookies
- **OAuth State Parameter**: Prevents CSRF attacks
- **Secure Cookies**: HTTP-only cookies prevent XSS attacks
- **Token Expiration**: JWT tokens expire after 7 days

## Troubleshooting

### Common Issues

1. **"Invalid state parameter" error**:
   - Clear your browser cookies
   - Ensure the redirect URI matches exactly in your OAuth app settings

2. **"Access restricted to 42 Heilbronn students only" error**:
   - Verify your campus in your 42 Intra profile
   - Check the campus validation logic in the backend

3. **"Failed to exchange code for token" error**:
   - Verify your Client ID and Client Secret are correct
   - Check that your redirect URI matches the OAuth app settings

4. **CORS errors**:
   - Ensure the frontend URL is included in the CORS configuration in `main.go`

### Debug Mode

To enable debug logging in the backend, add logging statements to the auth handlers.

### Testing Locally

1. Ensure your OAuth app redirect URI is set to `http://localhost:8081/api/auth/callback`
2. Both frontend and backend must be running
3. The Vite proxy configuration should forward `/api` requests to the Go backend

## Production Deployment

For production deployment:

1. Update the OAuth app redirect URI to your production domain
2. Set `INTRA_REDIRECT_URI` to `https://your-domain.com/api/auth/callback`
3. Use HTTPS for all URLs
4. Generate new, secure JWT secrets
5. Configure proper CORS origins in the backend
6. Set up proper SSL/TLS certificates

## Support

For issues with 42 Intra OAuth integration, refer to:
- [42 API Documentation](https://api.intra.42.fr/apidoc)
- [42 OAuth Guide](https://api.intra.42.fr/apidoc/guides/web_application_flow)