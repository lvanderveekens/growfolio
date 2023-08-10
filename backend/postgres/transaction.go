package postgres

import (
	"fmt"
	"growfolio/transaction"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type Transaction struct {
	ID           uuid.UUID
	CreatedAt    time.Time `db:"created_at"`
	UpdatedAt    time.Time `db:"updated_at"`
	Date         time.Time
	Type         transaction.Type
	InvestmentID string `db:"investment_id"`
	Amount       int64
}

func (t *Transaction) toDomainObject() *transaction.Transaction {
	return transaction.New(t.ID.String(), t.Date, t.Type, t.InvestmentID, t.Amount)
}

type TransactionRepository struct {
	db *sqlx.DB
}

func NewTransactionRepository(db *sqlx.DB) *TransactionRepository {
	return &TransactionRepository{db: db}
}

func (r *TransactionRepository) Find(investmentID *string) ([]transaction.Transaction, error) {
	query := "SELECT * FROM transaction"
	args := make([]any, 0)
	if investmentID != nil {
		query += " WHERE investment_id = $1"
		args = append(args, *investmentID)
	}
	query += " ORDER BY date ASC"

	entities := []Transaction{}
	err := r.db.Select(&entities, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to select transactions: %w", err)
	}

	transactions := make([]transaction.Transaction, 0)
	for _, entity := range entities {
		transactions = append(transactions, *entity.toDomainObject())
	}

	return transactions, nil
}

func (r *TransactionRepository) Create(cmd transaction.CreateCommand) (*transaction.Transaction, error) {
	id, err := uuid.NewRandom()
	if err != nil {
		return nil, fmt.Errorf("failed to generate new UUID: %w", err)
	}

	var entity Transaction
	err = r.db.QueryRowx(`
		INSERT INTO transaction (id, date, "type", investment_id, amount) 
		VALUES ($1, $2, $3, $4, $5)
		RETURNING *
	`, id, cmd.Date, cmd.Type, cmd.Investment.ID, cmd.Amount).StructScan(&entity)
	if err != nil {
		return nil, fmt.Errorf("failed to insert transaction: %w", err)
	}

	return entity.toDomainObject(), nil
}
