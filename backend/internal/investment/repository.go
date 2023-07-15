package investment

type Repository interface {
	Find() ([]Investment, error)
	Create(command CreateCommand) (*Investment, error)
}
