package domain

type UserCreatedEvent struct {
	User User
}

func NewUserCreatedEvent(user User) UserCreatedEvent {
	return UserCreatedEvent{
		User: user,
	}
}
