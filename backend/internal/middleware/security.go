package middleware

import (
	"github.com/gin-gonic/gin"
)

// SecurityHeaders adds security-related HTTP headers for GDPR/security compliance
// This includes HSTS, XSS protection, content type sniffing prevention, etc.
func SecurityHeaders(cookieSecure bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		// HSTS - Strict Transport Security (only in production with HTTPS)
		// This tells browsers to only use HTTPS for this domain
		if cookieSecure {
			// max-age=31536000 = 1 year, includeSubDomains for all subdomains
			c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}

		// Prevent XSS attacks
		c.Header("X-XSS-Protection", "1; mode=block")

		// Prevent MIME type sniffing
		c.Header("X-Content-Type-Options", "nosniff")

		// Clickjacking protection
		c.Header("X-Frame-Options", "DENY")

		// Referrer Policy - only send origin for cross-origin requests
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")

		// Content Security Policy
		// Adjust this based on your actual resource needs
		// Note: connect-src allows any http/https for development flexibility
		c.Header("Content-Security-Policy",
			"default-src 'self'; "+
			"script-src 'self' 'unsafe-inline'; "+
			"style-src 'self' 'unsafe-inline'; "+
			"img-src 'self' https://cdn.intra.42.fr data:; "+
			"font-src 'self'; "+
			"connect-src 'self' http://localhost:* https://api.intra.42.fr; "+
			"frame-ancestors 'none'; "+
			"base-uri 'self'; "+
			"form-action 'self'")

		// Permissions Policy (formerly Feature Policy)
		// Disable access to sensitive browser features
		c.Header("Permissions-Policy",
			"accelerometer=(), "+
			"camera=(), "+
			"geolocation=(), "+
			"gyroscope=(), "+
			"magnetometer=(), "+
			"microphone=(), "+
			"payment=(), "+
			"usb=()")

		c.Next()
	}
}

// HTTPSRedirect redirects HTTP requests to HTTPS in production
func HTTPSRedirect(enabled bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !enabled {
			c.Next()
			return
		}

		// Check if the request is already HTTPS
		// X-Forwarded-Proto is set by reverse proxies like nginx
		if c.GetHeader("X-Forwarded-Proto") == "https" || c.Request.TLS != nil {
			c.Next()
			return
		}

		// Redirect to HTTPS
		target := "https://" + c.Request.Host + c.Request.URL.Path
		if c.Request.URL.RawQuery != "" {
			target += "?" + c.Request.URL.RawQuery
		}

		c.Redirect(301, target)
		c.Abort()
	}
}
