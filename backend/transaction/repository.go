package transaction

type Repository interface {
	Find(investmentID *string) ([]Transaction, error)
	Create(command CreateCommand) (*Transaction, error)
}
