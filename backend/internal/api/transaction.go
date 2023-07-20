package api

import (
	"errors"
	"fmt"
	"growfolio/internal/investment"
	"growfolio/internal/transaction"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type TransactionHandler struct {
	transactionRepository transaction.Repository
	investmentRepository  investment.Repository
}

func NewTransactionHandler(
	transactionRepository transaction.Repository,
	investmentRepository investment.Repository,
) *TransactionHandler {
	return &TransactionHandler{
		transactionRepository: transactionRepository,
		investmentRepository:  investmentRepository,
	}
}

func (h *TransactionHandler) GetTransactions(c *gin.Context) (*response[[]transactionDto], error) {
	transactions, err := h.transactionRepository.Find()
	if err != nil {
		return nil, fmt.Errorf("failed to find transactions: %w", err)
	}

	dtos := make([]transactionDto, 0)
	for _, transaction := range transactions {
		dtos = append(dtos, toTransactionDto(transaction))
	}

	return newResponse(http.StatusOK, &dtos), nil
}

func (h *TransactionHandler) CreateTransaction(c *gin.Context) (*response[transactionDto], error) {
	var req createTransactionRequest
	err := c.ShouldBindJSON(&req)
	if err != nil {
		return nil, NewError(http.StatusBadRequest, err.Error())
	}
	if err := req.validate(); err != nil {
		return nil, NewError(http.StatusBadRequest, err.Error())
	}

	i, err := h.investmentRepository.FindByID(req.InvestmentID)
	if err != nil {
		if err == investment.ErrNotFound {
			return nil, NewError(http.StatusBadRequest, err.Error())
		}
		return nil, fmt.Errorf("failed to find investment: %w", err)
	}

	cmd, err := req.toCommand(*i)
	if err != nil {
		return nil, NewError(http.StatusBadRequest, err.Error())
	}

	created, err := h.transactionRepository.Create(*cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to create transaction: %w", err)
	}

	dto := toTransactionDto(*created)
	return newResponse(http.StatusCreated, &dto), nil
}

func toTransactionDto(t transaction.Transaction) transactionDto {
	return newTransactionDto(t.ID, t.Date.Format("2006-01-02"), t.Type, t.InvestmentID, t.Amount)
}

type createTransactionRequest struct {
	Date         string           `json:"date"`
	Type         transaction.Type `json:"type"`
	InvestmentID string           `json:"investmentId"`
	Amount       int64            `json:"amount"`
}

func (r *createTransactionRequest) validate() error {
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

func (r *createTransactionRequest) toCommand(i investment.Investment) (*transaction.CreateCommand, error) {
	date, err := time.Parse("2006-01-02", r.Date)
	if err != nil {
		return nil, fmt.Errorf("failed to parse date: %w", err)
	}

	cmd := transaction.NewCreateCommand(date, r.Type, i, r.Amount)
	return &cmd, nil
}

type transactionDto struct {
	ID           string           `json:"id"`
	Date         string           `json:"date"`
	Type         transaction.Type `json:"type"`
	InvestmentID string           `json:"investmentId"`
	Amount       int64            `json:"amount"`
}

func newTransactionDto(id string, date string, t transaction.Type, investmentId string, amount int64) transactionDto {
	return transactionDto{
		ID:           id,
		Date:         date,
		Type:         t,
		InvestmentID: investmentId,
		Amount:       amount,
	}
}
