package services

import (
	"fmt"
	"growfolio/domain"
	"time"
)

type InvestmentRepository interface {
	FindByUserID(userID string) ([]domain.Investment, error)
	FindByID(id string) (domain.Investment, error)

	Create(command domain.CreateInvestmentCommand) (domain.Investment, error)
	DeleteByID(id string) error
	UpdateLocked(id string, locked bool) error
}

type InvestmentService struct {
	investmentRepository    InvestmentRepository
	transactionService      TransactionService
	investmentUpdateService InvestmentUpdateService
}

func NewInvestmentService(
	investmentRepository InvestmentRepository,
	transactionService TransactionService,
	investmentUpdateService InvestmentUpdateService,
) InvestmentService {
	return InvestmentService{
		investmentRepository:    investmentRepository,
		transactionService:      transactionService,
		investmentUpdateService: investmentUpdateService,
	}
}

func (s InvestmentService) FindByUserID(userID string) ([]domain.Investment, error) {
	return s.investmentRepository.FindByUserID(userID)
}

func (s InvestmentService) FindByID(id string) (domain.Investment, error) {
	return s.investmentRepository.FindByID(id)
}

// TODO: Move part of this to the infra layer and use a DB transaction
func (s InvestmentService) Create(command domain.CreateInvestmentCommand) (domain.Investment, error) {
	investments, err := s.investmentRepository.FindByUserID(command.User.ID)
	if err != nil {
		return domain.Investment{}, fmt.Errorf("failed to find investments: %w", err)
	}
	if command.User.AccountType == domain.AccountTypeBasic && len(investments) >= 2 {
		return domain.Investment{}, domain.ErrMaxInvestmentsReached
	}

	investment, err := s.investmentRepository.Create(command)
	if err != nil {
		return domain.Investment{}, fmt.Errorf("failed to create investment: %w", err)
	}

	var initialDate time.Time
	if command.InitialDate != nil {
		initialDate = *command.InitialDate
	} else {
		initialDate = time.Now()
	}

	if command.InitialValue != nil {
		_, err := s.investmentUpdateService.Create(domain.NewCreateInvestmentUpdateCommand(
			initialDate,
			investment,
			*command.InitialValue,
		))
		if err != nil {
			return domain.Investment{}, fmt.Errorf("failed to create update: %w", err)
		}
	}
	if command.InitialCost != nil {
		_, err := s.transactionService.Create(domain.NewCreateTransactionCommand(
			initialDate,
			domain.TransactionTypeBuy,
			investment,
			*command.InitialCost,
		))
		if err != nil {
			return domain.Investment{}, fmt.Errorf("failed to create transaction: %w", err)
		}
	}

	return investment, nil
}

func (s InvestmentService) DeleteByID(id string) error {
	return s.investmentRepository.DeleteByID(id)
}
