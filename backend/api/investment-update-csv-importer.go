package api

import (
	"encoding/csv"
	"growfolio/domain"
	"growfolio/domain/services"

	"github.com/pkg/errors"
)

type InvestmentUpdateCSVImporter struct {
	investmentUpdateService services.InvestmentUpdateService
}

func NewInvestmentUpdateCSVImporter(
	investmentUpdateService services.InvestmentUpdateService,
) InvestmentUpdateCSVImporter {
	return InvestmentUpdateCSVImporter{
		investmentUpdateService: investmentUpdateService,
	}
}

func (s InvestmentUpdateCSVImporter) Import(csvReader *csv.Reader, investment domain.Investment) error {
	stringRecords, err := csvReader.ReadAll()
	if err != nil {
		return errors.Wrap(err, "failed to read CSV records")
	}

	records := make([]InvestmentUpdateCSVRecord, 0)
	for i := 1; i < len(stringRecords); i++ { // skipping the header row
		stringRecord := stringRecords[i]
		records = append(records, newInvestmentUpdateCSVRecord(
			stringRecord[0],
			stringRecord[1],
			stringRecord[2],
			stringRecord[3],
		))
	}

	commands := make([]domain.CreateInvestmentUpdateCommand, 0)
	for _, record := range records {
		command, err := record.toCreateInvestmentUpdateCommand(investment)
		if err != nil {
			return errors.Wrap(err, "failed to map record to command")
		}
		commands = append(commands, command)
	}

	for _, command := range commands {
		_, err := s.investmentUpdateService.Create(command)
		if err != nil {
			return errors.Wrap(err, "failed to create update")
		}
	}

	return nil
}
