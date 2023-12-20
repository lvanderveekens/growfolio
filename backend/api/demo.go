package api

import (
	"growfolio/domain"
	"growfolio/domain/services"
	"growfolio/pointer"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/pkg/errors"
)

type DemoHandler struct {
	userService       services.UserService
	investmentService services.InvestmentService
	tokenService      TokenService
}

func NewDemoHandler(
	userService services.UserService,
	investmentService services.InvestmentService,
	tokenService TokenService,
) DemoHandler {
	return DemoHandler{
		userService:       userService,
		investmentService: investmentService,
		tokenService:      tokenService,
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

	// TODO: create demo user data

	threeYearsAgo := time.Now().AddDate(-3, 0, 0)

	_, err = h.investmentService.Create(domain.NewCreateInvestmentCommand(
		domain.InvestmentTypeFund,
		"NT World",
		demoUser,
		false,
		&threeYearsAgo,
		pointer.IntOrNil(10000),
		10000,
	))
	if err != nil {
		return errors.Wrap(err, "failed to create investment")
	}

	_, err = h.investmentService.Create(domain.NewCreateInvestmentCommand(
		domain.InvestmentTypeFund,
		"NT Emerging Markets",
		demoUser,
		false,
		&threeYearsAgo,
		pointer.IntOrNil(10000),
		10000,
	))
	if err != nil {
		return errors.Wrap(err, "failed to create investment")
	}

	_, err = h.investmentService.Create(domain.NewCreateInvestmentCommand(
		domain.InvestmentTypeFund,
		"NT Small Cap",
		demoUser,
		false,
		&threeYearsAgo,
		pointer.IntOrNil(10000),
		10000,
	))
	if err != nil {
		return errors.Wrap(err, "failed to create investment")
	}

	_, err = h.investmentService.Create(domain.NewCreateInvestmentCommand(
		domain.InvestmentTypeCrypto,
		"Bitcoin",
		demoUser,
		false,
		&threeYearsAgo,
		pointer.IntOrNil(10000),
		10000,
	))
	if err != nil {
		return errors.Wrap(err, "failed to create investment")
	}

	_, err = h.investmentService.Create(domain.NewCreateInvestmentCommand(
		domain.InvestmentTypeCash,
		"Cash",
		demoUser,
		false,
		&threeYearsAgo,
		pointer.IntOrNil(1000000),
		1000000,
	))
	if err != nil {
		return errors.Wrap(err, "failed to create investment")
	}

	// TODO: import updates from CSV

	jwt, err := h.tokenService.generateToken(demoUser.ID)
	if err != nil {
		return errors.Wrap(err, "failed to generate JWT")
	}

	h.tokenService.setCookie(c, jwt)
	c.Status(http.StatusOK)
	return nil
}
