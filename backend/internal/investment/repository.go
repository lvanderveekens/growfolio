package investment

type Repository interface {
	Find() ([]Investment, error)
	FindByID(id string) (*Investment, error)
	Create(command CreateCommand) (*Investment, error)
}
