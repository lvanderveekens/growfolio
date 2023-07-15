package postgres

import (
	"fmt"
	"growfolio/internal/investment"
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
	return investment.New(i.ID, i.Type, i.Name)
}

type InvestmentRepository struct {
	db *sqlx.DB
}

func NewInvestmentRepository(db *sqlx.DB) *InvestmentRepository {
	return &InvestmentRepository{db: db}
}

func (r *InvestmentRepository) Find() ([]investment.Investment, error) {
	entities := []Investment{}
	err := r.db.Select(&entities, "SELECT * FROM investment")

	if err != nil {
		return nil, fmt.Errorf("failed to select investments: %w", err)
	}

	investments := make([]investment.Investment, 0)
	for _, entity := range entities {
		investments = append(investments, *entity.toDomainObject())
	}

	return investments, nil
}

func (r *InvestmentRepository) Create(cmd investment.CreateCommand) (*investment.Investment, error) {
	id, err := uuid.NewRandom()
	if err != nil {
		return nil, fmt.Errorf("failed to generate new UUID: %w", err)
	}

	var entity Investment
	err = r.db.QueryRowx(`
		INSERT INTO investment (id, "type", "name") 
		VALUES ($1, $2, $3)
		RETURNING *
	`, id, cmd.Type, cmd.Name).StructScan(&entity)
	if err != nil {
		return nil, fmt.Errorf("failed to insert into table: %w", err)
	}

	return entity.toDomainObject(), nil
}
