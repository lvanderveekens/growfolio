package api

import (
	"fmt"
	"growfolio/internal/investment"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type InvestmentUpdateHandler struct {
	investmentRepository investment.Repository
}

func NewInvestmentUpdateHandler(investmentRepository investment.Repository) *InvestmentUpdateHandler {
	return &InvestmentUpdateHandler{investmentRepository: investmentRepository}
}

func (h *InvestmentUpdateHandler) GetInvestmentUpdates(c *gin.Context) (*response[[]investmentUpdateDto], error) {
	updates, err := h.investmentRepository.FindUpdates()
	if err != nil {
		return nil, fmt.Errorf("failed to find investment updates: %w", err)
	}

	dtos := make([]investmentUpdateDto, 0)
	for _, u := range updates {
		dtos = append(dtos, toInvestmentUpdateDto(u))
	}

	return newResponse(http.StatusOK, &dtos), nil
}

func (h *InvestmentUpdateHandler) CreateInvestmentUpdate(c *gin.Context) (*response[investmentUpdateDto], error) {
	var r createInvestmentUpdateRequest
	err := c.ShouldBindJSON(&r)
	if err != nil {
		return nil, fmt.Errorf("failed to decode request body: %w", err)
	}

	i, err := h.investmentRepository.FindByID(r.InvestmentID)
	if err != nil {
		if err == investment.ErrNotFound {
			return nil, NewError(http.StatusBadRequest, err.Error())
		}
		return nil, fmt.Errorf("failed to find investment: %w", err)
	}

	cmd, err := r.toCommand(*i)
	if err != nil {
		return nil, NewError(http.StatusBadRequest, err.Error())
	}

	u, err := h.investmentRepository.CreateUpdate(*cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to create investment update: %w", err)
	}

	dto := toInvestmentUpdateDto(*u)
	return newResponse(http.StatusCreated, &dto), nil
}

func toInvestmentUpdateDto(u investment.Update) investmentUpdateDto {
	return newInvestmentUpdateDto(u.ID, u.Date.Format("2006-01-02"), u.InvestmentID, u.Value)
}

type createInvestmentUpdateRequest struct {
	Date         string `json:"date"`
	InvestmentID string `json:"investmentId"`
	Value        int64  `json:"value"`
}

func (r *createInvestmentUpdateRequest) toCommand(i investment.Investment) (*investment.CreateUpdateCommand, error) {
	d, err := time.Parse("2006-01-02", r.Date)
	if err != nil {
		return nil, fmt.Errorf("failed to parse date: %w", err)
	}

	c := investment.NewCreateUpdateCommand(d, i, r.Value)
	return &c, nil
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
