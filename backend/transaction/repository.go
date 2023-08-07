package transaction

type Repository interface {
	Find(investmentId *string) ([]Transaction, error)
	Create(command CreateCommand) (*Transaction, error)
}
