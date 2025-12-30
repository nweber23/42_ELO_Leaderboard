package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"time"

	"github.com/42heilbronn/elo-leaderboard/internal/config"
	"github.com/42heilbronn/elo-leaderboard/internal/middleware"
	"github.com/42heilbronn/elo-leaderboard/internal/models"
	"github.com/42heilbronn/elo-leaderboard/internal/repositories"
	"github.com/42heilbronn/elo-leaderboard/internal/utils"
	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	cfg      *config.Config
	userRepo *repositories.UserRepository
}

func NewAuthHandler(cfg *config.Config, userRepo *repositories.UserRepository) *AuthHandler {
	return &AuthHandler{
		cfg:      cfg,
		userRepo: userRepo,
	}
}

// Login redirects to 42 OAuth
func (h *AuthHandler) Login(c *gin.Context) {
	// Generate a cryptographically secure CSRF state token
	state, err := utils.GenerateCSRFToken()
	if err != nil {
		slog.Error("Failed to generate CSRF token", "error", err)
		utils.RespondWithError(c, http.StatusInternalServerError, "failed to generate security token", err)
		return
	}

	// Store state in httpOnly cookie for CSRF validation on callback
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "oauth_state",
		Value:    state,
		Path:     "/",
		MaxAge:   600, // 10 minutes
		HttpOnly: true,
		Secure:   h.cfg.CookieSecure,
		SameSite: http.SameSiteStrictMode,
	})

	authURL := fmt.Sprintf(
		"https://api.intra.42.fr/oauth/authorize?client_id=%s&redirect_uri=%s&response_type=code&scope=public&state=%s",
		url.QueryEscape(h.cfg.FTClientUID),
		url.QueryEscape(h.cfg.FTRedirectURI),
		url.QueryEscape(state),
	)

	utils.RespondWithJSON(c, http.StatusOK, gin.H{
		"auth_url": authURL,
	})
}

// Callback handles OAuth callback
func (h *AuthHandler) Callback(c *gin.Context) {
	code := c.Query("code")
	state := c.Query("state")
	if code == "" {
		c.Redirect(http.StatusTemporaryRedirect, h.cfg.FrontendURL+"/?error=no_code")
		return
	}

	// Validate CSRF state token using constant-time comparison to prevent timing attacks
	expectedState, err := c.Cookie("oauth_state")
	if err == nil && expectedState != "" {
		if csrfErr := utils.ValidateCSRFToken(expectedState, state); csrfErr != nil {
			slog.Warn("CSRF state mismatch", "error", csrfErr)
			c.Redirect(http.StatusTemporaryRedirect, h.cfg.FrontendURL+"/?error=invalid_state")
			return
		}
		// Clear the state cookie after validation
		http.SetCookie(c.Writer, &http.Cookie{
			Name:     "oauth_state",
			Value:    "",
			Path:     "/",
			MaxAge:   -1,
			HttpOnly: true,
			Secure:   h.cfg.CookieSecure,
			SameSite: http.SameSiteStrictMode,
		})
	}

	// Exchange code for token
	token, err := h.exchangeCodeForToken(code)
	if err != nil {
		slog.Error("Token exchange failed", "error", err)
		c.Redirect(http.StatusTemporaryRedirect, h.cfg.FrontendURL+"/?error=token_exchange_failed")
		return
	}

	// Get user info from 42 API
	userInfo, err := h.get42UserInfo(token)
	if err != nil {
		slog.Error("Failed to get user info", "error", err)
		c.Redirect(http.StatusTemporaryRedirect, h.cfg.FrontendURL+"/?error=user_info_failed")
		return
	}

	// Validate campus - check if user has Heilbronn campus
	var campusName string
	slog.Info("Checking user campus", "user", userInfo.Login, "campus_count", len(userInfo.Campus))
	for _, campus := range userInfo.Campus {
		if campus.Name == "Heilbronn" {
			campusName = "Heilbronn"
			break
		}
	}
	if campusName == "" {
		slog.Warn("No Heilbronn campus found", "user", userInfo.Login)
		c.Redirect(http.StatusTemporaryRedirect, h.cfg.FrontendURL+"/?error=invalid_campus")
		return
	}

	// Create or update user
	user := &models.User{
		IntraID:     userInfo.ID,
		Login:       userInfo.Login,
		DisplayName: userInfo.DisplayName,
		AvatarURL:   userInfo.Image.Link,
		Campus:      campusName,
	}

	if err := h.userRepo.CreateOrUpdate(user); err != nil {
		slog.Error("Failed to create/update user", "error", err)
		c.Redirect(http.StatusTemporaryRedirect, h.cfg.FrontendURL+"/?error=user_creation_failed")
		return
	}

	// Generate JWT
	jwt, err := utils.GenerateJWT(user.ID, h.cfg.JWTSecret)
	if err != nil {
		slog.Error("Failed to generate JWT", "error", err)
		c.Redirect(http.StatusTemporaryRedirect, h.cfg.FrontendURL+"/?error=token_generation_failed")
		return
	}

	// If using httpOnly cookies, set the cookie and redirect without token in URL
	if h.cfg.UseHTTPOnlyCookie {
		// Set httpOnly cookie - more secure than localStorage as it's not accessible via JavaScript
		// This protects against XSS attacks stealing the token
		http.SetCookie(c.Writer, &http.Cookie{
			Name:     "auth_token",
			Value:    jwt,
			Path:     "/",
			Domain:   h.cfg.CookieDomain,
			MaxAge:   int(7 * 24 * time.Hour / time.Second), // 7 days
			HttpOnly: true,                                   // Not accessible via JavaScript
			Secure:   h.cfg.CookieSecure,                    // Only send over HTTPS in production
			SameSite: http.SameSiteStrictMode,               // Prevent CSRF
		})
		redirectURL := h.cfg.FrontendURL + "/?auth=success"
		if state != "" {
			redirectURL += "&state=" + url.QueryEscape(state)
		}
		c.Redirect(http.StatusTemporaryRedirect, redirectURL)
		return
	}

	// Redirect to frontend with token (legacy mode - less secure)
	redirectURL := fmt.Sprintf("%s/?token=%s", h.cfg.FrontendURL, jwt)
	if state != "" {
		redirectURL += "&state=" + url.QueryEscape(state)
	}
	c.Redirect(http.StatusTemporaryRedirect, redirectURL)
}

