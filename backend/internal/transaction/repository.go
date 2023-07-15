package transaction

type Repository interface {
	Find() ([]Transaction, error)
	Create(command CreateCommand) (*Transaction, error)
}
