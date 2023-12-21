package api

import (
	"encoding/csv"
	"growfolio/internal/domain"
	"growfolio/internal/domain/services"
	"growfolio/internal/pointer"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/pkg/errors"
)

type DemoHandler struct {
	userService                 services.UserService
	investmentService           services.InvestmentService
	investmentUpdateCSVImporter InvestmentUpdateCSVImporter
	tokenService                TokenService
}

func NewDemoHandler(
	userService services.UserService,
	investmentService services.InvestmentService,
	investmentUpdateCSVImporter InvestmentUpdateCSVImporter,
	tokenService TokenService,
) DemoHandler {
	return DemoHandler{
		userService:                 userService,
		investmentService:           investmentService,
		investmentUpdateCSVImporter: investmentUpdateCSVImporter,
		tokenService:                tokenService,
	}
}

func (h DemoHandler) CreateDemoSession(c *gin.Context) error {
	id, err := uuid.NewRandom()
	if err != nil {
		return errors.Wrap(err, "failed to generate new UUID")
	}

	demoUser := domain.NewUser(id.String(), "demo@growfolio.co", domain.UserProviderLocal, domain.AccountTypePremium,
		nil, true)

	demoUser, err = h.userService.Create(demoUser)
	if err != nil {
		return errors.Wrap(err, "failed to create user")
	}

	threeYearsAgo := time.Now().AddDate(-3, 0, 0)

	err = h.createNTWorldInvestment(demoUser, threeYearsAgo)
	if err != nil {
		return errors.Wrap(err, "failed to create NT World investment")
	}

	err = h.createNTEmergingMarketsInvestment(demoUser, threeYearsAgo)
	if err != nil {
		return errors.Wrap(err, "failed to create NT Emerging Markets investment")
	}

	err = h.createNTSmallCapInvestment(demoUser, threeYearsAgo)
	if err != nil {
		return errors.Wrap(err, "failed to create NT Small Cap investment")
	}

	err = h.createBitcoinInvestment(demoUser, threeYearsAgo)
	if err != nil {
		return errors.Wrap(err, "failed to create Bitcoin investment")
	}

	err = h.createCashInvestment(demoUser, threeYearsAgo)
	if err != nil {
		return errors.Wrap(err, "failed to create Cash investment")
	}

	jwt, err := h.tokenService.generateToken(demoUser.ID)
	if err != nil {
		return errors.Wrap(err, "failed to generate JWT")
	}

	h.tokenService.setCookie(c, jwt)
	c.Status(http.StatusOK)
	return nil
}

func (h DemoHandler) createNTWorldInvestment(demoUser domain.User, initialDate time.Time) error {
	_, err := h.investmentService.Create(domain.NewCreateInvestmentCommand(
		domain.InvestmentTypeFund,
		"NT World",
		demoUser,
		false,
		&initialDate,
		pointer.IntOrNil(10000),
		10000,
	))
	if err != nil {
		return errors.Wrap(err, "failed to create investment")
	}

	// csvFile, err := os.Open("demo/bitcoin-updates.csv")
	// if err != nil {
	// 	return errors.Wrap(err, "failed to open CSV file")
	// }
	// defer csvFile.Close()

	// err = h.investmentUpdateCSVImporter.Import(csv.NewReader(csvFile), investment)
	// if err != nil {
	// 	return errors.Wrap(err, "failed to import CSV updates")
	// }
	return nil
}

func (h DemoHandler) createNTEmergingMarketsInvestment(demoUser domain.User, initialDate time.Time) error {
	_, err := h.investmentService.Create(domain.NewCreateInvestmentCommand(
		domain.InvestmentTypeFund,
		"NT Emerging Markets",
		demoUser,
		false,
		&initialDate,
		pointer.IntOrNil(10000),
		10000,
	))
	if err != nil {
		return errors.Wrap(err, "failed to create investment")
	}

	// csvFile, err := os.Open("demo/bitcoin-updates.csv")
	// if err != nil {
	// 	return errors.Wrap(err, "failed to open CSV file")
	// }
	// defer csvFile.Close()

	// err = h.investmentUpdateCSVImporter.Import(csv.NewReader(csvFile), investment)
	// if err != nil {
	// 	return errors.Wrap(err, "failed to import CSV updates")
	// }
	return nil
}

func (h DemoHandler) createNTSmallCapInvestment(demoUser domain.User, initialDate time.Time) error {
	_, err := h.investmentService.Create(domain.NewCreateInvestmentCommand(
		domain.InvestmentTypeFund,
		"NT Small Cap",
		demoUser,
		false,
		&initialDate,
		pointer.IntOrNil(10000),
		10000,
	))
	if err != nil {
		return errors.Wrap(err, "failed to create investment")
	}

	// csvFile, err := os.Open("demo/bitcoin-updates.csv")
	// if err != nil {
	// 	return errors.Wrap(err, "failed to open CSV file")
	// }
	// defer csvFile.Close()

	// err = h.investmentUpdateCSVImporter.Import(csv.NewReader(csvFile), investment)
	// if err != nil {
	// 	return errors.Wrap(err, "failed to import CSV updates")
	// }
	return nil
}

func (h DemoHandler) createBitcoinInvestment(demoUser domain.User, initialDate time.Time) error {
	investment, err := h.investmentService.Create(domain.NewCreateInvestmentCommand(
		domain.InvestmentTypeCrypto,
		"Bitcoin",
		demoUser,
		false,
		&initialDate,
		pointer.IntOrNil(10000),
		10000,
	))
	if err != nil {
		return errors.Wrap(err, "failed to create investment")
	}

	csvFile, err := os.Open("demo/bitcoin-updates.csv")
	if err != nil {
		return errors.Wrap(err, "failed to open CSV file")
	}
	defer csvFile.Close()

	err = h.investmentUpdateCSVImporter.Import(csv.NewReader(csvFile), investment)
	if err != nil {
		return errors.Wrap(err, "failed to import CSV updates")
	}
	return nil
}

func (h DemoHandler) createCashInvestment(demoUser domain.User, initialDate time.Time) error {
	_, err := h.investmentService.Create(domain.NewCreateInvestmentCommand(
		domain.InvestmentTypeCash,
		"Cash",
		demoUser,
		false,
		&initialDate,
		pointer.IntOrNil(1000000),
		1000000,
	))
	return err
}
