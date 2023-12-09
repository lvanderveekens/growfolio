package domain

import "time"

type CreateInvestmentUpdateCommand struct {
	Investment Investment
	Date       time.Time
	Deposit    *int64
	Withdrawal *int64
	Value      int64
}

func NewCreateInvestmentUpdateCommand(investment Investment, date time.Time, deposit, withdrawal *int64, value int64) CreateInvestmentUpdateCommand {
	return CreateInvestmentUpdateCommand{
		Investment: investment,
		Date:       date,
		Deposit:    deposit,
		Withdrawal: withdrawal,
		Value:      value,
	}
}

type InvestmentUpdate struct {
	ID           string
	InvestmentID string
	Date         time.Time
	Deposit      *int64
	Withdrawal   *int64
	Cost         int64
	Value        int64
}

func NewInvestmentUpdate(id, investmentID string, date time.Time, deposit, withdrawal *int64, cost, value int64) InvestmentUpdate {
	return InvestmentUpdate{
		ID:           id,
		InvestmentID: investmentID,
		Date:         date,
		Deposit:      deposit,
		Withdrawal:   withdrawal,
		Cost:         cost,
		Value:        value,
	}
}

type FindInvestmentUpdateQuery struct {
	InvestmentIDs []string
	DateFrom      *time.Time
}
