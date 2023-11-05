package domain

type Settings struct {
	UserID   string
	Currency Currency
}

func NewSettings(userID string, currency Currency) Settings {
	return Settings{
		UserID:   userID,
		Currency: currency,
	}
}

func DefaultSettings(userID string) Settings {
	return Settings{
		UserID:   userID,
		Currency: CurrencyUSDollar,
	}
}
