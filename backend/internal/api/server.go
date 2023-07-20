package api

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	cors "github.com/rs/cors/wrapper/gin"
)

type Server struct {
	handlers *Handlers
}

func NewServer(handlers *Handlers) *Server {
	return &Server{
		handlers: handlers,
	}
}

func (s *Server) Start(port int) error {
	r := gin.Default()

	r.Use(cors.New(cors.Options{
		AllowedOrigins: []string{"http://localhost:3000", "http://lucianos-macbook-pro.local:3000"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
	}))

	r.GET("/v1/investments", createHandlerFunc(s.handlers.investment.GetInvestments))
	r.POST("/v1/investments", createHandlerFunc(s.handlers.investment.CreateInvestment))

	r.GET("/v1/investment-updates", createHandlerFunc(s.handlers.investmentUpdate.GetInvestmentUpdates))
	r.POST("/v1/investment-updates", createHandlerFunc(s.handlers.investmentUpdate.CreateInvestmentUpdate))

	r.GET("/v1/transactions", createHandlerFunc(s.handlers.transaction.GetTransactions))
	r.POST("/v1/transactions", createHandlerFunc(s.handlers.transaction.CreateTransaction))

	return r.Run(":" + strconv.Itoa(port))
}

type response[T any] struct {
	Status int
	Body   *T
}

func newResponse[T any](status int, body *T) *response[T] {
	return &response[T]{Status: status, Body: body}
}

func createHandlerFunc[T any](f func(c *gin.Context) (*response[T], error)) gin.HandlerFunc {
	return func(c *gin.Context) {
		response, err := f(c)
		if err != nil {
			if err, ok := err.(Error); ok {
				c.JSON(err.Status, err)
				return
			}

			fmt.Printf("server error: %s\n", err.Error())
			status := http.StatusInternalServerError
			c.JSON(status, NewError(status, http.StatusText(status)))
		}

		c.JSON(response.Status, response.Body)
	}
}

type Handlers struct {
	investment       *InvestmentHandler
	investmentUpdate *InvestmentUpdateHandler
	transaction      *TransactionHandler
}

func NewHandlers(
	investment *InvestmentHandler,
	investmentUpdate *InvestmentUpdateHandler,
	transaction *TransactionHandler,
) *Handlers {
	return &Handlers{
		investment:       investment,
		investmentUpdate: investmentUpdate,
		transaction:      transaction,
	}
}
