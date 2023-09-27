package api

import (
	"fmt"
	"growfolio/domain"
	"growfolio/domain/services"
	xslices "growfolio/slices"
	"net/http"
	"slices"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type InvestmentUpdateHandler struct {
	investmentRepository       services.InvestmentRepository
	investmentUpdateRepository services.InvestmentUpdateRepository
	investmentUpdateService    services.InvestmentUpdateService
}

func NewInvestmentUpdateHandler(
	investmentRepository services.InvestmentRepository,
	investmentUpdateRepository services.InvestmentUpdateRepository,
	investmentUpdateService services.InvestmentUpdateService,
) InvestmentUpdateHandler {
	return InvestmentUpdateHandler{
		investmentRepository:       investmentRepository,
		investmentUpdateRepository: investmentUpdateRepository,
		investmentUpdateService:    investmentUpdateService,
	}
}

func (h InvestmentUpdateHandler) GetInvestmentUpdates(c *gin.Context) (response[[]investmentUpdateDto], error) {
	tokenClaims := c.Value("token").(*jwt.Token).Claims.(jwt.MapClaims)
	tokenUserID := tokenClaims["userId"].(string)
	investmentIDFilter := stringOrNil(c.Query("investmentId"))

	var dateFromFilter *time.Time
	if c.Query("dateFrom") != "" {
		parsed, err := time.Parse("2006-01-02", c.Query("dateFrom"))
		if err != nil {
			return response[[]investmentUpdateDto]{}, fmt.Errorf("failed to parse dateFrom: %w", err)
		}
		dateFromFilter = &parsed
	}

	investments, err := h.investmentRepository.FindByUserID(tokenUserID)
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

func (h InvestmentUpdateHandler) CreateInvestmentUpdate(c *gin.Context) (response[investmentUpdateDto], error) {
	tokenClaims := c.Value("token").(*jwt.Token).Claims.(jwt.MapClaims)
	tokenUserID := tokenClaims["userId"].(string)

	var request createInvestmentUpdateRequest
	err := c.ShouldBindJSON(&request)
	if err != nil {
		return response[investmentUpdateDto]{}, fmt.Errorf("failed to decode request body: %w", err)
	}

	investment, err := h.investmentRepository.FindByID(request.InvestmentID)
	if err != nil {
		if err == domain.ErrInvestmentNotFound {
			return response[investmentUpdateDto]{}, NewError(http.StatusBadRequest, err.Error())
		}
		return response[investmentUpdateDto]{}, fmt.Errorf("failed to find investment: %w", err)
	}

	if investment.UserID != tokenUserID {
		return response[investmentUpdateDto]{}, NewError(http.StatusForbidden, "not allowed to create update for investment")
	}

	command, err := request.toCommand(investment)
	if err != nil {
		return response[investmentUpdateDto]{}, NewError(http.StatusBadRequest, err.Error())
	}

	update, err := h.investmentUpdateRepository.Create(command)
	if err != nil {
		return response[investmentUpdateDto]{}, fmt.Errorf("failed to create investment update: %w", err)
	}

	return newResponse(http.StatusCreated, toInvestmentUpdateDto(update)), nil
}

func (h InvestmentUpdateHandler) DeleteInvestmentUpdate(c *gin.Context) (response[empty], error) {
	tokenClaims := c.Value("token").(*jwt.Token).Claims.(jwt.MapClaims)
	tokenUserID := tokenClaims["userId"].(string)

	id := c.Param("id")
	update, err := h.investmentUpdateRepository.FindByID(id)
	if err != nil {
		if err == domain.ErrInvestmentUpdateNotFound {
			return response[empty]{}, NewError(http.StatusNotFound, err.Error())
		}
		return response[empty]{}, fmt.Errorf("failed to find investment update: %w", err)
	}

	investment, err := h.investmentRepository.FindByID(update.InvestmentID)
	if err != nil {
		if err == domain.ErrInvestmentNotFound {
			return response[empty]{}, NewError(http.StatusBadRequest, err.Error())
		}
		return response[empty]{}, fmt.Errorf("failed to find investment: %w", err)
	}

	if investment.UserID != tokenUserID {
		return response[empty]{}, NewError(http.StatusForbidden, "not allowed to delete investment update")
	}

	err = h.investmentUpdateRepository.DeleteByID(id)
	if err != nil {
		return response[empty]{}, fmt.Errorf("failed to delete investment update: %w", err)
	}

	return newEmptyResponse(http.StatusNoContent), nil
}

func toInvestmentUpdateDto(u domain.InvestmentUpdate) investmentUpdateDto {
	return newInvestmentUpdateDto(u.ID, u.Date.Format("2006-01-02"), u.InvestmentID, u.Value)
}

type createInvestmentUpdateRequest struct {
	Date         string `json:"date"`
	InvestmentID string `json:"investmentId"`
	Value        int64  `json:"value"`
}

func (r createInvestmentUpdateRequest) toCommand(i domain.Investment) (domain.CreateInvestmentUpdateCommand, error) {
	d, err := time.Parse("2006-01-02", r.Date)
	if err != nil {
		return domain.CreateInvestmentUpdateCommand{}, fmt.Errorf("failed to parse date: %w", err)
	}

	return domain.NewCreateInvestmentUpdateCommand(d, i, r.Value), nil
}

type investmentUpdateDto struct {
	ID           string `json:"id"`
	Date         string `json:"date"`
	InvestmentID string `json:"investmentId"`
	Value        int64  `json:"value"`
}

func newInvestmentUpdateDto(id, date, investmentId string, value int64) investmentUpdateDto {
	return investmentUpdateDto{ID: id, Date: date, InvestmentID: investmentId, Value: value}
}
