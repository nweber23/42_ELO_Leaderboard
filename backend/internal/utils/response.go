package utils

import (
	"log/slog"

	"github.com/gin-gonic/gin"
)

type ErrorResponse struct {
	Error string `json:"error"`
}

// RespondWithError sends a JSON error response and logs the error if provided
func RespondWithError(c *gin.Context, code int, message string, err error) {
	if err != nil {
		slog.Error("Request failed",
			"method", c.Request.Method,
			"path", c.Request.URL.Path,
			"status", code,
			"error", err.Error(),
		)
	}
	c.JSON(code, ErrorResponse{Error: message})
}

// RespondWithJSON sends a JSON response
func RespondWithJSON(c *gin.Context, code int, payload interface{}) {
	c.JSON(code, payload)
}
