package domain

import (
	"encoding/json"
	"fmt"
	"time"
)

type TransactionType string

const (
	TransactionTypeBuy  TransactionType = "buy"
	TransactionTypeSell TransactionType = "sell"
)

func (e *TransactionType) UnmarshalJSON(data []byte) error {
	var value string
	if err := json.Unmarshal(data, &value); err != nil {
		return err
	}

	switch TransactionType(value) {
	case TransactionTypeBuy:
		*e = TransactionTypeBuy
	case TransactionTypeSell:
		*e = TransactionTypeSell
	default:
		return fmt.Errorf("invalid type: %s", value)
	}

	return nil
}

type CreateTransactionCommand struct {
	Date       time.Time
	Type       TransactionType
	Investment Investment
	Amount     int64
}

func NewCreateTransactionCommand(date time.Time, t TransactionType, investment Investment, amount int64) CreateTransactionCommand {
	return CreateTransactionCommand{
		Date:       date,
		Type:       t,
		Investment: investment,
		Amount:     amount,
	}
}

type Transaction struct {
	ID           string
	Date         time.Time
	Type         TransactionType
	InvestmentID string
	Amount       int64
}

func NewTransaction(id string, date time.Time, t TransactionType, investmentID string, amount int64) Transaction {
	return Transaction{
		ID:           id,
		Date:         date,
		Type:         t,
		InvestmentID: investmentID,
		Amount:       amount,
	}
}

type TransactionWithInvestment struct {
	Transaction Transaction
	Investment  Investment
}

func NewTransactionWithInvestment(transaction Transaction, investment Investment) TransactionWithInvestment {
	return TransactionWithInvestment{
		Transaction: transaction,
		Investment:  investment,
	}
}
