package services

import (
	"fmt"
	"growfolio/domain"
	"growfolio/slices"
	"log/slog"
)

type InvestmentUpdateService struct {
	investmentRepository InvestmentRepository
}

func NewInvestmentUpdateService(investmentRepository InvestmentRepository) InvestmentUpdateService {
	return InvestmentUpdateService{
		investmentRepository: investmentRepository,
	}
}

func (s InvestmentUpdateService) FindWithInvestment(investmentID *string) ([]domain.InvestmentUpdateWithInvestment, error) {
	updates, err := s.investmentRepository.FindUpdates(investmentID)
	if err != nil {
		return []domain.InvestmentUpdateWithInvestment{}, fmt.Errorf("failed to find updates: %w", err)
	}

	investmentIDs := slices.Deduplicate(slices.Map(updates, func(u domain.InvestmentUpdate) string {
		return u.InvestmentID
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

	return slices.Map(updates, func(update domain.InvestmentUpdate) domain.InvestmentUpdateWithInvestment {
		investment := investmentsByID[update.InvestmentID]
		return domain.NewInvestmentUpdateWithInvestment(update, investment)
	}), nil
}
