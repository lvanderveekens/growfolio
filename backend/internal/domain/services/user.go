package services

import (
	"fmt"
	"growfolio/internal/domain"
	"time"

	"github.com/pkg/errors"
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
	userRepository    UserRepository
	investmentService InvestmentService
	eventPublisher    EventPublisher
	settingsService   SettingsService
}

func NewUserService(
	userRepository UserRepository,
	investmentService InvestmentService,
	eventPublisher EventPublisher,
	settingsService SettingsService,
) UserService {
	return UserService{
		userRepository:    userRepository,
		investmentService: investmentService,
		eventPublisher:    eventPublisher,
		settingsService:   settingsService,
	}
}

func (s UserService) FindDemoUsersCreatedBefore(createdBefore time.Time) ([]domain.User, error) {
	return s.userRepository.FindDemoUsersCreatedBefore(createdBefore)
}

func (s UserService) DeleteByID(id string) error {
	investments, err := s.investmentService.FindByUserID(id)
	if err != nil {
		return errors.Wrapf(err, "failed to find investements by user id %s", id)
	}

	for _, investment := range investments {
		err := s.investmentService.DeleteByID(investment.ID)
		if err != nil {
			return errors.Wrapf(err, "failed to delete investment by id %s", investment.ID)
		}
	}

	err = s.settingsService.DeleteByUserID(id)
	if err != nil {
		return errors.Wrapf(err, "failed to delete settings by user id %s", id)
	}

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

	investments, err := s.investmentService.FindByUserID(user.ID)
	if err != nil {
		return fmt.Errorf("failed to find investments: %w", err)
	}

	for _, investment := range investments {
		if investment.Locked {
			err := s.investmentService.UpdateLocked(investment.ID, false)
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

	investments, err := s.investmentService.FindByUserID(user.ID)
	if err != nil {
		return fmt.Errorf("failed to find investments: %w", err)
	}

	if len(investments) > MaxInvestmentsForBasicAccount {
		for i := MaxInvestmentsForBasicAccount; i < len(investments); i++ {
			err := s.investmentService.UpdateLocked(investments[i].ID, true)
			if err != nil {
				return fmt.Errorf("failed to update investment: %w", err)
			}
		}
	}

	return nil
}
