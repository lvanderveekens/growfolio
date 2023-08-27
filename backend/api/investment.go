package api

import (
	"errors"
	"fmt"
	"growfolio/domain"
	"growfolio/domain/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type InvestmentHandler struct {
	investmentRepository services.InvestmentRepository
}

func NewInvestmentHandler(investmentRepository services.InvestmentRepository) *InvestmentHandler {
	return &InvestmentHandler{investmentRepository: investmentRepository}
}

func (h *InvestmentHandler) GetInvestments(c *gin.Context) (*response[[]investmentDto], error) {
	investments, err := h.investmentRepository.Find()
	if err != nil {
		return nil, fmt.Errorf("failed to find investments: %w", err)
	}

	dtos := make([]investmentDto, 0)
	for _, investment := range investments {
		dtos = append(dtos, toInvestmentDto(investment))
	}

	return newResponse(http.StatusOK, dtos), nil
}

func (h *InvestmentHandler) GetInvestment(c *gin.Context) (*response[investmentDto], error) {
	id := c.Param("id")
	i, err := h.investmentRepository.FindByID(id)
	if err != nil {
		if err == domain.ErrInvestmentNotFound {
			return nil, NewError(http.StatusBadRequest, err.Error())
		}
		return nil, fmt.Errorf("failed to find investment by id %s: %w", id, err)
	}

	dto := toInvestmentDto(*i)
	return newResponse(http.StatusOK, dto), nil
}

func (h *InvestmentHandler) CreateInvestment(c *gin.Context) (*response[investmentDto], error) {
	var req CreateInvestmentRequest
	err := c.ShouldBindJSON(&req)
	if err != nil {
		return nil, fmt.Errorf("failed to decode request body: %w", err)
	}
	if err := req.validate(); err != nil {
		return nil, NewError(http.StatusBadRequest, err.Error())
	}

	created, err := h.investmentRepository.Create(req.toCommand())
	if err != nil {
		return nil, fmt.Errorf("failed to create investment: %w", err)
	}

	dto := toInvestmentDto(*created)
	return newResponse(http.StatusCreated, dto), nil
}

func toInvestmentDto(i domain.Investment) investmentDto {
	return newInvestmentDto(i.ID, i.Type, i.Name)
}

type CreateInvestmentRequest struct {
	Type domain.InvestmentType `json:"type"`
	Name string                `json:"name"`
}

func (r *CreateInvestmentRequest) validate() error {
	if r.Type == "" {
		return errors.New("field 'type' is missing")
	}
	if r.Name == "" {
		return errors.New("field 'name' is missing")
	}
	return nil
}

func (r *CreateInvestmentRequest) toCommand() domain.CreateInvestmentCommand {
	return domain.NewCreateInvestmentCommand(r.Type, r.Name)
}

type investmentDto struct {
	ID   string                `json:"id"`
	Type domain.InvestmentType `json:"type"`
	Name string                `json:"name"`
}

func newInvestmentDto(id string, t domain.InvestmentType, name string) investmentDto {
	return investmentDto{ID: id, Type: t, Name: name}
}
