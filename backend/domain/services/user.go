package services

import "growfolio/domain"

type UserRepository interface {
	FindByID(id string) (domain.User, error)
	Create(user domain.User) (domain.User, error)
}
