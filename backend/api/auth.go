package api

import (
	"fmt"
	"growfolio/domain"
	"growfolio/domain/services"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
)

type AuthHandler struct {
	userRepository services.UserRepository
	jwtSecret      string
}

func NewAuthHandler(userRepository services.UserRepository, jwtSecret string) *AuthHandler {
	return &AuthHandler{userRepository: userRepository, jwtSecret: jwtSecret}
}

func (h *AuthHandler) Begin(c *gin.Context) (*response[empty], error) {
	gothic.GetProviderName = getProviderName(c)
	if user, err := gothic.CompleteUserAuth(c.Writer, c.Request); err == nil {
		fmt.Printf("Hi, %#v\n", user)
	} else {
		gothic.BeginAuthHandler(c.Writer, c.Request)
	}

	return newEmptyResponse(http.StatusOK), nil
}

func (h *AuthHandler) Callback(c *gin.Context) (*response[empty], error) {
	gothic.GetProviderName = getProviderName(c)
	gothUser, err := gothic.CompleteUserAuth(c.Writer, c.Request)
	if err != nil {
		return nil, err
	}

	user, err := h.findOrCreateUser(gothUser)
	if err != nil {
		return nil, fmt.Errorf("failed to find or create user: %w", err)
	}

	jwt, err := h.generateJWT(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate JWT: %w", err)
	}

	c.SetCookie("jwt", jwt, 3600, "/", "localhost", false, true)
	return newEmptyResponse(http.StatusOK), nil
}

func (h *AuthHandler) findOrCreateUser(gothUser goth.User) (*domain.User, error) {
	user, err := h.userRepository.FindByID(gothUser.UserID)
	if err != nil {
		if err == domain.ErrUserNotFound {
			created, err := h.userRepository.Create(toCreateUserCommand(gothUser))
			if err != nil {
				return nil, fmt.Errorf("failed to create user: %w", err)
			}
			return created, nil
		}
		return nil, fmt.Errorf("failed to find user by id %s: %w", gothUser.UserID, err)
	}

	return user, nil
}

func (h *AuthHandler) generateJWT(userID string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"exp":    time.Now().Add(1 * time.Hour).Unix(),
		"userId": userID,
	})

	return token.SignedString([]byte(h.jwtSecret))
}

func (h *AuthHandler) validateJWT(tokenString string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return h.jwtSecret, nil
	})
	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return claims, nil
	} else {
		return nil, fmt.Errorf("invalid token")
	}
}

func toCreateUserCommand(gothUser goth.User) domain.CreateUserCommand {
	return domain.NewCreateUserCommand(gothUser.UserID, gothUser.Email, gothUser.Provider)
}

func getProviderName(c *gin.Context) func(*http.Request) (string, error) {
	return func(*http.Request) (string, error) { return c.Param("provider"), nil }
}
