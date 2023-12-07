package postgres

import (
	"database/sql"
	"errors"
	"fmt"
	"growfolio/domain"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
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

func (i InvestmentUpdate) toDomainInvestmentUpdate() domain.InvestmentUpdate {
	return domain.NewInvestmentUpdate(i.ID.String(), i.InvestmentID, i.Date, i.Deposit, i.Withdrawal, i.Value)
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
	err = r.db.Get(&entity, "SELECT * FROM investment_update WHERE id=$1", id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return domain.InvestmentUpdate{}, domain.ErrInvestmentUpdateNotFound
		}
		return domain.InvestmentUpdate{}, fmt.Errorf("failed to select investment update: %w", err)
	}

	return entity.toDomainInvestmentUpdate(), nil
}

func (r InvestmentUpdateRepository) Find(findQuery domain.FindInvestmentUpdateQuery) ([]domain.InvestmentUpdate, error) {
	psql := sq.StatementBuilder.PlaceholderFormat(sq.Dollar)
	queryBuilder := psql.Select("*").From("investment_update")
	queryBuilder = queryBuilder.Where(sq.Eq{"investment_id": findQuery.InvestmentIDs})

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

	updates := make([]domain.InvestmentUpdate, 0)
	for _, entity := range entities {
		updates = append(updates, entity.toDomainInvestmentUpdate())
	}

	return updates, nil
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

	var entity InvestmentUpdate
	err = r.db.QueryRowx(`
		INSERT INTO investment_update (id, investment_id, "date", deposit, withdrawal, "value") 
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING *
	`, id, c.Investment.ID, c.Date, c.Deposit, c.Withdrawal, c.Value).StructScan(&entity)
	if err != nil {
		return domain.InvestmentUpdate{}, fmt.Errorf("failed to insert investment update: %w", err)
	}

	return entity.toDomainInvestmentUpdate(), nil
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

	return entity.toDomainInvestmentUpdate(), nil
}
