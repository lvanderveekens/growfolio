package api

import (
	"errors"
	"fmt"
	"growfolio/internal/investment"
	"growfolio/internal/transaction"
	"net/http"

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

func (h *TransactionHandler) GetTransactions(c *gin.Context) error {
	transactions, err := h.transactionRepository.Find()
	if err != nil {
		return fmt.Errorf("failed to find transactions: %w", err)
	}

	dtos := make([]transactionDto, 0)
	for _, transaction := range transactions {
		dtos = append(dtos, toTransactionDto(transaction))
	}

	c.JSON(http.StatusOK, dtos)
	return nil
}

func (h *TransactionHandler) CreateTransaction(c *gin.Context) error {
	var req createTransactionRequest
	err := c.ShouldBindJSON(&req)
	if err != nil {
		return NewError(http.StatusBadRequest, err.Error())
	}
	if err := req.validate(); err != nil {
		return NewError(http.StatusBadRequest, err.Error())
	}

	i, err := h.investmentRepository.FindByID(req.InvestmentID)
	if err != nil {
		if err == investment.ErrNotFound {
			return NewError(http.StatusBadRequest, err.Error())
		}
		return fmt.Errorf("failed to find investment: %w", err)
	}

	created, err := h.transactionRepository.Create(req.toCommand(*i))
	if err != nil {
		return fmt.Errorf("failed to create transaction: %w", err)
	}

	c.JSON(http.StatusCreated, toTransactionDto(*created))
	return nil
}

func toTransactionDto(t transaction.Transaction) transactionDto {
	return newTransactionDto(t.ID, t.Type, t.InvestmentID, t.Amount)
}

type createTransactionRequest struct {
	Type         transaction.Type `json:"type"`
	InvestmentID string           `json:"investmentId"`
	Amount       int64            `json:"amount"`
}

func (r *createTransactionRequest) validate() error {
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

func (r *createTransactionRequest) toCommand(investment investment.Investment) transaction.CreateCommand {
	return transaction.NewCreateCommand(r.Type, investment, r.Amount)
}

type transactionDto struct {
	ID           string           `json:"id"`
	Type         transaction.Type `json:"type"`
	InvestmentID string           `json:"investmentId"`
	Amount       int64            `json:"amount"`
}

func newTransactionDto(id string, t transaction.Type, investmentId string, amount int64) transactionDto {
	return transactionDto{
		ID:           id,
		Type:         t,
		InvestmentID: investmentId,
		Amount:       amount,
	}
}