// Logout clears the auth cookie (for httpOnly cookie mode)
func (h *AuthHandler) Logout(c *gin.Context) {
	// Clear the auth cookie by setting it with a past expiration
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "auth_token",
		Value:    "",
		Path:     "/",
		Domain:   h.cfg.CookieDomain,
		MaxAge:   -1, // Delete the cookie
		HttpOnly: true,
		Secure:   h.cfg.CookieSecure,
		SameSite: http.SameSiteStrictMode,
	})

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "logged out"})
}

// Me returns current user info
func (h *AuthHandler) Me(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		utils.RespondWithError(c, http.StatusUnauthorized, "unauthorized", nil)
		return
	}

	user, err := h.userRepo.GetByID(userID)
	if err != nil {
		utils.RespondWithError(c, http.StatusNotFound, "user not found", err)
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, user)
}

// GetUsers returns all users
func (h *AuthHandler) GetUsers(c *gin.Context) {
	users, err := h.userRepo.GetAll()
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, err.Error(), err)
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, users)
}

// exchangeCodeForToken exchanges authorization code for access token
func (h *AuthHandler) exchangeCodeForToken(code string) (string, error) {
	data := url.Values{}
	data.Set("grant_type", "authorization_code")
	data.Set("client_id", h.cfg.FTClientUID)
	data.Set("client_secret", h.cfg.FTClientSecret)
	data.Set("code", code)
	data.Set("redirect_uri", h.cfg.FTRedirectURI)

	resp, err := http.PostForm("https://api.intra.42.fr/oauth/token", data)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to get token: status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return "", err
	}

	token, ok := result["access_token"].(string)
	if !ok {
		return "", fmt.Errorf("access token not found in response")
	}

	return token, nil
}

// get42UserInfo fetches user info from 42 API
func (h *AuthHandler) get42UserInfo(token string) (*FTUserInfo, error) {
	req, err := http.NewRequest("GET", "https://api.intra.42.fr/v2/me", nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to get user info: status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var userInfo FTUserInfo
	if err := json.Unmarshal(body, &userInfo); err != nil {
		return nil, err
	}

	return &userInfo, nil
}

// FTUserInfo represents 42 API user response
type FTUserInfo struct {
	ID          int    `json:"id"`
	Login       string `json:"login"`
	DisplayName string `json:"displayname"`
	Image       struct {
		Link string `json:"link"`
	} `json:"image"`
	Campus []struct {
		ID   int    `json:"id"`
		Name string `json:"name"`
	} `json:"campus"`
}
