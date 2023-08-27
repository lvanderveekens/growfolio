package services

import "growfolio/domain"

type TransactionRepository interface {
	Find(investmentID *string) ([]domain.Transaction, error)
	Create(command domain.CreateTransactionCommand) (*domain.Transaction, error)
	DeleteByID(id string) error
}
