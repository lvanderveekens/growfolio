package api

import (
	"encoding/csv"
	"errors"
	"fmt"
	"growfolio/domain"
	"growfolio/domain/services"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type InvestmentHandler struct {
	investmentService       services.InvestmentService
	investmentUpdateService services.InvestmentUpdateService
	userRepository          services.UserRepository
}

func NewInvestmentHandler(
	investmentService services.InvestmentService,
	investmentUpdateService services.InvestmentUpdateService,
	userRepository services.UserRepository,
) InvestmentHandler {
	return InvestmentHandler{
		investmentService:       investmentService,
		investmentUpdateService: investmentUpdateService,
		userRepository:          userRepository,
	}
}

func (h InvestmentHandler) GetInvestments(c *gin.Context) (response[[]investmentDto], error) {
	tokenClaims := c.Value("token").(*jwt.Token).Claims.(jwt.MapClaims)
	tokenUserID := tokenClaims["userId"].(string)

	investments, err := h.investmentService.FindByUserID(tokenUserID)
	if err != nil {
		return response[[]investmentDto]{}, fmt.Errorf("failed to find investments: %w", err)
	}

	dtos := make([]investmentDto, 0)
	for _, investment := range investments {
		dtos = append(dtos, toInvestmentDto(investment))
	}

	return newResponse(http.StatusOK, dtos), nil
}

func (h InvestmentHandler) GetInvestment(c *gin.Context) (response[investmentDto], error) {
	tokenClaims := c.Value("token").(*jwt.Token).Claims.(jwt.MapClaims)
	tokenUserID := tokenClaims["userId"].(string)

	id := c.Param("id")
	investment, err := h.investmentService.FindByID(id)
	if err != nil {
		if err == domain.ErrInvestmentNotFound {
			return response[investmentDto]{}, NewError(http.StatusBadRequest, err.Error())
		}
		return response[investmentDto]{}, fmt.Errorf("failed to find investment by id %s: %w", id, err)
	}

	if investment.UserID != tokenUserID {
		return response[investmentDto]{}, NewError(http.StatusForbidden, "not allowed to read investment")
	}

	return newResponse(http.StatusOK, toInvestmentDto(investment)), nil
}

func (h InvestmentHandler) DeleteInvestment(c *gin.Context) (response[empty], error) {
	tokenClaims := c.Value("token").(*jwt.Token).Claims.(jwt.MapClaims)
	tokenUserID := tokenClaims["userId"].(string)

	investment, err := h.investmentService.FindByID(c.Param("id"))
	if err != nil {
		if err == domain.ErrInvestmentNotFound {
			return response[empty]{}, NewError(http.StatusBadRequest, err.Error())
		}
		return response[empty]{}, fmt.Errorf("failed to find investment: %w", err)
	}
	if investment.UserID != tokenUserID {
		return response[empty]{}, NewError(http.StatusForbidden, "not allowed to delete investment")
	}

	err = h.investmentUpdateService.DeleteByInvestmentID(investment.ID)
	if err != nil {
		return response[empty]{}, fmt.Errorf("failed to delete updates: %w", err)
	}

	err = h.investmentService.DeleteByID(investment.ID)
	if err != nil {
		return response[empty]{}, fmt.Errorf("failed to delete investment: %w", err)
	}

	return newEmptyResponse(http.StatusNoContent), nil
}

func (h InvestmentHandler) CreateInvestment(c *gin.Context) (response[investmentDto], error) {
	tokenClaims := c.Value("token").(*jwt.Token).Claims.(jwt.MapClaims)
	tokenUserID := tokenClaims["userId"].(string)

	user, err := h.userRepository.FindByID(tokenUserID)
	if err != nil {
		return response[investmentDto]{}, fmt.Errorf("failed to find user: %w", err)
	}

	var request CreateInvestmentRequest
	err = c.ShouldBindJSON(&request)
	if err != nil {
		return response[investmentDto]{}, fmt.Errorf("failed to decode request body: %w", err)
	}
	if err := request.validate(); err != nil {
		return response[investmentDto]{}, NewError(http.StatusBadRequest, err.Error())
	}

	command, err := request.toCommand(user)
	if err != nil {
		return response[investmentDto]{}, fmt.Errorf("failed to map request to command: %w", err)
	}

	created, err := h.investmentService.Create(command)
	if err != nil {
		return response[investmentDto]{}, fmt.Errorf("failed to create investment: %w", err)
	}

	return newResponse(http.StatusCreated, toInvestmentDto(created)), nil
}

func (h InvestmentHandler) CreateUpdate(c *gin.Context) (response[investmentUpdateDto], error) {
	tokenClaims := c.Value("token").(*jwt.Token).Claims.(jwt.MapClaims)
	tokenUserID := tokenClaims["userId"].(string)

	var request createInvestmentUpdateRequest
	err := c.ShouldBindJSON(&request)
	if err != nil {
		return response[investmentUpdateDto]{}, fmt.Errorf("failed to decode request body: %w", err)
	}

	id := c.Param("id")
	investment, err := h.investmentService.FindByID(id)
	if err != nil {
		if err == domain.ErrInvestmentNotFound {
			return response[investmentUpdateDto]{}, NewError(http.StatusBadRequest, err.Error())
		}
		return response[investmentUpdateDto]{}, fmt.Errorf("failed to find investment: %w", err)
	}

	if investment.UserID != tokenUserID {
		return response[investmentUpdateDto]{}, NewError(http.StatusForbidden, "not allowed to create update for investment")
	}

	command, err := request.toCommand(investment)
	if err != nil {
		return response[investmentUpdateDto]{}, NewError(http.StatusBadRequest, err.Error())
	}

	update, err := h.investmentUpdateService.Create(command)
	if err != nil {
		return response[investmentUpdateDto]{}, fmt.Errorf("failed to create investment update: %w", err)
	}

	return newResponse(http.StatusCreated, toInvestmentUpdateDto(update)), nil
}

func (h InvestmentHandler) ImportUpdates(c *gin.Context) (response[empty], error) {
	tokenClaims := c.Value("token").(*jwt.Token).Claims.(jwt.MapClaims)
	tokenUserID := tokenClaims["userId"].(string)

	id := c.Param("id")
	investment, err := h.investmentService.FindByID(id)
	if err != nil {
		if err == domain.ErrInvestmentNotFound {
			return response[empty]{}, NewError(http.StatusBadRequest, err.Error())
		}
		return response[empty]{}, fmt.Errorf("failed to find investment by id %s: %w", id, err)
	}

	if investment.UserID != tokenUserID {
		return response[empty]{}, NewError(http.StatusForbidden, "not allowed to read investment")
	}

	csvFormFile, err := c.FormFile("csvFile")
	if err != nil {
		return response[empty]{}, NewError(http.StatusBadRequest, err.Error())
	}

	slog.Info("Received file: " + csvFormFile.Filename)

	csvFile, err := csvFormFile.Open()
	if err != nil {
		return response[empty]{}, fmt.Errorf("failed to open CSV file: %w", err)
	}
	defer csvFile.Close()

	csvReader := csv.NewReader(csvFile)
	records, err := csvReader.ReadAll()
	if err != nil {
		return response[empty]{}, fmt.Errorf("failed to read CSV records: %w", err)
	}

	commands := make([]domain.CreateInvestmentUpdateCommand, 0)

	for i := 1; i < len(records); i++ { // skipping the header row
		record := records[i]
		dateString := record[0]
		depositString := record[1]
		withdrawalString := record[2]
		valueString := record[3]

		date, err := time.Parse("2006-01-02", dateString)
		if err != nil {
			return response[empty]{}, fmt.Errorf("failed to parse date: %w", err)
		}

		var deposit *int64
		if depositString != "" {
			parsed, err := strconv.ParseInt(depositString, 10, 64)
			if err != nil {
				return response[empty]{}, fmt.Errorf("failed to parse deposit: %w", err)
			}
			deposit = &parsed
		}

		var withdrawal *int64
		if withdrawalString != "" {
			parsed, err := strconv.ParseInt(withdrawalString, 10, 64)
			if err != nil {
				return response[empty]{}, fmt.Errorf("failed to parse withdrawal: %w", err)
			}
			withdrawal = &parsed
		}

		value, err := strconv.ParseInt(valueString, 10, 64)
		if err != nil {
			return response[empty]{}, fmt.Errorf("failed to parse value: %w", err)
		}

		commands = append(commands, domain.NewCreateInvestmentUpdateCommand(investment, date, deposit, withdrawal, value))
	}

	for _, command := range commands {
		slog.Info("Received update: " + fmt.Sprintf("%+v", command))
		_, err := h.investmentUpdateService.Create(command)
		if err != nil {
			return response[empty]{}, fmt.Errorf("failed to create update: %w", err)
		}
	}

	return newEmptyResponse(200), nil
}

func toInvestmentDto(i domain.Investment) investmentDto {
	var lastUpdateDate *string
	if i.LastUpdateDate != nil {
		formatted := (*i.LastUpdateDate).Format("2006-01-02")
		lastUpdateDate = &formatted
	}

	return newInvestmentDto(i.ID, i.Type, i.Name, i.Locked, lastUpdateDate)
}

type CreateInvestmentRequest struct {
	Type         domain.InvestmentType `json:"type"`
	Name         string                `json:"name"`
	InitialDate  *string               `json:"initialDate"`
	InitialCost  *int64                `json:"initialCost"`
	InitialValue *int64                `json:"initialValue"`
}

func (r CreateInvestmentRequest) validate() error {
	if r.Type == "" {
		return errors.New("field 'type' is missing")
	}
	if r.Name == "" {
		return errors.New("field 'name' is missing")
	}
	return nil
}

func (r CreateInvestmentRequest) toCommand(user domain.User) (domain.CreateInvestmentCommand, error) {
	var initialDate *time.Time
	if r.InitialDate != nil {
		parsed, err := time.Parse("2006-01-02", *r.InitialDate)
		if err != nil {
			return domain.CreateInvestmentCommand{}, fmt.Errorf("failed to parse initial date: %w", err)
		}
		initialDate = &parsed
	}

	return domain.NewCreateInvestmentCommand(
		r.Type,
		r.Name,
		user,
		false,
		initialDate,
		r.InitialCost,
		r.InitialValue,
	), nil
}

type createInvestmentUpdateRequest struct {
	Date       string `json:"date"`
	Deposit    *int64 `json:"deposit"`
	Withdrawal *int64 `json:"withdrawal"`
	Value      int64  `json:"value"`
}

func (r createInvestmentUpdateRequest) toCommand(investment domain.Investment) (domain.CreateInvestmentUpdateCommand, error) {
	date, err := time.Parse("2006-01-02", r.Date)
	if err != nil {
		return domain.CreateInvestmentUpdateCommand{}, fmt.Errorf("failed to parse date: %w", err)
	}

	return domain.NewCreateInvestmentUpdateCommand(investment, date, r.Deposit, r.Withdrawal, r.Value), nil
}

type investmentDto struct {
	ID             string                `json:"id"`
	Type           domain.InvestmentType `json:"type"`
	Name           string                `json:"name"`
	Locked         bool                  `json:"locked"`
	LastUpdateDate *string               `json:"lastUpdateDate"`
}

func newInvestmentDto(id string, t domain.InvestmentType, name string, locked bool, lastUpdateDate *string) investmentDto {
	return investmentDto{ID: id, Type: t, Name: name, Locked: locked, LastUpdateDate: lastUpdateDate}
}
