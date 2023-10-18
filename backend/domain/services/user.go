package services

import (
	"fmt"
	"growfolio/domain"
)

type UserRepository interface {
	FindByID(id string) (domain.User, error)
	FindByEmail(email string) (domain.User, error)

	Create(user domain.User) (domain.User, error)
	Update(user domain.User) (domain.User, error)
}

type UserService struct {
	userRepository       UserRepository
	investmentRepository InvestmentRepository
}

func NewUserService(userRepository UserRepository, investmentRepository InvestmentRepository) UserService {
	return UserService{
		userRepository:       userRepository,
		investmentRepository: investmentRepository,
	}
}

func (s UserService) FindByEmail(email string) (domain.User, error) {
	return s.userRepository.FindByEmail(email)
}

func (s UserService) FindByID(id string) (domain.User, error) {
	return s.userRepository.FindByID(id)
}

func (s UserService) UpgradeToPremium(user domain.User, stripeCustomerID string) error {
	user.AccountType = domain.AccountTypePremium
	user.StripeCustomerID = &stripeCustomerID

	_, err := s.userRepository.Update(user)
	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	investments, err := s.investmentRepository.FindByUserID(user.ID)
	if err != nil {
		return fmt.Errorf("failed to find investments: %w", err)
	}

	for _, investment := range investments {
		if investment.Locked {
			err := s.investmentRepository.UpdateLocked(investment.ID, false)
			if err != nil {
				return fmt.Errorf("failed to update investment: %w", err)
			}
		}
	}

	return nil
}
