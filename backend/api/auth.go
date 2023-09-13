package api

import (
	"fmt"
	"growfolio/domain"
	"growfolio/domain/services"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
)

type AuthHandler struct {
	userRepository services.UserRepository
	tokenService   TokenService
}

func NewAuthHandler(userRepository services.UserRepository, tokenService TokenService) AuthHandler {
	return AuthHandler{userRepository: userRepository, tokenService: tokenService}
}

func (h *AuthHandler) Begin(c *gin.Context) (response[empty], error) {
	gothic.GetProviderName = getProviderName(c)
	if user, err := gothic.CompleteUserAuth(c.Writer, c.Request); err == nil {
		fmt.Printf("Hi, %#v\n", user)
	} else {
		gothic.BeginAuthHandler(c.Writer, c.Request)
	}

	return newEmptyResponse(http.StatusOK), nil
}

func (h *AuthHandler) Callback(c *gin.Context) (response[empty], error) {
	gothic.GetProviderName = getProviderName(c)
	gothUser, err := gothic.CompleteUserAuth(c.Writer, c.Request)
	if err != nil {
		return response[empty]{}, err
	}

	user, err := h.findOrCreateUser(gothUser)
	if err != nil {
		return response[empty]{}, fmt.Errorf("failed to find or create user: %w", err)
	}

	jwt, err := h.tokenService.generateToken(user.ID)
	if err != nil {
		return response[empty]{}, fmt.Errorf("failed to generate JWT: %w", err)
	}

	// TODO: get exp from token?
	c.SetCookie("token", jwt, 60 * 60 * 2, "/", "localhost", false, true)
	return newEmptyResponse(http.StatusOK), nil
}

func (h *AuthHandler) LogOut(c *gin.Context) (response[empty], error) {
	c.SetCookie("token", "", -1, "/", "localhost", false, true)
	return newEmptyResponse(http.StatusOK), nil
}

func (h *AuthHandler) findOrCreateUser(gothUser goth.User) (domain.User, error) {
	user, err := h.userRepository.FindByID(gothUser.UserID)
	if err != nil {
		if err == domain.ErrUserNotFound {
			created, err := h.userRepository.Create(toCreateUserCommand(gothUser))
			if err != nil {
				return domain.User{}, fmt.Errorf("failed to create user: %w", err)
			}
			return created, nil
		}
		return domain.User{}, fmt.Errorf("failed to find user by id %s: %w", gothUser.UserID, err)
	}

	return user, nil
}

func toCreateUserCommand(gothUser goth.User) domain.CreateUserCommand {
	return domain.NewCreateUserCommand(gothUser.UserID, gothUser.Email, gothUser.Provider)
}

func getProviderName(c *gin.Context) func(*http.Request) (string, error) {
	return func(*http.Request) (string, error) { return c.Param("provider"), nil }
}
