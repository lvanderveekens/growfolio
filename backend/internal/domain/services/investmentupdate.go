package services

import (
	"fmt"
	"growfolio/internal/domain"
	"sort"
	"time"
)

type InvestmentUpdateRepository interface {
	FindByID(id string) (domain.InvestmentUpdate, error)
	FindByInvestmentID(investmentID string) ([]domain.InvestmentUpdate, error)
	Find(query domain.FindInvestmentUpdateQuery) ([]domain.InvestmentUpdate, error)
	FindLastByInvestmentIDAndDateLessThanEqual(investmentID string, date time.Time) (domain.InvestmentUpdate, error)

	Create(command domain.CreateInvestmentUpdateCommand) (domain.InvestmentUpdate, error)
	DeleteByInvestmentID(investmentID string) error
	DeleteByID(id string) error
}

type InvestmentUpdateService struct {
	investmentUpdateRepository InvestmentUpdateRepository
}

func NewInvestmentUpdateService(
	investmentUpdateRepository InvestmentUpdateRepository,
) InvestmentUpdateService {
	return InvestmentUpdateService{
		investmentUpdateRepository: investmentUpdateRepository,
	}
}

func (s InvestmentUpdateService) Find(query domain.FindInvestmentUpdateQuery) ([]domain.InvestmentUpdate, error) {
	updates, err := s.investmentUpdateRepository.Find(query)
	if err != nil {
		return []domain.InvestmentUpdate{}, fmt.Errorf("failed to find updates: %w", err)
	}

	if query.DateFrom != nil {
		for _, investmentID := range query.InvestmentIDs {
			lastUpdate, err := s.investmentUpdateRepository.FindLastByInvestmentIDAndDateLessThanEqual(
				investmentID,
				*query.DateFrom,
			)
			if err != nil {
				if err != domain.ErrInvestmentUpdateNotFound {
					return []domain.InvestmentUpdate{}, fmt.Errorf("failed to find last update: %w", err)
				}
			}
			if err != domain.ErrInvestmentUpdateNotFound {
				// add fake update
				updates = append(updates, domain.NewInvestmentUpdate(
					lastUpdate.ID,
					lastUpdate.InvestmentID,
					*query.DateFrom,
					nil,
					nil,
					lastUpdate.Cost,
					lastUpdate.Value,
				))
			}
		}
	}

	sort.Slice(updates, func(a, b int) bool { return updates[a].Date.Before(updates[b].Date) })

	return updates, nil
}

func (s InvestmentUpdateService) FindByInvestmentID(investmentID string) ([]domain.InvestmentUpdate, error) {
	return s.investmentUpdateRepository.FindByInvestmentID(investmentID)
}

func (s InvestmentUpdateService) FindByID(id string) (domain.InvestmentUpdate, error) {
	return s.investmentUpdateRepository.FindByID(id)
}

func (s InvestmentUpdateService) FindLastByInvestmentIDAndDateLessThanEqual(
	investmentID string,
	date time.Time,
) (domain.InvestmentUpdate, error) {
	return s.investmentUpdateRepository.FindLastByInvestmentIDAndDateLessThanEqual(investmentID, date)
}

func (s InvestmentUpdateService) Create(command domain.CreateInvestmentUpdateCommand) (domain.InvestmentUpdate, error) {
	if command.Investment.Locked {
		return domain.InvestmentUpdate{}, domain.ErrInvestmentIsLocked
	}

	return s.investmentUpdateRepository.Create(command)
}

func (s InvestmentUpdateService) DeleteByInvestmentID(investmentID string) error {
	return s.investmentUpdateRepository.DeleteByInvestmentID(investmentID)
}

func (s InvestmentUpdateService) DeleteByID(id string) error {
	return s.investmentUpdateRepository.DeleteByID(id)
}
