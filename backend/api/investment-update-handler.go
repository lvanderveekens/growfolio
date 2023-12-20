package api

import (
	"fmt"
	"growfolio/domain"
	"growfolio/domain/services"
	"growfolio/pointer"
	xslices "growfolio/slices"
	"net/http"
	"slices"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type InvestmentUpdateHandler struct {
	investmentService       services.InvestmentService
	investmentUpdateService services.InvestmentUpdateService
}

func NewInvestmentUpdateHandler(
	investmentService services.InvestmentService,
	investmentUpdateService services.InvestmentUpdateService,
) InvestmentUpdateHandler {
	return InvestmentUpdateHandler{
		investmentService:       investmentService,
		investmentUpdateService: investmentUpdateService,
	}
}

func (h InvestmentUpdateHandler) GetInvestmentUpdates(c *gin.Context) (response[[]investmentUpdateDto], error) {
	tokenClaims := c.Value("token").(*jwt.Token).Claims.(jwt.MapClaims)
	tokenUserID := tokenClaims["userId"].(string)
	investmentIDFilter := pointer.StringOrNil(c.Query("investmentId"))

	var dateFromFilter *time.Time
	if c.Query("dateFrom") != "" {
		parsed, err := time.Parse("2006-01-02", c.Query("dateFrom"))
		if err != nil {
			return response[[]investmentUpdateDto]{}, fmt.Errorf("failed to parse dateFrom: %w", err)
		}
		dateFromFilter = &parsed
	}

	investments, err := h.investmentService.FindByUserID(tokenUserID)
	if err != nil {
		return response[[]investmentUpdateDto]{}, fmt.Errorf("failed to find investments: %w", err)
	}
	if len(investments) == 0 {
		return newResponse(http.StatusOK, []investmentUpdateDto{}), nil
	}

	investmentIDs := xslices.Map(investments, func(i domain.Investment) string { return i.ID })
	if investmentIDFilter != nil {
		if !slices.Contains(investmentIDs, *investmentIDFilter) {
			return response[[]investmentUpdateDto]{}, NewError(http.StatusForbidden, "not allowed to read investment update")
		}
		investmentIDs = []string{*investmentIDFilter}
	}

	updates, err := h.investmentUpdateService.Find(domain.FindInvestmentUpdateQuery{
		InvestmentIDs: investmentIDs,
		DateFrom:      dateFromFilter,
	})
	if err != nil {
		return response[[]investmentUpdateDto]{}, fmt.Errorf("failed to find investment updates: %w", err)
	}

	dtos := make([]investmentUpdateDto, 0)
	for _, update := range updates {
		dtos = append(dtos, toInvestmentUpdateDto(update))
	}

	return newResponse(http.StatusOK, dtos), nil
}

func (h InvestmentUpdateHandler) DeleteInvestmentUpdate(c *gin.Context) (response[empty], error) {
	tokenClaims := c.Value("token").(*jwt.Token).Claims.(jwt.MapClaims)
	tokenUserID := tokenClaims["userId"].(string)

	id := c.Param("id")
	update, err := h.investmentUpdateService.FindByID(id)
	if err != nil {
		if err == domain.ErrInvestmentUpdateNotFound {
			return response[empty]{}, NewError(http.StatusNotFound, err.Error())
		}
		return response[empty]{}, fmt.Errorf("failed to find investment update: %w", err)
	}

	investment, err := h.investmentService.FindByID(update.InvestmentID)
	if err != nil {
		if err == domain.ErrInvestmentNotFound {
			return response[empty]{}, NewError(http.StatusBadRequest, err.Error())
		}
		return response[empty]{}, fmt.Errorf("failed to find investment: %w", err)
	}

	if investment.UserID != tokenUserID {
		return response[empty]{}, NewError(http.StatusForbidden, "not allowed to delete investment update")
	}

	err = h.investmentUpdateService.DeleteByID(id)
	if err != nil {
		return response[empty]{}, fmt.Errorf("failed to delete investment update: %w", err)
	}

	return newEmptyResponse(http.StatusNoContent), nil
}

func toInvestmentUpdateDto(u domain.InvestmentUpdate) investmentUpdateDto {
	return newInvestmentUpdateDto(u.ID, u.Date.Format("2006-01-02"), u.InvestmentID, u.Deposit, u.Withdrawal, u.Cost, u.Value)
}

type investmentUpdateDto struct {
	ID           string `json:"id"`
	InvestmentID string `json:"investmentId"`
	Date         string `json:"date"`
	Deposit      *int64 `json:"deposit"`
	Withdrawal   *int64 `json:"withdrawal"`
	Cost         int64  `json:"cost"`
	Value        int64  `json:"value"`
}

func newInvestmentUpdateDto(id, date, investmentId string, deposit, withdrawal *int64, cost, value int64) investmentUpdateDto {
	return investmentUpdateDto{
		ID:           id,
		InvestmentID: investmentId,
		Date:         date,
		Deposit:      deposit,
		Withdrawal:   withdrawal,
		Cost:         cost,
		Value:        value,
	}
}
