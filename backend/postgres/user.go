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
	ID        string
	CreatedAt time.Time `db:"created_at"`
	UpdatedAt time.Time `db:"updated_at"`
	Email     string
	Provider  string
}

func (u *User) toDomainUser() domain.User {
	return domain.NewUser(u.ID, u.Email, u.Provider)
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

func (r *UserRepository) Create(cmd domain.CreateUserCommand) (domain.User, error) {
	var entity User
	err := r.db.QueryRowx(`
		INSERT INTO "user" (id, email, provider) 
		VALUES ($1, $2, $3)
		RETURNING *
	`, cmd.ID, cmd.Email, cmd.Provider).StructScan(&entity)
	if err != nil {
		return domain.User{}, fmt.Errorf("failed to insert user: %w", err)
	}

	return entity.toDomainUser(), nil
}
