package transaction

import (
	"encoding/json"
	"fmt"
	"growfolio/internal/investment"
	"time"
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
	Date       time.Time
	Type       Type
	Investment investment.Investment
	Amount     int64
}

func NewCreateCommand(date time.Time, t Type, investment investment.Investment, amount int64) CreateCommand {
	return CreateCommand{
		Date:       date,
		Type:       t,
		Investment: investment,
		Amount:     amount,
	}

}

type Transaction struct {
	ID           string
	Date         time.Time
	Type         Type
	InvestmentID string
	Amount       int64
}

func New(id string, date time.Time, t Type, investmentID string, amount int64) *Transaction {
	return &Transaction{
		ID:           id,
		Date:         date,
		Type:         t,
		InvestmentID: investmentID,
		Amount:       amount,
	}
}
