package services

import "growfolio/domain"

type UserRepository interface {
	Create(command domain.CreateUserCommand) (*domain.User, error)
}
