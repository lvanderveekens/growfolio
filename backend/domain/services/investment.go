package services

import "growfolio/domain"

type InvestmentRepository interface {
	Find() ([]domain.Investment, error)
	FindByID(id string) (*domain.Investment, error)
	Create(c domain.CreateInvestmentCommand) (*domain.Investment, error)

	FindUpdates(investmentID *string) ([]domain.InvestmentUpdate, error)
	CreateUpdate(c domain.CreateInvestmentUpdateCommand) (*domain.InvestmentUpdate, error)
	DeleteUpdateByID(id string) error
}
