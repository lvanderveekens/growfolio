package services

import "growfolio/domain"

type InvestmentRepository interface {
	FindByUserID(userID string) ([]domain.Investment, error)
	FindByID(id string) (domain.Investment, error)
	Create(command domain.CreateInvestmentCommand) (domain.Investment, error)
	DeleteByID(id string) error

	FindUpdates(investmentID *string) ([]domain.InvestmentUpdate, error)
	FindUpdateByID(id string) (domain.InvestmentUpdate, error)
	FindUpdatesByInvestmentIDs(investmentIDs []string) ([]domain.InvestmentUpdate, error)
	CreateUpdate(command domain.CreateInvestmentUpdateCommand) (domain.InvestmentUpdate, error)
	DeleteUpdatesByInvestmentID(investmentID string) error
	DeleteUpdateByID(id string) error
}
