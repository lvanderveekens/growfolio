package api

import (
	"fmt"
	"growfolio/internal/domain"
	"growfolio/internal/domain/services"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
)

type AuthHandler struct {
	userService  services.UserService
	tokenService TokenService
}

func NewAuthHandler(
	userService services.UserService,
	tokenService TokenService,
) AuthHandler {
	return AuthHandler{
		userService:  userService,
		tokenService: tokenService,
	}
}

func (h AuthHandler) Begin(c *gin.Context) (response[empty], error) {
	gothic.GetProviderName = getProviderName(c)
	if user, err := gothic.CompleteUserAuth(c.Writer, c.Request); err == nil {
		fmt.Printf("Hi, %#v\n", user)
	} else {
		gothic.BeginAuthHandler(c.Writer, c.Request)
	}

	return newEmptyResponse(http.StatusOK), nil
}

func (h AuthHandler) Callback(c *gin.Context) (response[empty], error) {
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

	h.tokenService.setCookie(c, jwt)
	return newEmptyResponse(http.StatusOK), nil
}

func (h AuthHandler) LogOut(c *gin.Context) (response[empty], error) {
	h.tokenService.unsetCookie(c)
	return newEmptyResponse(http.StatusOK), nil
}

func (h AuthHandler) findOrCreateUser(gothUser goth.User) (domain.User, error) {
	user, err := h.userService.FindByID(gothUser.UserID)
	if err != nil {
		if err == domain.ErrUserNotFound {
			created, err := h.userService.Create(toUser(gothUser))
			if err != nil {
				return domain.User{}, fmt.Errorf("failed to create user: %w", err)
			}
			return created, nil
		}
		return domain.User{}, fmt.Errorf("failed to find user by id %s: %w", gothUser.UserID, err)
	}

	return user, nil
}

func toUser(gothUser goth.User) domain.User {
	return domain.NewUser(
		gothUser.UserID,
		gothUser.Email,
		gothUser.Provider,
		domain.AccountType(domain.AccountTypeBasic),
		nil,
		false,
	)
}

func getProviderName(c *gin.Context) func(*http.Request) (string, error) {
	return func(*http.Request) (string, error) { return c.Param("provider"), nil }
}
