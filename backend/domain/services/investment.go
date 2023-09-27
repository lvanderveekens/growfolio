package services

import (
	"growfolio/domain"
)

type InvestmentRepository interface {
	FindByUserID(userID string) ([]domain.Investment, error)
	FindByID(id string) (domain.Investment, error)

	Create(command domain.CreateInvestmentCommand) (domain.Investment, error)
	DeleteByID(id string) error
}
