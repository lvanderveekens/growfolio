package services

import (
	"fmt"
	"growfolio/internal/domain"
	"time"

	"github.com/pkg/errors"
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
	investmentUpdateService InvestmentUpdateService
}

func NewInvestmentService(
	investmentRepository InvestmentRepository,
	investmentUpdateService InvestmentUpdateService,
) InvestmentService {
	return InvestmentService{
		investmentRepository:    investmentRepository,
		investmentUpdateService: investmentUpdateService,
	}
}

func (s InvestmentService) UpdateLocked(id string, locked bool) error {
	return s.investmentRepository.UpdateLocked(id, locked)
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

	if command.InitialUpdate != nil {
		initialUpdate := command.InitialUpdate

		date := time.Now()
		if initialUpdate.Date != nil {
			date = *initialUpdate.Date
		}

		_, err = s.investmentUpdateService.Create(domain.NewCreateInvestmentUpdateCommand(
			investment,
			date,
			initialUpdate.Deposit,
			nil,
			initialUpdate.Value,
		))
		if err != nil {
			return domain.Investment{}, fmt.Errorf("failed to create update: %w", err)
		}
	}

	return investment, nil
}

func (s InvestmentService) DeleteByID(id string) error {
	err := s.investmentUpdateService.DeleteByInvestmentID(id)
	if err != nil {
		return errors.Wrapf(err, "failed to delete updates by investment id %s", id)
	}

	return s.investmentRepository.DeleteByID(id)
}
