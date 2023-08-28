package domain

type CreateUserCommand struct {
	ID       string
	Email    string
	Provider string
}

func NewCreateUserCommand(id, email, provider string) CreateUserCommand {
	return CreateUserCommand{
		ID:       id,
		Email:    email,
		Provider: provider,
	}
}

type User struct {
	ID       string
	Email    string
	Provider string
}

func NewUser(id, email, provider string) User {
	return User{
		ID:       id,
		Email:    email,
		Provider: provider,
	}
}
