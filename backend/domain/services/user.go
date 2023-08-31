package services

import "growfolio/domain"

type UserRepository interface {
	FindByID(id string) (domain.User, error)
	Create(command domain.CreateUserCommand) (domain.User, error)
}
