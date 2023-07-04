package model

import "time"

type InvestmentType string

const (
	Stock     InvestmentType = "stock"
	Bond      InvestmentType = "bond"
	Commodity InvestmentType = "commodity"
	Fund      InvestmentType = "fund"
	Crypto    InvestmentType = "crypto"
	Cash      InvestmentType = "cash"
)

type InvestmentLog []InvestmentLogEntry

// TODO: log je aankopen
// TODO: update de prijs? wat als je 20 aandelen hebt... moet je dan 20x een prijs updaten?

type InvestmentLogEntry struct {
	Type InvestmentType
	Date time.Time
	// Value int64
}
