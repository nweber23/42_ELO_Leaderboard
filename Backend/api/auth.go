package api

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/oauth2"
)

type IntraUser struct {
	ID         int    `json:"id"`
	Login      string `json:"login"`
	Email      string `json:"email"`
	FirstName  string `json:"first_name"`
	LastName   string `json:"last_name"`
	ImageURL   string `json:"image"`
	Campus     []struct {
		ID   int    `json:"id"`
		Name string `json:"name"`
	} `json:"campus"`
}

type AuthClaims struct {
	UserID    int    `json:"user_id"`
	Login     string `json:"login"`
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	ImageURL  string `json:"image_url"`
	Campus    string `json:"campus"`
	jwt.RegisteredClaims
}

var oauth2Config *oauth2.Config

func init() {
	oauth2Config = &oauth2.Config{
		ClientID:     os.Getenv("INTRA_CLIENT_ID"),
		ClientSecret: os.Getenv("INTRA_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("INTRA_REDIRECT_URI"),
		Scopes:       []string{"public"},
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://api.intra.42.fr/oauth/authorize",
			TokenURL: "https://api.intra.42.fr/oauth/token",
		},
	}
}

func LoginHandler(c *gin.Context) {
	state := generateRandomState()
	c.SetCookie("oauth_state", state, 600, "/", "", false, true)
	
	url := oauth2Config.AuthCodeURL(state, oauth2.AccessTypeOffline)
	c.JSON(http.StatusOK, gin.H{
		"auth_url": url,
	})
}

func CallbackHandler(c *gin.Context) {
	state := c.Query("state")
	storedState, err := c.Cookie("oauth_state")
	if err != nil || state != storedState {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid state parameter"})
		return
	}

	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing authorization code"})
		return
	}

	token, err := oauth2Config.Exchange(context.Background(), code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to exchange code for token"})
		return
	}

	client := oauth2Config.Client(context.Background(), token)
	resp, err := client.Get("https://api.intra.42.fr/v2/me")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user info"})
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read user info"})
		return
	}

	var user IntraUser
	if err := json.Unmarshal(body, &user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse user info"})
		return
	}

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

	if !isValidCampus {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Access restricted to 42 Heilbronn students only",
		})
		return
	}

	// Create or update player in database
	_ = CreateOrUpdatePlayerFromIntra(user, campusName)

	// Generate JWT token
	jwtToken, err := generateJWTToken(user, campusName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Set JWT as HTTP-only cookie
	c.SetCookie("auth_token", jwtToken, 86400*7, "/", "", false, true) // 7 days

	// Redirect to frontend
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:8080"
	}
	
	c.Redirect(http.StatusTemporaryRedirect, frontendURL+"?auth=success")
}

func LogoutHandler(c *gin.Context) {
	c.SetCookie("auth_token", "", -1, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

func MeHandler(c *gin.Context) {
	claims, exists := c.Get("user_claims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	authClaims, ok := claims.(*AuthClaims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user_id":    authClaims.UserID,
		"login":      authClaims.Login,
		"email":      authClaims.Email,
		"first_name": authClaims.FirstName,
		"last_name":  authClaims.LastName,
		"image_url":  authClaims.ImageURL,
		"campus":     authClaims.Campus,
	})
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		token, err := c.Cookie("auth_token")
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing authentication token"})
			c.Abort()
			return
		}

		claims := &AuthClaims{}
		jwtToken, err := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		if err != nil || !jwtToken.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authentication token"})
			c.Abort()
			return
		}

		c.Set("user_claims", claims)
		c.Next()
	}
}

func generateJWTToken(user IntraUser, campus string) (string, error) {
	claims := &AuthClaims{
		UserID:    user.ID,
		Login:     user.Login,
		Email:     user.Email,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		ImageURL:  user.ImageURL,
		Campus:    campus,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)), // 7 days
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "42-elo-leaderboard",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}

func generateRandomState() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}

func CreateOrUpdatePlayerFromIntra(user IntraUser, campus string) *Player {
	// This is a simplified version - in a real app, you'd store this in a database
	player := &Player{
		ID:          user.ID,
		Login:       user.Login,
		FirstName:   user.FirstName,
		LastName:    user.LastName,
		Email:       user.Email,
		ImageURL:    user.ImageURL,
		Campus:      campus,
		TableTennisELO: 1000,
		FoosballELO:    1000,
		GamesPlayed:    0,
		GamesWon:      0,
		GamesLost:     0,
		WinRate:       0.0,
		LastActive:    time.Now(),
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
	
	// In a real implementation, you would save this to your database here
	// For now, we'll just return the player object
	return player
}