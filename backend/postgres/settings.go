package postgres

import (
	"database/sql"
	"errors"
	"fmt"
	"growfolio/domain"
	"time"

	"github.com/jmoiron/sqlx"
)

type Settings struct {
	UserID    string    `db:"user_id"`
	CreatedAt time.Time `db:"created_at"`
	UpdatedAt time.Time `db:"updated_at"`
	Currency  string    `db:"currency"`
}

func (s Settings) toDomainSettings() domain.Settings {
	return domain.NewSettings(s.UserID, domain.Currency(s.Currency))
}

type SettingsRepository struct {
	db *sqlx.DB
}

func NewSettingsRepository(db *sqlx.DB) SettingsRepository {
	return SettingsRepository{db: db}
}

func (r SettingsRepository) FindByUserID(userID string) (domain.Settings, error) {
	entity := Settings{}
	err := r.db.Get(&entity, `SELECT * FROM settings WHERE user_id=$1`, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return domain.Settings{}, domain.ErrSettingsNotFound
		}
		return domain.Settings{}, fmt.Errorf("failed to select settings: %w", err)
	}

	return entity.toDomainSettings(), nil
}

func (r SettingsRepository) Create(settings domain.Settings) (domain.Settings, error) {
	var entity Settings
	err := r.db.QueryRowx(`
		INSERT INTO settings (user_id, currency)
		VALUES ($1, $2)
		RETURNING *
	`, settings.UserID, settings.Currency).StructScan(&entity)
	if err != nil {
		return domain.Settings{}, fmt.Errorf("failed to insert settings: %w", err)
	}

	return entity.toDomainSettings(), nil
}

func (r SettingsRepository) Update(settings domain.Settings) (domain.Settings, error) {
	var entity Settings
	err := r.db.QueryRowx(`
		UPDATE settings
		SET currency = $1 
		WHERE user_id = $2
		RETURNING *;
	`, settings.Currency, settings.UserID).StructScan(&entity)
	if err != nil {
		return domain.Settings{}, fmt.Errorf("failed to update settings: %w", err)
	}

	return entity.toDomainSettings(), nil
}
