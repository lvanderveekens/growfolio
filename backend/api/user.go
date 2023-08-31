package api

import (
	"fmt"
	"growfolio/domain"
	"growfolio/domain/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	userRepository services.UserRepository
}

func NewUserHandler(userRepository services.UserRepository) UserHandler {
	return UserHandler{userRepository: userRepository}
}

func (h *UserHandler) GetCurrentUser(c *gin.Context) (response[userDto], error) {
	// TODO: get user id from token
	id := c.Param("id")

	user, err := h.userRepository.FindByID(id)
	if err != nil {
		if err == domain.ErrUserNotFound {
			return response[userDto]{}, NewError(http.StatusNotFound, err.Error())
		}
		return response[userDto]{}, fmt.Errorf("failed to find user by id %s: %w", id, err)
	}

	dto := newUserDto(user.ID, user.Email, user.Provider)
	return newResponse(http.StatusOK, dto), nil
}

type userDto struct {
	ID       string `json:"id"`
	Email    string `json:"email"`
	Provider string `json:"provider"`
}

func newUserDto(id, email, provider string) userDto {
	return userDto{
		ID:       id,
		Email:    email,
		Provider: provider,
	}
}
