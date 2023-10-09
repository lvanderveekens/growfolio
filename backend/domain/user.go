package domain

type User struct {
	ID          string
	Email       string
	Provider    string
	AccountType AccountType
}

func NewUser(id, email, provider string, accountType AccountType) User {
	return User{
		ID:          id,
		Email:       email,
		Provider:    provider,
		AccountType: accountType,
	}
}

type AccountType string

const (
	AccountTypeBasic   TransactionType = "basic"
	AccountTypePremium TransactionType = "premium"
)
