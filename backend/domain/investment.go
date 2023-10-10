package domain

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
	Type   InvestmentType
	Name   string
	UserID string
	Locked bool
}

func NewCreateInvestmentCommand(t InvestmentType, name, userID string, locked bool) CreateInvestmentCommand {
	return CreateInvestmentCommand{
		Type:   t,
		Name:   name,
		UserID: userID,
		Locked: locked,
	}

}

type Investment struct {
	ID     string
	Type   InvestmentType
	Name   string
	UserID string
	Locked bool
}

func NewInvestment(id string, t InvestmentType, name, userID string, locked bool) Investment {
	return Investment{
		ID:     id,
		Type:   t,
		Name:   name,
		UserID: userID,
		Locked: locked,
	}
}
