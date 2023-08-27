package domain

type CreateUserCommand struct {
	ID       string
	Email    string
	Provider string
}

type User struct {
	ID       string
	Email    string
	Provider string
}
