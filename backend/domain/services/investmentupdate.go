package services

import (
	"fmt"
	"growfolio/domain"
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

func (s *InvestmentUpdateService) FindWithInvestment(investmentID *string) ([]domain.InvestmentUpdateWithInvestment, error) {
	updates, err := s.investmentRepository.FindUpdates(investmentID)
	if err != nil {
		return []domain.InvestmentUpdateWithInvestment{}, fmt.Errorf("failed to find updates: %w", err)
	}

	investmentIDs := deduplicate(mapSlice(updates, func(u domain.InvestmentUpdate) string {
		return u.InvestmentID
	}))

	// TODO: use FindByIDs
	investments := mapSliceNotNull(investmentIDs, func(id string) *domain.Investment {
		investment, err := s.investmentRepository.FindByID(id)
		if err != nil {
			slog.Error("failed to find investment", "id", id, "err", err.Error())
			return nil
		}
		return &investment
	})

	investmentsByID := associateSliceBy(investments, func(i domain.Investment) string { return i.ID })

	return mapSlice(updates, func(update domain.InvestmentUpdate) domain.InvestmentUpdateWithInvestment {
		investment := investmentsByID[update.InvestmentID]
		return domain.NewInvestmentUpdateWithInvestment(update, investment)
	}), nil
}

// TODO: move to separate package
func mapSlice[T any, M any](a []T, f func(T) M) []M {
	n := make([]M, len(a))
	for i, e := range a {
		n[i] = f(e)
	}
	return n
}

// TODO: move to separate package
func mapSliceNotNull[T any, M any](a []T, f func(T) *M) []M {
	n := make([]M, len(a))
	for i, e := range a {
		nullable := f(e)
		if nullable != nil {
			n[i] = *nullable
		}
	}
	return n
}

// TODO: move to separate package
func associateSliceBy[T any, V comparable](src []T, key func(T) V) map[V]T {
	var result = make(map[V]T)
	for _, v := range src {
		result[key(v)] = v
	}
	return result
}

// TODO: move to separate package
func deduplicate[T comparable](input []T) []T {
	n := make([]T, 0)
	m := make(map[T]bool)

	for _, val := range input {
		if _, ok := m[val]; !ok {
			m[val] = true
			n = append(n, val)
		}
	}

	return n
}
