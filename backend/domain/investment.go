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
}

func NewCreateInvestmentCommand(t InvestmentType, name, userID string) CreateInvestmentCommand {
	return CreateInvestmentCommand{
		Type:   t,
		Name:   name,
		UserID: userID,
	}

}

type Investment struct {
	ID     string
	Type   InvestmentType
	Name   string
	UserID string
}

func NewInvestment(id string, t InvestmentType, name, userID string) Investment {
	return Investment{
		ID:     id,
		Type:   t,
		Name:   name,
		UserID: userID,
	}
}
