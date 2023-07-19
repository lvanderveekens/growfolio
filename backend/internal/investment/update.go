package investment

import "time"

type CreateUpdateCommand struct {
	Date       time.Time
	Investment Investment
	Value      int64
}

func NewCreateUpdateCommand(date time.Time, i Investment, value int64) CreateUpdateCommand {
	return CreateUpdateCommand{Date: date, Investment: i, Value: value}
}

type Update struct {
	ID           string
	Date         time.Time
	InvestmentID string
	Value        int64
}

func NewUpdate(id, investmentID string, value int64) *Update {
	return &Update{
		ID:           id,
		InvestmentID: investmentID,
		Value:        value,
	}
}
