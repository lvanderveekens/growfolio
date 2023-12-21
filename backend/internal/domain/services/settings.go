package services

import (
	"fmt"
	"growfolio/internal/domain"
)

type SettingsRepository interface {
	FindByUserID(userID string) (domain.Settings, error)

	Create(settings domain.Settings) (domain.Settings, error)
	Update(settings domain.Settings) (domain.Settings, error)
	DeleteByUserID(userID string) error
}

type SettingsService struct {
	settingsRepository SettingsRepository
}

func NewSettingsService(settingsRepository SettingsRepository) SettingsService {
	return SettingsService{
		settingsRepository: settingsRepository,
	}
}

func (s SettingsService) FindByUserID(userID string) (domain.Settings, error) {
	settings, err := s.settingsRepository.FindByUserID(userID)
	if err != nil {
		if err == domain.ErrSettingsNotFound {
			return domain.DefaultSettings(userID), nil
		}
		return domain.Settings{}, fmt.Errorf("failed to create settings: %w", err)
	}

	return settings, nil
}

func (s SettingsService) Update(settings domain.Settings) (domain.Settings, error) {
	_, err := s.settingsRepository.FindByUserID(settings.UserID)
	if err != nil {
		if err == domain.ErrSettingsNotFound {
			return s.settingsRepository.Create(settings)
		}
		return domain.Settings{}, fmt.Errorf("failed to create settings: %w", err)
	}

	return s.settingsRepository.Update(settings)
}

func (s SettingsService) DeleteByUserID(userID string) error {
	return s.settingsRepository.DeleteByUserID(userID)
}
