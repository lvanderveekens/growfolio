package domain

import "time"

type InvestmentType string

const (
	InvestmentTypeStock      InvestmentType = "stock"
	InvestmentTypeBond       InvestmentType = "bond"
	InvestmentTypeCommodity  InvestmentType = "commodity"
	InvestmentTypeFund       InvestmentType = "fund"
	InvestmentTypeCrypto     InvestmentType = "crypto"
	InvestmentTypeCash       InvestmentType = "cash"
	InvestmentTypeP2PLending InvestmentType = "p2pLending"
	InvestmentTypeRealEstate InvestmentType = "realEstate"
	InvestmentTypeForex      InvestmentType = "forex"
)

type CreateInvestmentCommand struct {
	Type          InvestmentType
	Name          string
	User          User
	Locked        bool
	InitialUpdate *InitialInvestmentUpdate
}

func NewCreateInvestmentCommand(
	t InvestmentType,
	name string,
	user User,
	locked bool,
	initialUpdate *InitialInvestmentUpdate,
) CreateInvestmentCommand {
	return CreateInvestmentCommand{
		Type:          t,
		Name:          name,
		User:          user,
		Locked:        locked,
		InitialUpdate: initialUpdate,
	}
}

type InitialInvestmentUpdate struct {
	Date    *time.Time
	Deposit *int64
	Value   int64
}

func NewInitialInvestmentUpdate(date *time.Time, deposit *int64, value int64) InitialInvestmentUpdate {
	return InitialInvestmentUpdate{
		Date:    date,
		Deposit: deposit,
		Value:   value,
	}
}

type Investment struct {
	ID         string
	Type       InvestmentType
	Name       string
	UserID     string
	Locked     bool
	LastUpdate *InvestmentUpdate
}

func NewInvestment(
	id string,
	t InvestmentType,
	name,
	userID string,
	locked bool,
	lastUpdate *InvestmentUpdate,
) Investment {
	return Investment{
		ID:         id,
		Type:       t,
		Name:       name,
		UserID:     userID,
		Locked:     locked,
		LastUpdate: lastUpdate,
	}
}
