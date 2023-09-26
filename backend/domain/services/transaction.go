package services

import (
	"growfolio/domain"
)

type TransactionRepository interface {
	FindByID(id string) (domain.Transaction, error)
	Find(query domain.FindTransactionQuery) ([]domain.Transaction, error)
	Create(command domain.CreateTransactionCommand) (domain.Transaction, error)
	DeleteByID(id string) error
	DeleteByInvestmentID(investmentID string) error
}
