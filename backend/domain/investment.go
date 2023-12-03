package domain

import "time"

type InvestmentType string

const (
	InvestmentTypeStock     InvestmentType = "stock"
	InvestmentTypeBond      InvestmentType = "bond"
	InvestmentTypeCommodity InvestmentType = "commodity"
	InvestmentTypeFund      InvestmentType = "fund"
	InvestmentTypeCrypto    InvestmentType = "crypto"
	InvestmentTypeCash      InvestmentType = "cash"
)

type CreateInvestmentCommand struct {
	Type         InvestmentType
	Name         string
	User         User
	Locked       bool
	InitialDate  *time.Time
	InitialCost  *int64
	InitialValue *int64
}

func NewCreateInvestmentCommand(
	t InvestmentType,
	name string,
	user User,
	locked bool,
	initialDate *time.Time,
	initialCost,
	initialValue *int64,
) CreateInvestmentCommand {
	return CreateInvestmentCommand{
		Type:         t,
		Name:         name,
		User:         user,
		Locked:       locked,
		InitialDate:  initialDate,
		InitialCost:  initialCost,
		InitialValue: initialValue,
	}
}

type Investment struct {
	ID             string
	Type           InvestmentType
	Name           string
	UserID         string
	Locked         bool
	LastUpdateDate *time.Time
}

func NewInvestment(
	id string,
	t InvestmentType,
	name,
	userID string,
	locked bool,
	lastUpdateDate *time.Time,
) Investment {
	return Investment{
		ID:             id,
		Type:           t,
		Name:           name,
		UserID:         userID,
		Locked:         locked,
		LastUpdateDate: lastUpdateDate,
	}
}
