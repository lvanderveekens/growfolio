package services

import (
	"fmt"
	"growfolio/domain"
)

type InvestmentRepository interface {
	FindByUserID(userID string) ([]domain.Investment, error)
	FindByID(id string) (domain.Investment, error)

	Create(command domain.CreateInvestmentCommand) (domain.Investment, error)
	DeleteByID(id string) error
	UpdateLocked(id string, locked bool) error
}

type InvestmentService struct {
	investmentRepository InvestmentRepository
}

func NewInvestmentService(investmentRepository InvestmentRepository) InvestmentService {
	return InvestmentService{
		investmentRepository: investmentRepository,
	}
}

func (s InvestmentService) FindByUserID(userID string) ([]domain.Investment, error) {
	return s.investmentRepository.FindByUserID(userID)
}

func (s InvestmentService) FindByID(id string) (domain.Investment, error) {
	return s.investmentRepository.FindByID(id)
}

func (s InvestmentService) Create(command domain.CreateInvestmentCommand) (domain.Investment, error) {
	investments, err := s.investmentRepository.FindByUserID(command.User.ID)
	if err != nil {
		return domain.Investment{}, fmt.Errorf("failed to find investments: %w", err)
	}
	if command.User.AccountType == domain.AccountTypeBasic && len(investments) >= 2 {
		return domain.Investment{}, domain.ErrMaxInvestmentsReached
	}

	return s.investmentRepository.Create(command)
}

func (s InvestmentService) DeleteByID(id string) error {
	return s.investmentRepository.DeleteByID(id)
}
