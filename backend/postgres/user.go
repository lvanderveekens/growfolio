package postgres

import (
	"database/sql"
	"errors"
	"fmt"
	"growfolio/domain"
	"time"

	"github.com/jmoiron/sqlx"
)

type User struct {
	ID          string    `db:"id"`
	CreatedAt   time.Time `db:"created_at"`
	UpdatedAt   time.Time `db:"updated_at"`
	Email       string    `db:"email"`
	Provider    string    `db:"provider"`
	AccountType string    `db:"account_type"`
}

func (u User) toDomainUser() domain.User {
	return domain.NewUser(u.ID, u.Email, u.Provider, domain.AccountType(u.AccountType))
}

type UserRepository struct {
	db *sqlx.DB
}

func NewUserRepository(db *sqlx.DB) UserRepository {
	return UserRepository{db: db}
}

func (r *UserRepository) FindByID(id string) (domain.User, error) {
	entity := User{}
	err := r.db.Get(&entity, `SELECT * FROM "user" WHERE id=$1`, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return domain.User{}, domain.ErrUserNotFound
		}
		return domain.User{}, fmt.Errorf("failed to select user: %w", err)
	}

	return entity.toDomainUser(), nil
}

func (r *UserRepository) Create(user domain.User) (domain.User, error) {
	var entity User
	err := r.db.QueryRowx(`
		INSERT INTO "user" (id, email, provider, account_type) 
		VALUES ($1, $2, $3, $4)
		RETURNING *
	`, user.ID, user.Email, user.Provider, user.AccountType).StructScan(&entity)
	if err != nil {
		return domain.User{}, fmt.Errorf("failed to insert user: %w", err)
	}

	return entity.toDomainUser(), nil
}
