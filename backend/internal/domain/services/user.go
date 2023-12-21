package services

import (
	"fmt"
	"growfolio/internal/domain"
	"time"
)

const (
	MaxInvestmentsForBasicAccount = 2
)

type UserRepository interface {
	FindByID(id string) (domain.User, error)
	FindByEmail(email string) (domain.User, error)
	FindByStripeCustomerID(stripeCustomerID string) (domain.User, error)
	FindDemoUsersCreatedBefore(createdBefore time.Time) ([]domain.User, error)

	Create(user domain.User) (domain.User, error)
	Update(user domain.User) (domain.User, error)
	DeleteByID(id string) error
}

type UserService struct {
	userRepository       UserRepository
	investmentRepository InvestmentRepository
	eventPublisher       EventPublisher
}

func NewUserService(
	userRepository UserRepository,
	investmentRepository InvestmentRepository,
	eventPublisher EventPublisher,
) UserService {
	return UserService{
		userRepository:       userRepository,
		investmentRepository: investmentRepository,
		eventPublisher:       eventPublisher,
	}
}

func (s UserService) FindDemoUsersCreatedBefore(createdBefore time.Time) ([]domain.User, error) {
	return s.userRepository.FindDemoUsersCreatedBefore(createdBefore)
}

func (s UserService) DeleteByID(id string) error {
	return s.userRepository.DeleteByID(id)
}

func (s UserService) FindByEmail(email string) (domain.User, error) {
	return s.userRepository.FindByEmail(email)
}

func (s UserService) FindByStripeCustomerID(stripeCustomerID string) (domain.User, error) {
	return s.userRepository.FindByStripeCustomerID(stripeCustomerID)
}

func (s UserService) FindByID(id string) (domain.User, error) {
	return s.userRepository.FindByID(id)
}

func (s UserService) Create(user domain.User) (domain.User, error) {
	user, err := s.userRepository.Create(user)
	if err != nil {
		return domain.User{}, fmt.Errorf("failed to create user: %w", err)
	}

	s.eventPublisher.Publish(domain.NewUserCreatedEvent(user))

	return user, nil
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

func (s UserService) DowngradeToBasic(user domain.User) error {
	user.AccountType = domain.AccountTypeBasic
	user.StripeCustomerID = nil

	_, err := s.userRepository.Update(user)
	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	investments, err := s.investmentRepository.FindByUserID(user.ID)
	if err != nil {
		return fmt.Errorf("failed to find investments: %w", err)
	}

	if len(investments) > MaxInvestmentsForBasicAccount {
		for i := MaxInvestmentsForBasicAccount; i < len(investments); i++ {
			err := s.investmentRepository.UpdateLocked(investments[i].ID, true)
			if err != nil {
				return fmt.Errorf("failed to update investment: %w", err)
			}
		}
	}

	return nil
}
