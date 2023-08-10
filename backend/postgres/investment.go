package postgres

import (
	"database/sql"
	"errors"
	"fmt"
	"growfolio/investment"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type Investment struct {
	ID        uuid.UUID
	CreatedAt time.Time `db:"created_at"`
	UpdatedAt time.Time `db:"updated_at"`
	Type      investment.Type
	Name      string
}

func (i *Investment) toDomainObject() *investment.Investment {
	return investment.New(i.ID.String(), i.Type, i.Name)
}

type InvestmentRepository struct {
	db *sqlx.DB
}

func NewInvestmentRepository(db *sqlx.DB) *InvestmentRepository {
	return &InvestmentRepository{db: db}
}

func (r *InvestmentRepository) Find() ([]investment.Investment, error) {
	entities := []Investment{}
	err := r.db.Select(&entities, "SELECT * FROM investment ORDER BY created_at ASC")
	if err != nil {
		return nil, fmt.Errorf("failed to select investments: %w", err)
	}

	investments := make([]investment.Investment, 0)
	for _, entity := range entities {
		investments = append(investments, *entity.toDomainObject())
	}

	return investments, nil
}

func (r *InvestmentRepository) FindByID(id string) (*investment.Investment, error) {
	_, err := uuid.Parse(id)
	if err != nil {
		fmt.Println("error: id is not a uuid: " + err.Error())
		return nil, investment.ErrNotFound
	}

	entity := Investment{}
	err = r.db.Get(&entity, "SELECT * FROM investment WHERE id=$1", id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, investment.ErrNotFound
		}
		return nil, fmt.Errorf("failed to select investment: %w", err)
	}

	return entity.toDomainObject(), nil
}

func (r *InvestmentRepository) Create(c investment.CreateCommand) (*investment.Investment, error) {
	id, err := uuid.NewRandom()
	if err != nil {
		return nil, fmt.Errorf("failed to generate new UUID: %w", err)
	}

	var entity Investment
	err = r.db.QueryRowx(`
		INSERT INTO investment (id, "type", "name") 
		VALUES ($1, $2, $3)
		RETURNING *
	`, id, c.Type, c.Name).StructScan(&entity)
	if err != nil {
		return nil, fmt.Errorf("failed to insert investment: %w", err)
	}

	return entity.toDomainObject(), nil
}

type InvestmentUpdate struct {
	ID           uuid.UUID
	CreatedAt    time.Time `db:"created_at"`
	UpdatedAt    time.Time `db:"updated_at"`
	Date         time.Time
	InvestmentID string `db:"investment_id"`
	Value        int64
}

func (i *InvestmentUpdate) toDomainObject() *investment.Update {
	return investment.NewUpdate(i.ID.String(), i.Date, i.InvestmentID, i.Value)
}

func (r *InvestmentRepository) CreateUpdate(c investment.CreateUpdateCommand) (*investment.Update, error) {
	id, err := uuid.NewRandom()
	if err != nil {
		return nil, fmt.Errorf("failed to generate new UUID: %w", err)
	}

	var entity InvestmentUpdate
	err = r.db.QueryRowx(`
		INSERT INTO investment_update (id, investment_id, "date", "value") 
		VALUES ($1, $2, $3, $4)
		RETURNING *
	`, id, c.Investment.ID, c.Date, c.Value).StructScan(&entity)
	if err != nil {
		return nil, fmt.Errorf("failed to insert investment update: %w", err)
	}

	return entity.toDomainObject(), nil
}

func (r *InvestmentRepository) FindUpdates(investmentID *string) ([]investment.Update, error) {
	query := "SELECT * FROM investment_update"
	args := make([]any, 0)
	if investmentID != nil {
		query += " WHERE investment_id = $1"
		args = append(args, *investmentID)
	}
	query += " ORDER BY date ASC"

	entities := []InvestmentUpdate{}
	err := r.db.Select(&entities, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to select investment updates: %w", err)
	}

	updates := make([]investment.Update, 0)
	for _, entity := range entities {
		updates = append(updates, *entity.toDomainObject())
	}

	return updates, nil
}
