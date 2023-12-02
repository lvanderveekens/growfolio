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

type Transaction struct {
	ID           uuid.UUID
	CreatedAt    time.Time `db:"created_at"`
	UpdatedAt    time.Time `db:"updated_at"`
	Date         time.Time
	Type         domain.TransactionType
	InvestmentID string `db:"investment_id"`
	Amount       int64
}

func (t *Transaction) toDomainTransaction() domain.Transaction {
	return domain.NewTransaction(t.ID.String(), t.Date, t.Type, t.InvestmentID, t.Amount)
}

type TransactionRepository struct {
	db *sqlx.DB
}

func NewTransactionRepository(db *sqlx.DB) TransactionRepository {
	return TransactionRepository{db: db}
}

func (r TransactionRepository) FindByID(id string) (domain.Transaction, error) {
	_, err := uuid.Parse(id)
	if err != nil {
		fmt.Println("error: id is not a uuid: " + err.Error())
		return domain.Transaction{}, domain.ErrTransactionNotFound
	}

	entity := Transaction{}
	err = r.db.Get(&entity, "SELECT * FROM transaction WHERE id=$1", id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return domain.Transaction{}, domain.ErrTransactionNotFound
		}
		return domain.Transaction{}, fmt.Errorf("failed to select transaction: %w", err)
	}

	return entity.toDomainTransaction(), nil
}

func (r TransactionRepository) Find(findQuery domain.FindTransactionQuery) ([]domain.Transaction, error) {
	psql := sq.StatementBuilder.PlaceholderFormat(sq.Dollar)
	queryBuilder := psql.Select("*").From("transaction")

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

	entities := []Transaction{}
	err = r.db.Select(&entities, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to select transaction: %w", err)
	}

	updates := make([]domain.Transaction, 0)
	for _, entity := range entities {
		updates = append(updates, entity.toDomainTransaction())
	}

	return updates, nil
}

func (r TransactionRepository) DeleteByInvestmentID(investmentID string) error {
	_, err := uuid.Parse(investmentID)
	if err != nil {
		return nil
	}

	_, err = r.db.Exec("DELETE FROM transaction WHERE investment_id=$1", investmentID)
	return err
}

func (r TransactionRepository) Create(cmd domain.CreateTransactionCommand) (domain.Transaction, error) {
	id, err := uuid.NewRandom()
	if err != nil {
		return domain.Transaction{}, fmt.Errorf("failed to generate new UUID: %w", err)
	}

	var entity Transaction
	err = r.db.QueryRowx(`
		INSERT INTO transaction (id, date, "type", investment_id, amount) 
		VALUES ($1, $2, $3, $4, $5)
		RETURNING *
	`, id, cmd.Date, cmd.Type, cmd.Investment.ID, cmd.Amount).StructScan(&entity)
	if err != nil {
		return domain.Transaction{}, fmt.Errorf("failed to insert transaction: %w", err)
	}

	return entity.toDomainTransaction(), nil
}

func (r TransactionRepository) DeleteByID(id string) error {
	_, err := uuid.Parse(id)
	if err != nil {
		return nil
	}

	_, err = r.db.Exec("DELETE FROM transaction WHERE id=$1", id)
	return err
}
