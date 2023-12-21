package postgres

import (
	"database/sql"
	"fmt"
	"growfolio/internal/domain"
	"growfolio/internal/slices"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/pkg/errors"
)

type InvestmentUpdate struct {
	ID           uuid.UUID `db:"id"`
	CreatedAt    time.Time `db:"created_at"`
	UpdatedAt    time.Time `db:"updated_at"`
	InvestmentID string    `db:"investment_id"`
	Date         time.Time `db:"date"`
	Deposit      *int64    `db:"deposit"`
	Withdrawal   *int64    `db:"withdrawal"`
	Value        int64     `db:"value"`
}

func (u InvestmentUpdate) toDomainInvestmentUpdate(cost int64) domain.InvestmentUpdate {
	return domain.NewInvestmentUpdate(
		u.ID.String(),
		u.InvestmentID,
		u.Date,
		u.Deposit,
		u.Withdrawal,
		cost,
		u.Value,
	)
}

type InvestmentUpdateRepository struct {
	db *sqlx.DB
}

func NewInvestmentUpdateRepository(db *sqlx.DB) InvestmentUpdateRepository {
	return InvestmentUpdateRepository{db: db}
}

func (r InvestmentUpdateRepository) DeleteByInvestmentID(investmentID string) error {
	_, err := uuid.Parse(investmentID)
	if err != nil {
		return nil
	}

	_, err = r.db.Exec("DELETE FROM investment_update WHERE investment_id=$1", investmentID)
	return err
}

func (r InvestmentUpdateRepository) FindByID(id string) (domain.InvestmentUpdate, error) {
	_, err := uuid.Parse(id)
	if err != nil {
		fmt.Println("error: id is not a uuid: " + err.Error())
		return domain.InvestmentUpdate{}, domain.ErrInvestmentUpdateNotFound
	}

	entity := InvestmentUpdate{}
	err = r.db.Get(&entity, `
		SELECT *
		FROM investment_update 
		WHERE id = $1
	`, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return domain.InvestmentUpdate{}, domain.ErrInvestmentUpdateNotFound
		}
		return domain.InvestmentUpdate{}, fmt.Errorf("failed to select investment update: %w", err)
	}

	return r.toDomainInvestmentUpdate(entity)
}

func (r InvestmentUpdateRepository) FindByInvestmentID(investmentID string) ([]domain.InvestmentUpdate, error) {
	queryBuilder := sq.StatementBuilder.PlaceholderFormat(sq.Dollar).
		Select("*").
		From("investment_update").
		Where(sq.Eq{"investment_id": investmentID}).
		OrderBy("date DESC")

	query, args, err := queryBuilder.ToSql()
	if err != nil {
		return nil, fmt.Errorf("failed to build SQL: %w", err)
	}

	entities := []InvestmentUpdate{}
	err = r.db.Select(&entities, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to select investment updates: %w", err)
	}

	return r.toDomainInvestmentUpdates(entities)
}

func (r InvestmentUpdateRepository) Find(findQuery domain.FindInvestmentUpdateQuery) ([]domain.InvestmentUpdate, error) {
	psql := sq.StatementBuilder.PlaceholderFormat(sq.Dollar)
	queryBuilder := psql.
		Select("*").
		From("investment_update").
		Where(sq.Eq{"investment_id": findQuery.InvestmentIDs})

	if findQuery.DateFrom != nil {
		queryBuilder = queryBuilder.Where(sq.Expr("date >= ?", *findQuery.DateFrom))
	}

	queryBuilder = queryBuilder.OrderBy("date ASC")
	query, args, err := queryBuilder.ToSql()
	if err != nil {
		return nil, fmt.Errorf("failed to build SQL: %w", err)
	}

	entities := []InvestmentUpdate{}
	err = r.db.Select(&entities, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to select investment updates: %w", err)
	}

	return r.toDomainInvestmentUpdates(entities)
}

func (r InvestmentUpdateRepository) DeleteByID(id string) error {
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

func (r InvestmentUpdateRepository) Create(c domain.CreateInvestmentUpdateCommand) (domain.InvestmentUpdate, error) {
	id, err := uuid.NewRandom()
	if err != nil {
		return domain.InvestmentUpdate{}, fmt.Errorf("failed to generate new UUID: %w", err)
	}

	_, err = r.db.Exec(`
		INSERT INTO investment_update (id, investment_id, "date", deposit, withdrawal, "value") 
		VALUES ($1, $2, $3, $4, $5, $6)
	`, id, c.Investment.ID, c.Date, c.Deposit, c.Withdrawal, c.Value)
	if err != nil {
		return domain.InvestmentUpdate{}, fmt.Errorf("failed to insert investment update: %w", err)
	}

	return r.FindByID(id.String())
}

func (r InvestmentUpdateRepository) FindLastByInvestmentIDAndDateLessThanEqual(
	investmentID string,
	date time.Time,
) (domain.InvestmentUpdate, error) {
	dateString := date.Format("2006-01-02")

	entity := InvestmentUpdate{}
	err := r.db.Get(&entity, `
		SELECT *
		FROM investment_update
		WHERE investment_id = $1 
		AND date <= $2
		ORDER BY date DESC
		LIMIT 1
	`, investmentID, dateString)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return domain.InvestmentUpdate{}, domain.ErrInvestmentUpdateNotFound
		}
		return domain.InvestmentUpdate{}, fmt.Errorf("failed to select investment update: %w", err)
	}

	return r.toDomainInvestmentUpdate(entity)
}

func (r InvestmentUpdateRepository) toDomainInvestmentUpdates(entities []InvestmentUpdate) ([]domain.InvestmentUpdate, error) {
	ids := slices.Map(entities, func(e InvestmentUpdate) uuid.UUID { return e.ID })
	costsByID, err := r.calculateCosts(ids)
	if err != nil {
		return []domain.InvestmentUpdate{}, errors.Wrap(err, "failed to calculate costs")
	}

	updates := make([]domain.InvestmentUpdate, 0)
	for _, entity := range entities {
		updates = append(updates, entity.toDomainInvestmentUpdate(costsByID[entity.ID]))
	}

	return updates, nil
}

func (r InvestmentUpdateRepository) toDomainInvestmentUpdate(entity InvestmentUpdate) (domain.InvestmentUpdate, error) {
	costsByID, err := r.calculateCosts([]uuid.UUID{entity.ID})
	if err != nil {
		return domain.InvestmentUpdate{}, errors.Wrap(err, "failed to calculate costs")
	}

	return entity.toDomainInvestmentUpdate(costsByID[entity.ID]), nil
}

type CalculateCostRow struct {
	ID   uuid.UUID `db:"id"`
	Cost int64     `db:"cost"`
}

func (r InvestmentUpdateRepository) calculateCosts(ids []uuid.UUID) (map[uuid.UUID]int64, error) {
	psql := sq.StatementBuilder.PlaceholderFormat(sq.Dollar)
	queryBuilder := psql.
		Select("*").
		FromSelect(psql.
			Select("id", `SUM(COALESCE(deposit, 0) - COALESCE(withdrawal, 0)) OVER (PARTITION BY investment_id ORDER BY "date") AS cost`).
			From("investment_update"), "filtered_data").
		Where(sq.Eq{"id": ids})

	query, args, err := queryBuilder.ToSql()
	if err != nil {
		return nil, errors.Wrap(err, "failed to build sql")
	}

	rows := []CalculateCostRow{}
	err = r.db.Select(&rows, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate costs: %w", err)
	}

	costsByID := make(map[uuid.UUID]int64)
	for _, row := range rows {
		costsByID[row.ID] = row.Cost
	}
	return costsByID, nil
}
