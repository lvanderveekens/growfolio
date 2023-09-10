package domain

import "time"

type CreateInvestmentUpdateCommand struct {
	Date       time.Time
	Investment Investment
	Value      int64
}

func NewCreateInvestmentUpdateCommand(date time.Time, i Investment, value int64) CreateInvestmentUpdateCommand {
	return CreateInvestmentUpdateCommand{Date: date, Investment: i, Value: value}
}

type InvestmentUpdate struct {
	ID           string
	Date         time.Time
	InvestmentID string
	Value        int64
}

func NewInvestmentUpdate(id string, date time.Time, investmentID string, value int64) InvestmentUpdate {
	return InvestmentUpdate{
		ID:           id,
		Date:         date,
		InvestmentID: investmentID,
		Value:        value,
	}
}

type InvestmentUpdateWithInvestment struct {
	Update     InvestmentUpdate
	Investment Investment
}

func NewInvestmentUpdateWithInvestment(update InvestmentUpdate, investment Investment) InvestmentUpdateWithInvestment {
	return InvestmentUpdateWithInvestment{
		Update:     update,
		Investment: investment,
	}
}
