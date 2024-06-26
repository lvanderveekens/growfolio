package api

import (
	"fmt"
	"growfolio/internal/domain"
	"growfolio/internal/domain/services"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type UserHandler struct {
	userRepository services.UserRepository
}

func NewUserHandler(userRepository services.UserRepository) UserHandler {
	return UserHandler{userRepository: userRepository}
}

func (h *UserHandler) GetUser(c *gin.Context) (response[userDto], error) {
	tokenClaims := c.Value("token").(*jwt.Token).Claims.(jwt.MapClaims)
	tokenUserID := tokenClaims["userId"].(string)

	user, err := h.userRepository.FindByID(tokenUserID)
	if err != nil {
		if err == domain.ErrUserNotFound {
			return response[userDto]{}, NewError(http.StatusNotFound, err.Error())
		}
		return response[userDto]{}, fmt.Errorf("failed to find user by id %s: %w", tokenUserID, err)
	}

	dto := newUserDto(user.ID, user.Email, user.Provider, string(user.AccountType), user.StripeCustomerID, user.IsDemo)
	return newResponse(http.StatusOK, dto), nil
}

type userDto struct {
	ID               string  `json:"id"`
	Email            string  `json:"email"`
	Provider         string  `json:"provider"`
	AccountType      string  `json:"accountType"`
	StripeCustomerID *string `json:"stripeCustomerId"`
	IsDemo           bool    `json:"isDemo"`
}

func newUserDto(id, email, provider, accountType string, stripeCustomerID *string, isDemo bool) userDto {
	return userDto{
		ID:               id,
		Email:            email,
		Provider:         provider,
		AccountType:      accountType,
		StripeCustomerID: stripeCustomerID,
		IsDemo:           isDemo,
	}
}
