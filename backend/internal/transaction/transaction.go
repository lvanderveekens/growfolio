package transaction

import (
	"encoding/json"
	"fmt"
	"growfolio/internal/investment"
)

type Type string

const (
	TypeBuy  Type = "buy"
	TypeSell Type = "sell"
)

func (e *Type) UnmarshalJSON(data []byte) error {
	var value string
	if err := json.Unmarshal(data, &value); err != nil {
		return err
	}

	switch Type(value) {
	case TypeBuy:
		*e = TypeBuy
	case TypeSell:
		*e = TypeSell
	default:
		return fmt.Errorf("invalid type: %s", value)
	}

	return nil
}

type CreateCommand struct {
	Type       Type
	Investment investment.Investment
	Amount     int64
}

func NewCreateCommand(t Type, investment investment.Investment, amount int64) CreateCommand {
	return CreateCommand{
		Type:       t,
		Investment: investment,
		Amount:     amount,
	}

}

type Transaction struct {
	ID           string
	Type         Type
	InvestmentID string
	Amount       int64
}

func New(id string, t Type, investmentID string, amount int64) *Transaction {
	return &Transaction{
		ID:           id,
		Type:         t,
		InvestmentID: investmentID,
		Amount:       amount,
	}
}
