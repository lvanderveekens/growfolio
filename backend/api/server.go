package api

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type Server struct {
	googleClientId     string
	googleClientSecret string

	sessionSecret string

	handlers *Handlers
}

func NewServer(googleClientId, googleClientSecret, sessionSecret string, handlers *Handlers) *Server {
	return &Server{
		googleClientId:     googleClientId,
		googleClientSecret: googleClientSecret,
		sessionSecret:      sessionSecret,
		handlers:           handlers,
	}
}

func (s *Server) Start(port int) error {
	r := gin.Default()
	s.RegisterRoutes(r)
	return r.Run(":" + strconv.Itoa(port))
}

type response[T any] struct {
	Status int
	Body   T
}

type empty any

func newResponse[T any](status int, body T) *response[T] {
	return &response[T]{Status: status, Body: body}
}

func newEmptyResponse(status int) *response[empty] {
	return &response[empty]{Status: status, Body: nil}
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
	auth             *AuthHandler
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
