package services

import "growfolio/domain"

type InvestmentRepository interface {
	FindByUserID(userID string) ([]domain.Investment, error)
	FindByID(id string) (domain.Investment, error)
	Create(command domain.CreateInvestmentCommand) (domain.Investment, error)

	FindUpdates(investmentID *string) ([]domain.InvestmentUpdate, error)
	FindUpdateByID(id string) (domain.InvestmentUpdate, error)
	CreateUpdate(command domain.CreateInvestmentUpdateCommand) (domain.InvestmentUpdate, error)
	DeleteUpdateByID(id string) error
}
