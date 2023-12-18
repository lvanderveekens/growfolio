package domain

type User struct {
	ID               string
	Email            string
	Provider         string
	AccountType      AccountType
	StripeCustomerID *string
	IsDemo           bool
}

func NewUser(id, email, provider string, accountType AccountType, stripeCustomerID *string, isDemo bool) User {
	return User{
		ID:               id,
		Email:            email,
		Provider:         provider,
		AccountType:      accountType,
		StripeCustomerID: stripeCustomerID,
		IsDemo:           isDemo,
	}
}

type AccountType string

const (
	AccountTypeBasic   AccountType = "basic"
	AccountTypePremium AccountType = "premium"
)

const UserProviderLocal = "local"
