package handler

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// loginResponse returns the signed JWT to the client upon successful login.
type loginResponse struct {
	Token string `json:"token"`
	Email string `json:"email"`
}

// contextKey is a custom type for context keys to avoid collisions with
// other packages using the same context.
type contextKey string

// adminContextKey is used to store and retrieve the admin_id from the request context.
const adminContextKey contextKey = "admin_id"

// Login authenticates the admin user.
// It uses bcrypt for secure password comparison and issues a JWT valid for 24 hours.
//
// Security notes:
//   - The same error message ("invalid credentials") is returned whether the
//     email doesn't exist OR the password is wrong. This prevents attackers
//     from enumerating valid admin emails via the login endpoint.
//   - bcrypt.CompareHashAndPassword performs constant-time comparison,
//     mitigating timing attacks.
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if !decodeJSON(w, r, &req) {
		return
	}

	if req.Email == "" || req.Password == "" {
		respondBadRequest(w, "email and password are required")
		return
	}

	admin, err := h.queries.GetAdminByEmail(r.Context(), req.Email)
	if err != nil {
		// Generic error to prevent email enumeration attacks.
		respondError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	// bcrypt comparison — constant-time, safe against timing attacks.
	err = bcrypt.CompareHashAndPassword([]byte(admin.PasswordHash), []byte(req.Password))
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	token, err := h.generateJWT(admin.ID)
	if err != nil {
		respondInternalError(w)
		return
	}

	respondData(w, http.StatusOK, loginResponse{
		Token: token,
		Email: admin.Email,
	})
}

// generateJWT creates a new HS256 signed token.
// It includes 'admin_id' as a claim for use in protected routes.
//
// Token expiration is 24 hours. This is a pragmatic trade-off:
// shorter tokens (e.g. 1h) are more secure but force the admin to
// re-login frequently; longer tokens increase the window of risk
// if a token is leaked. 24h aligns with a typical work day.
func (h *Handler) generateJWT(adminID int32) (string, error) {
	if h.config.JWTSecret == "" {
		return "", errors.New("JWT_SECRET is not configured")
	}

	claims := jwt.MapClaims{
		"admin_id": adminID,
		"exp":      time.Now().Add(24 * time.Hour).Unix(),
		"iat":      time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(h.config.JWTSecret))
}

// AdminOnly is a middleware that validates the Bearer token in the Authorization header.
// If valid, it extracts the admin_id and injects it into the request context.
//
// Security: the middleware explicitly checks that the signing method is HMAC
// (SigningMethodHMAC). This is a defence against algorithm confusion attacks
// where an attacker crafts a token with "alg": "none" or switches to a
// public-key algorithm using the HMAC secret as the public key.
func (h *Handler) AdminOnly(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			respondError(w, http.StatusUnauthorized, "authorization header required")
			return
		}

		// Expecting format: "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			respondError(w, http.StatusUnauthorized, "invalid authorization format")
			return
		}

		tokenString := parts[1]
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Algorithm check: reject anything that is not HMAC.
			// Without this check, an attacker could set "alg": "none" and
			// bypass signature verification entirely.
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("unexpected signing method")
			}
			return []byte(h.config.JWTSecret), nil
		})

		if err != nil || !token.Valid {
			respondError(w, http.StatusUnauthorized, "invalid or expired token")
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			respondError(w, http.StatusUnauthorized, "invalid token claims")
			return
		}

		// JWT numeric values are parsed as float64 by default in the golang-jwt library.
		// This is a known quirk — MapClaims stores numbers as float64.
		adminIDFloat, ok := claims["admin_id"].(float64)
		if !ok {
			respondError(w, http.StatusUnauthorized, "missing admin_id in token")
			return
		}

		// Inject admin_id into context for downstream handlers if needed.
		ctx := context.WithValue(r.Context(), adminContextKey, int32(adminIDFloat))
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
