package api

import (
	"errors"
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

type TransactionHandler struct {
	transactionRepository services.TransactionRepository
	transactionService    services.TransactionService
	investmentRepository  services.InvestmentRepository
}

func NewTransactionHandler(
	transactionRepository services.TransactionRepository,
	transactionService services.TransactionService,
	investmentRepository services.InvestmentRepository,
) TransactionHandler {
	return TransactionHandler{
		transactionRepository: transactionRepository,
		transactionService:    transactionService,
		investmentRepository:  investmentRepository,
	}
}

func (h TransactionHandler) GetTransactions(c *gin.Context) (response[[]transactionDto], error) {
	tokenClaims := c.Value("token").(*jwt.Token).Claims.(jwt.MapClaims)
	tokenUserID := tokenClaims["userId"].(string)
	investmentIDFilter := c.Query("investmentId")

	investments, err := h.investmentRepository.FindByUserID(tokenUserID)
	if err != nil {
		return response[[]transactionDto]{}, fmt.Errorf("failed to find investments: %w", err)
	}
	if len(investments) == 0 {
		return newResponse(http.StatusOK, []transactionDto{}), nil
	}

	investmentIDs := xslices.Map(investments, func(i domain.Investment) string { return i.ID })
	if investmentIDFilter != "" {
		if !slices.Contains(investmentIDs, investmentIDFilter) {
			return response[[]transactionDto]{}, NewError(http.StatusForbidden, "not allowed to read transaction")
		}
		investmentIDs = []string{investmentIDFilter}
	}

	transactions, err := h.transactionRepository.FindByInvestmentIDs(investmentIDs)
	if err != nil {
		return response[[]transactionDto]{}, fmt.Errorf("failed to find transactions: %w", err)
	}

	dtos := make([]transactionDto, 0)
	for _, transaction := range transactions {
		dtos = append(dtos, toTransactionDto(transaction))
	}

	return newResponse(http.StatusOK, dtos), nil
}

func stringOrNil(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func (h TransactionHandler) CreateTransaction(c *gin.Context) (response[transactionDto], error) {
	tokenClaims := c.Value("token").(*jwt.Token).Claims.(jwt.MapClaims)
	tokenUserID := tokenClaims["userId"].(string)

	var request createTransactionRequest
	err := c.ShouldBindJSON(&request)
	if err != nil {
		return response[transactionDto]{}, NewError(http.StatusBadRequest, err.Error())
	}
	if err := request.validate(); err != nil {
		return response[transactionDto]{}, NewError(http.StatusBadRequest, err.Error())
	}

	investment, err := h.investmentRepository.FindByID(request.InvestmentID)
	if err != nil {
		if err == domain.ErrInvestmentNotFound {
			return response[transactionDto]{}, NewError(http.StatusBadRequest, err.Error())
		}
		return response[transactionDto]{}, fmt.Errorf("failed to find investment: %w", err)
	}

	if investment.UserID != tokenUserID {
		return response[transactionDto]{}, NewError(http.StatusForbidden, "not allowed to create transaction for investment")
	}

	command, err := request.toCommand(investment)
	if err != nil {
		return response[transactionDto]{}, NewError(http.StatusBadRequest, err.Error())
	}

	transaction, err := h.transactionRepository.Create(command)
	if err != nil {
		return response[transactionDto]{}, fmt.Errorf("failed to create transaction: %w", err)
	}

	return newResponse(http.StatusCreated, toTransactionDto(transaction)), nil
}

func (h TransactionHandler) DeleteTransaction(c *gin.Context) (response[empty], error) {
	tokenClaims := c.Value("token").(*jwt.Token).Claims.(jwt.MapClaims)
	tokenUserID := tokenClaims["userId"].(string)

	id := c.Param("id")
	transaction, err := h.transactionRepository.FindByID(id)
	if err != nil {
		if err == domain.ErrTransactionNotFound {
			return newEmptyResponse(http.StatusNoContent), nil
		}
		return response[empty]{}, fmt.Errorf("failed to find transaction: %w", err)
	}

	investment, err := h.investmentRepository.FindByID(transaction.InvestmentID)
	if err != nil {
		return response[empty]{}, fmt.Errorf("failed to find investment: %w", err)
	}
	if investment.UserID != tokenUserID {
		return response[empty]{}, NewError(http.StatusForbidden, "not allowed to delete transaction")

	}

	err = h.transactionRepository.DeleteByID(transaction.ID)
	if err != nil {
		return response[empty]{}, fmt.Errorf("failed to delete transaction: %w", err)
	}

	return newEmptyResponse(http.StatusNoContent), nil
}

func toTransactionDto(t domain.Transaction) transactionDto {
	return newTransactionDto(t.ID, t.Date.Format("2006-01-02"), t.Type, t.InvestmentID, t.Amount)
}

type createTransactionRequest struct {
	Date         string                 `json:"date"`
	Type         domain.TransactionType `json:"type"`
	InvestmentID string                 `json:"investmentId"`
	Amount       int64                  `json:"amount"`
}

func (r createTransactionRequest) validate() error {
	if r.Date == "" {
		return errors.New("field 'date' is missing")
	}
	if r.Type == "" {
		return errors.New("field 'type' is missing")
	}
	if r.InvestmentID == "" {
		return errors.New("field 'investmentId' is missing")
	}
	if r.Amount == 0 {
		return errors.New("field 'amount' is missing")
	}
	return nil
}

func (r createTransactionRequest) toCommand(investment domain.Investment) (domain.CreateTransactionCommand, error) {
	date, err := time.Parse("2006-01-02", r.Date)
	if err != nil {
		return domain.CreateTransactionCommand{}, fmt.Errorf("failed to parse date: %w", err)
	}

	return domain.NewCreateTransactionCommand(date, r.Type, investment, r.Amount), nil
}

type transactionDto struct {
	ID           string                 `json:"id"`
	Date         string                 `json:"date"`
	Type         domain.TransactionType `json:"type"`
	InvestmentID string                 `json:"investmentId"`
	Amount       int64                  `json:"amount"`
}

func newTransactionDto(id string, date string, t domain.TransactionType, investmentId string, amount int64) transactionDto {
	return transactionDto{
		ID:           id,
		Date:         date,
		Type:         t,
		InvestmentID: investmentId,
		Amount:       amount,
	}
}
