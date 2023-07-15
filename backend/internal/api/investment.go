package api

import (
	"errors"
	"fmt"
	"growfolio/internal/investment"
	"net/http"

	"github.com/gin-gonic/gin"
)

type InvestmentHandler struct {
	investmentRepository investment.Repository
}

func NewInvestmentHandler(investmentRepository investment.Repository) *InvestmentHandler {
	return &InvestmentHandler{investmentRepository: investmentRepository}
}

func (h *InvestmentHandler) GetInvestments(c *gin.Context) error {
	investments, err := h.investmentRepository.Find()
	if err != nil {
		return fmt.Errorf("failed to find investments: %w", err)
	}

	dtos := make([]investmentDto, 0)
	for _, investment := range investments {
		dtos = append(dtos, toInvestmentDto(investment))
	}

	c.JSON(http.StatusOK, dtos)
	return nil
}

func (h *InvestmentHandler) CreateInvestment(c *gin.Context) error {
	var req createInvestmentRequest
	err := c.ShouldBindJSON(&req)
	if err != nil {
		return fmt.Errorf("failed to decode request body: %w", err)
	}
	if err := req.validate(); err != nil {
		return NewError(http.StatusBadRequest, err.Error())
	}

	created, err := h.investmentRepository.Create(req.toCommand())
	if err != nil {
		return fmt.Errorf("failed to create investment: %w", err)
	}

	c.JSON(http.StatusCreated, toInvestmentDto(*created))
	return nil
}

func toInvestmentDto(i investment.Investment) investmentDto {
	return newInvestmentDto(i.ID, i.Type, i.Name)
}

type createInvestmentRequest struct {
	Type investment.Type `json:"type"`
	Name string          `json:"name"`
}

func (r *createInvestmentRequest) validate() error {
	if r.Type == "" {
		return errors.New("field 'type' is missing")
	}
	if r.Name == "" {
		return errors.New("field 'name' is missing")
	}
	return nil
}

func (r *createInvestmentRequest) toCommand() investment.CreateCommand {
	return investment.NewCreateCommand(r.Type, r.Name)
}

type investmentDto struct {
	ID   string          `json:"id"`
	Type investment.Type `json:"type"`
	Name string          `json:"name"`
}

func newInvestmentDto(id string, t investment.Type, name string) investmentDto {
	return investmentDto{ID: id, Type: t, Name: name}
}
