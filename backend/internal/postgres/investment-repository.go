package postgres

import (
	"database/sql"
	"fmt"
	"growfolio/internal/domain"
	"time"

	"errors"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type Investment struct {
	ID        uuid.UUID             `db:"id"`
	CreatedAt time.Time             `db:"created_at"`
	UpdatedAt time.Time             `db:"updated_at"`
	Type      domain.InvestmentType `db:"type"`
	Name      string                `db:"name"`
	UserID    string                `db:"user_id"`
	Locked    bool                  `db:"locked"`
}

type InvestmentRepository struct {
	db                         *sqlx.DB
	investmentUpdateRepository InvestmentUpdateRepository
}

func NewInvestmentRepository(
	db *sqlx.DB,
	investmentUpdateRepository InvestmentUpdateRepository,
) InvestmentRepository {
	return InvestmentRepository{
		db:                         db,
		investmentUpdateRepository: investmentUpdateRepository,
	}
}

func (r InvestmentRepository) FindByUserID(userID string) ([]domain.Investment, error) {
	entities := []Investment{}
	err := r.db.Select(&entities, "SELECT * FROM investment WHERE user_id=$1 ORDER BY created_at ASC", userID)
	if err != nil {
		return nil, fmt.Errorf("failed to select investments: %w", err)
	}

	investments := make([]domain.Investment, 0)
	for _, entity := range entities {
		investment, err := r.toDomainInvestment(entity)
		if err != nil {
			return []domain.Investment{}, fmt.Errorf("failed to map entity to investment: %w", err)
		}
		investments = append(investments, investment)
	}

	return investments, nil
}

func (r InvestmentRepository) DeleteByID(id string) error {
	_, err := uuid.Parse(id)
	if err != nil {
		return nil
	}

	_, err = r.db.Exec("DELETE FROM investment WHERE id=$1", id)
	return err
}

func (r InvestmentRepository) FindByID(id string) (domain.Investment, error) {
	_, err := uuid.Parse(id)
	if err != nil {
		fmt.Println("error: id is not a uuid: " + err.Error())
		return domain.Investment{}, domain.ErrInvestmentNotFound
	}

	entity := Investment{}
	err = r.db.Get(&entity, "SELECT * FROM investment WHERE id=$1", id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return domain.Investment{}, domain.ErrInvestmentNotFound
		}
		return domain.Investment{}, fmt.Errorf("failed to select investment: %w", err)
	}

	return r.toDomainInvestment(entity)
}

func (r InvestmentRepository) Create(c domain.CreateInvestmentCommand) (domain.Investment, error) {
	id, err := uuid.NewRandom()
	if err != nil {
		return domain.Investment{}, fmt.Errorf("failed to generate new UUID: %w", err)
	}

	var entity Investment
	err = r.db.QueryRowx(`
		INSERT INTO investment (id, "type", "name", user_id, locked) 
		VALUES ($1, $2, $3, $4, $5)
		RETURNING *
	`, id, c.Type, c.Name, c.User.ID, c.Locked).StructScan(&entity)
	if err != nil {
		return domain.Investment{}, fmt.Errorf("failed to insert investment: %w", err)
	}

	return r.toDomainInvestment(entity)
}

func (r InvestmentRepository) UpdateLocked(id string, locked bool) error {
	var entity Investment
	err := r.db.QueryRowx(`
		UPDATE investment
		SET locked = $2
		WHERE id = $1
		RETURNING *;
	`, id, locked).StructScan(&entity)
	return err
}

func (r InvestmentRepository) toDomainInvestment(i Investment) (domain.Investment, error) {
	lastUpdate, err := r.findLastUpdate(i)
	if err != nil {
		return domain.Investment{}, fmt.Errorf("failed to find last update: %w", err)
	}

	return domain.NewInvestment(i.ID.String(), i.Type, i.Name, i.UserID, i.Locked, lastUpdate), nil
}

func (r InvestmentRepository) findLastUpdate(i Investment) (*domain.InvestmentUpdate, error) {
	lastUpdate, err := r.investmentUpdateRepository.FindLastByInvestmentID(i.ID.String())
	if err != nil {
		if errors.Is(err, domain.ErrInvestmentUpdateNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &lastUpdate, nil
}
