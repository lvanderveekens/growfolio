package investment

type Type string

const (
	TypeStock     Type = "stock"
	TypeBond      Type = "bond"
	TypeCommodity Type = "commodity"
	TypeFund      Type = "fund"
	TypeCrypto    Type = "crypto"
	TypeCash      Type = "cash"
)

type CreateCommand struct {
	Type Type
	Name string
}

func NewCreateCommand(t Type, name string) CreateCommand {
	return CreateCommand{
		Type: t,
		Name: name,
	}

}

type Investment struct {
	ID   string
	Type Type
	Name string
}

func New(id string, t Type, name string) *Investment {
	return &Investment{
		ID:   id,
		Type: t,
		Name: name,
	}
}
