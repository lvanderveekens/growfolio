package domain

type User struct {
	ID               string
	Email            string
	Provider         string
	AccountType      AccountType
	StripeCustomerID *string
}

func NewUser(id, email, provider string, accountType AccountType, stripeCustomerID *string) User {
	return User{
		ID:               id,
		Email:            email,
		Provider:         provider,
		AccountType:      accountType,
		StripeCustomerID: stripeCustomerID,
	}
}

type AccountType string

const (
	AccountTypeBasic   AccountType = "basic"
	AccountTypePremium AccountType = "premium"
)
