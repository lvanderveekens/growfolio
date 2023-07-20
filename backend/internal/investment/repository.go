package investment

type Repository interface {
	Find() ([]Investment, error)
	FindByID(id string) (*Investment, error)
	Create(c CreateCommand) (*Investment, error)

	CreateUpdate(c CreateUpdateCommand) (*Update, error)
	FindUpdates() ([]Update, error)
}
