package api

import (
	"errors"
	"fmt"
	"growfolio/domain"
	"growfolio/domain/services"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type InvestmentHandler struct {
	investmentRepository services.InvestmentRepository
}

func NewInvestmentHandler(investmentRepository services.InvestmentRepository) InvestmentHandler {
	return InvestmentHandler{investmentRepository: investmentRepository}
}

func (h *InvestmentHandler) GetInvestments(c *gin.Context) (response[[]investmentDto], error) {
	claims := c.Value("token").(*jwt.Token).Claims.(jwt.MapClaims)
	userID := claims["userId"].(string)

	investments, err := h.investmentRepository.FindByUserID(userID)
	if err != nil {
		return response[[]investmentDto]{}, fmt.Errorf("failed to find investments: %w", err)
	}

	dtos := make([]investmentDto, 0)
	for _, investment := range investments {
		dtos = append(dtos, toInvestmentDto(investment))
	}

	return newResponse(http.StatusOK, dtos), nil
}

func (h *InvestmentHandler) GetInvestment(c *gin.Context) (response[investmentDto], error) {
	claims := c.Value("token").(*jwt.Token).Claims.(jwt.MapClaims)
	userID := claims["userId"].(string)

	id := c.Param("id")
	investment, err := h.investmentRepository.FindByID(id)
	if err != nil {
		if err == domain.ErrInvestmentNotFound {
			return response[investmentDto]{}, NewError(http.StatusBadRequest, err.Error())
		}
		return response[investmentDto]{}, fmt.Errorf("failed to find investment by id %s: %w", id, err)
	}

	if investment.UserID != userID {
		return response[investmentDto]{}, NewError(http.StatusForbidden, "not allowed to read investment")
	}

	return newResponse(http.StatusOK, toInvestmentDto(investment)), nil
}

func (h *InvestmentHandler) CreateInvestment(c *gin.Context) (response[investmentDto], error) {
	claims := c.Value("token").(*jwt.Token).Claims.(jwt.MapClaims)
	userID := claims["userId"].(string)

	var request CreateInvestmentRequest
	err := c.ShouldBindJSON(&request)
	if err != nil {
		return response[investmentDto]{}, fmt.Errorf("failed to decode request body: %w", err)
	}
	if err := request.validate(); err != nil {
		return response[investmentDto]{}, NewError(http.StatusBadRequest, err.Error())
	}

	created, err := h.investmentRepository.Create(request.toCommand(userID))
	if err != nil {
		return response[investmentDto]{}, fmt.Errorf("failed to create investment: %w", err)
	}

	return newResponse(http.StatusCreated, toInvestmentDto(created)), nil
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

func (r *CreateInvestmentRequest) toCommand(userID string) domain.CreateInvestmentCommand {
	return domain.NewCreateInvestmentCommand(r.Type, r.Name, userID)
}

type investmentDto struct {
	ID   string                `json:"id"`
	Type domain.InvestmentType `json:"type"`
	Name string                `json:"name"`
}

func newInvestmentDto(id string, t domain.InvestmentType, name string) investmentDto {
	return investmentDto{ID: id, Type: t, Name: name}
}
