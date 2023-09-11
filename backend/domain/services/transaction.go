package services

import (
	"fmt"
	"growfolio/domain"
	"growfolio/slices"
	"log/slog"
)

type TransactionRepository interface {
	FindByID(id string) (domain.Transaction, error)
	Find(investmentID *string) ([]domain.Transaction, error)
	Create(command domain.CreateTransactionCommand) (domain.Transaction, error)
	DeleteByID(id string) error
}

type TransactionService struct {
	transactionRepository TransactionRepository
	investmentRepository  InvestmentRepository
}

func NewTransactionService(
	transactionRepository TransactionRepository,
	investmentRepository InvestmentRepository,
) TransactionService {
	return TransactionService{
		transactionRepository: transactionRepository,
		investmentRepository:  investmentRepository,
	}
}

func (s TransactionService) FindWithInvestment(investmentID *string) ([]domain.TransactionWithInvestment, error) {
	transactions, err := s.transactionRepository.Find(investmentID)
	if err != nil {
		return []domain.TransactionWithInvestment{}, fmt.Errorf("failed to find transactions: %w", err)
	}

	investmentIDs := slices.Deduplicate(slices.Map(transactions, func(t domain.Transaction) string {
		return t.InvestmentID
	}))

	// TODO: use FindByIDs
	investments := slices.MapNotNull(investmentIDs, func(id string) *domain.Investment {
		investment, err := s.investmentRepository.FindByID(id)
		if err != nil {
			slog.Error("failed to find investment", "id", id, "err", err.Error())
			return nil
		}
		return &investment
	})

	investmentsByID := slices.AssociateBy(investments, func(i domain.Investment) string {
		return i.ID
	})

	return slices.Map(transactions, func(t domain.Transaction) domain.TransactionWithInvestment {
		investment := investmentsByID[t.InvestmentID]
		return domain.NewTransactionWithInvestment(t, investment)
	}), nil
}
