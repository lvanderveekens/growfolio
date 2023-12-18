package api

import (
	"growfolio/domain"
	"growfolio/domain/services"
	"net/http"

	"github.com/google/uuid"
	"github.com/pkg/errors"

	"github.com/gin-gonic/gin"
)

type DemoHandler struct {
	userService  services.UserService
	tokenService TokenService
}

func NewDemoHandler(userService services.UserService, tokenService TokenService) DemoHandler {
	return DemoHandler{
		userService:  userService,
		tokenService: tokenService,
	}
}

func (h DemoHandler) CreateDemoSession(c *gin.Context) error {
	id, err := uuid.NewRandom()
	if err != nil {
		return errors.Wrap(err, "failed to generate new UUID")
	}

	demoUser := domain.NewUser(
		id.String(),
		"demo@growfolio.co",
		domain.UserProviderLocal,
		domain.AccountTypePremium,
		nil,
		true,
	)

	demoUser, err = h.userService.Create(demoUser)
	if err != nil {
		return errors.Wrap(err, "failed to create user")
	}

	jwt, err := h.tokenService.generateToken(demoUser.ID)
	if err != nil {
		return errors.Wrap(err, "failed to generate JWT")
	}

	h.tokenService.setCookie(c, jwt)
	c.Status(http.StatusOK)
	return nil
}
