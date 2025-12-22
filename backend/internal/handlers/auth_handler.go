package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"

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
	authURL := fmt.Sprintf(
		"https://api.intra.42.fr/oauth/authorize?client_id=%s&redirect_uri=%s&response_type=code&scope=public",
		url.QueryEscape(h.cfg.FTClientUID),
		url.QueryEscape(h.cfg.FTRedirectURI),
	)

	c.JSON(http.StatusOK, gin.H{
		"auth_url": authURL,
	})
}

// Callback handles OAuth callback
func (h *AuthHandler) Callback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		c.Redirect(http.StatusTemporaryRedirect, "http://localhost:3000/?error=no_code")
		return
	}

	// Exchange code for token
	token, err := h.exchangeCodeForToken(code)
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, "http://localhost:3000/?error=token_exchange_failed")
		return
	}

	// Get user info from 42 API
	userInfo, err := h.get42UserInfo(token)
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, "http://localhost:3000/?error=user_info_failed")
		return
	}

	// Validate campus - check if user has Heilbronn campus
	var campusName string
	fmt.Printf("User %s has %d campus entries\n", userInfo.Login, len(userInfo.Campus))
	for _, campus := range userInfo.Campus {
		fmt.Printf("Campus: %s (ID: %d)\n", campus.Name, campus.ID)
		if campus.Name == "Heilbronn" {
			campusName = "Heilbronn"
			break
		}
	}
	if campusName == "" {
		fmt.Printf("No Heilbronn campus found for user %s, redirecting with error\n", userInfo.Login)
		c.Redirect(http.StatusTemporaryRedirect, "http://localhost:3000/?error=invalid_campus")
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
		c.Redirect(http.StatusTemporaryRedirect, "http://localhost:3000/?error=user_creation_failed")
		return
	}

	// Generate JWT
	jwt, err := utils.GenerateJWT(user.ID, h.cfg.JWTSecret)
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, "http://localhost:3000/?error=token_generation_failed")
		return
	}

	// Redirect to frontend with token
	c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("http://localhost:3000/?token=%s", jwt))
}

// Me returns current user info
func (h *AuthHandler) Me(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := h.userRepo.GetByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// GetUsers returns all users
func (h *AuthHandler) GetUsers(c *gin.Context) {
	users, err := h.userRepo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, users)
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
