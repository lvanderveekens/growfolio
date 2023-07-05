package investment

type Repository interface {
	Create(command CreateCommand) (*Investment, error)
}
