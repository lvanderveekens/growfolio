package postgres

import (
	"database/sql"
	"errors"
	"fmt"
	"growfolio/domain"
	"log/slog"
	"time"

	sq "github.com/Masterminds/squirrel"
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
}

func (i Investment) toDomainInvestment() domain.Investment {
	return domain.NewInvestment(i.ID.String(), i.Type, i.Name, i.UserID)
}

type InvestmentRepository struct {
	db *sqlx.DB
}

func NewInvestmentRepository(db *sqlx.DB) InvestmentRepository {
	return InvestmentRepository{db: db}
}

func (r InvestmentRepository) FindByUserID(userID string) ([]domain.Investment, error) {
	entities := []Investment{}
	err := r.db.Select(&entities, "SELECT * FROM investment WHERE user_id=$1 ORDER BY created_at ASC", userID)
	if err != nil {
		return nil, fmt.Errorf("failed to select investments: %w", err)
	}

	investments := make([]domain.Investment, 0)
	for _, entity := range entities {
		investments = append(investments, entity.toDomainInvestment())
	}

	return investments, nil
}

func (r InvestmentRepository) DeleteUpdatesByInvestmentID(investmentID string) error {
	_, err := uuid.Parse(investmentID)
	if err != nil {
		return nil
	}

	_, err = r.db.Exec("DELETE FROM investment_update WHERE investment_id=$1", investmentID)
	return err
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

	return entity.toDomainInvestment(), nil
}

func (r InvestmentRepository) FindUpdateByID(id string) (domain.InvestmentUpdate, error) {
	_, err := uuid.Parse(id)
	if err != nil {
		fmt.Println("error: id is not a uuid: " + err.Error())
		return domain.InvestmentUpdate{}, domain.ErrInvestmentUpdateNotFound
	}

	entity := InvestmentUpdate{}
	err = r.db.Get(&entity, "SELECT * FROM investment_update WHERE id=$1", id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return domain.InvestmentUpdate{}, domain.ErrInvestmentUpdateNotFound
		}
		return domain.InvestmentUpdate{}, fmt.Errorf("failed to select investment update: %w", err)
	}

	return entity.toDomainInvestmentUpdate(), nil
}

func (r InvestmentRepository) FindUpdates(findQuery domain.FindInvestmentUpdateQuery) ([]domain.InvestmentUpdate, error) {
	psql := sq.StatementBuilder.PlaceholderFormat(sq.Dollar)
	queryBuilder := psql.Select("*").From("investment_update")

	if findQuery.InvestmentIDs != nil {
		queryBuilder = queryBuilder.Where(sq.Eq{"investment_id": *findQuery.InvestmentIDs})
	}
	if findQuery.DateFrom != nil {
		queryBuilder = queryBuilder.Where(sq.Expr("date >= ?", *findQuery.DateFrom))
	}

	queryBuilder = queryBuilder.OrderBy("date ASC")
	query, args, err := queryBuilder.ToSql()
	if err != nil {
		return nil, fmt.Errorf("failed to build SQL: %w", err)
	}
	slog.Info("query: " + query)

	entities := []InvestmentUpdate{}
	err = r.db.Select(&entities, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to select investment updates: %w", err)
	}

	updates := make([]domain.InvestmentUpdate, 0)
	for _, entity := range entities {
		updates = append(updates, entity.toDomainInvestmentUpdate())
	}

	return updates, nil
}

func (r InvestmentRepository) DeleteUpdateByID(id string) error {
	_, err := uuid.Parse(id)
	if err != nil {
		return nil
	}

	_, err = r.db.Exec("DELETE FROM investment_update WHERE id=$1", id)
	if err != nil {
		return fmt.Errorf("failed to delete investment update: %w", err)
	}

	return nil
}

func (r InvestmentRepository) Create(c domain.CreateInvestmentCommand) (domain.Investment, error) {
	id, err := uuid.NewRandom()
	if err != nil {
		return domain.Investment{}, fmt.Errorf("failed to generate new UUID: %w", err)
	}

	var entity Investment
	err = r.db.QueryRowx(`
		INSERT INTO investment (id, "type", "name", user_id) 
		VALUES ($1, $2, $3, $4)
		RETURNING *
	`, id, c.Type, c.Name, c.UserID).StructScan(&entity)
	if err != nil {
		return domain.Investment{}, fmt.Errorf("failed to insert investment: %w", err)
	}

	return entity.toDomainInvestment(), nil
}

type InvestmentUpdate struct {
	ID           uuid.UUID
	CreatedAt    time.Time `db:"created_at"`
	UpdatedAt    time.Time `db:"updated_at"`
	Date         time.Time
	InvestmentID string `db:"investment_id"`
	Value        int64
}

func (i InvestmentUpdate) toDomainInvestmentUpdate() domain.InvestmentUpdate {
	return domain.NewInvestmentUpdate(i.ID.String(), i.Date, i.InvestmentID, i.Value)
}

func (r InvestmentRepository) CreateUpdate(c domain.CreateInvestmentUpdateCommand) (domain.InvestmentUpdate, error) {
	id, err := uuid.NewRandom()
	if err != nil {
		return domain.InvestmentUpdate{}, fmt.Errorf("failed to generate new UUID: %w", err)
	}

	var entity InvestmentUpdate
	err = r.db.QueryRowx(`
		INSERT INTO investment_update (id, investment_id, "date", "value") 
		VALUES ($1, $2, $3, $4)
		RETURNING *
	`, id, c.Investment.ID, c.Date, c.Value).StructScan(&entity)
	if err != nil {
		return domain.InvestmentUpdate{}, fmt.Errorf("failed to insert investment update: %w", err)
	}

	return entity.toDomainInvestmentUpdate(), nil
}
