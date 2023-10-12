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

type TransactionService struct {
	transactionRepository TransactionRepository
}

func NewTransactionService(transactionRepository TransactionRepository) TransactionService {
	return TransactionService{
		transactionRepository: transactionRepository,
	}
}

func (s TransactionService) FindByID(id string) (domain.Transaction, error) {
	return s.transactionRepository.FindByID(id)
}

func (s TransactionService) Find(query domain.FindTransactionQuery) ([]domain.Transaction, error) {
	return s.transactionRepository.Find(query)
}

func (s TransactionService) Create(command domain.CreateTransactionCommand) (domain.Transaction, error) {
	if command.Investment.Locked {
		return domain.Transaction{}, domain.ErrInvestmentIsLocked
	}

	return s.transactionRepository.Create(command)
}

func (s TransactionService) DeleteByID(id string) error {
	return s.transactionRepository.DeleteByID(id)
}

func (s TransactionService) DeleteByInvestmentID(investmentID string) error {
	return s.transactionRepository.DeleteByInvestmentID(investmentID)
}
