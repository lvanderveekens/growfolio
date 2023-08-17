package investment

type Repository interface {
	Find() ([]Investment, error)
	FindByID(id string) (*Investment, error)
	Create(c CreateCommand) (*Investment, error)

	FindUpdates(investmentID *string) ([]Update, error)
	CreateUpdate(c CreateUpdateCommand) (*Update, error)
	DeleteUpdateByID(id string) error
}
