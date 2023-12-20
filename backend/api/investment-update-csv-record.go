package api

import (
	"fmt"
	"growfolio/domain"
	"growfolio/pointer"
	"strconv"
	"time"
)

type InvestmentUpdateCSVRecord struct {
	Date       string
	Deposit    string
	Withdrawal string
	Value      string
}

func newInvestmentUpdateCSVRecord(date, deposit, withdrawal, value string) InvestmentUpdateCSVRecord {
	return InvestmentUpdateCSVRecord{
		Date:       date,
		Deposit:    deposit,
		Withdrawal: withdrawal,
		Value:      value,
	}
}

func (r InvestmentUpdateCSVRecord) toCreateInvestmentUpdateCommand(
	investment domain.Investment,
) (domain.CreateInvestmentUpdateCommand, error) {
	date, err := time.Parse("2006-01-02", r.Date)
	if err != nil {
		return domain.CreateInvestmentUpdateCommand{}, fmt.Errorf("failed to parse date: %w", err)
	}

	var deposit *int64
	if r.Deposit != "" {
		parsed, err := strconv.ParseInt(r.Deposit, 10, 64)
		if err != nil {
			return domain.CreateInvestmentUpdateCommand{}, fmt.Errorf("failed to parse deposit: %w", err)
		}
		deposit = &parsed
	}

	var withdrawal *int64
	if r.Withdrawal != "" {
		parsed, err := strconv.ParseInt(r.Withdrawal, 10, 64)
		if err != nil {
			return domain.CreateInvestmentUpdateCommand{}, fmt.Errorf("failed to parse withdrawal: %w", err)
		}
		withdrawal = &parsed
	}

	value, err := strconv.ParseInt(r.Value, 10, 64)
	if err != nil {
		return domain.CreateInvestmentUpdateCommand{}, fmt.Errorf("failed to parse value: %w", err)
	}

	return domain.NewCreateInvestmentUpdateCommand(investment, date, deposit, withdrawal, value), nil
}

func toInvestmentUpdateCSVRecord(update domain.InvestmentUpdate) InvestmentUpdateCSVRecord {
	return newInvestmentUpdateCSVRecord(
		update.Date.Format("2006-01-02"),
		pointer.IntToString(update.Deposit),
		pointer.IntToString(update.Withdrawal),
		strconv.FormatInt(update.Value, 10),
	)
}
