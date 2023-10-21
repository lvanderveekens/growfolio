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

	gorillaSessionsSecret string

	handlers    Handlers
	middlewares Middlewares
}

func NewServer(
	googleClientId, googleClientSecret, gorillaSessionsSecret string,
	handlers Handlers,
	middlewares Middlewares,
) Server {
	return Server{
		googleClientId:        googleClientId,
		googleClientSecret:    googleClientSecret,
		gorillaSessionsSecret: gorillaSessionsSecret,
		handlers:              handlers,
		middlewares:           middlewares,
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

type empty struct{}

func newResponse[T any](status int, body T) response[T] {
	return response[T]{Status: status, Body: body}
}

func newEmptyResponse(status int) response[empty] {
	return response[empty]{Status: status, Body: empty{}}
}

func createHandlerFunc[T any](f func(c *gin.Context) (response[T], error)) gin.HandlerFunc {
	return func(c *gin.Context) {
		response, err := f(c)
		if err != nil {
			fmt.Printf("error: %s\n", err.Error())

			if err, ok := err.(Error); ok {
				c.JSON(err.Status, err)
				return
			}

			status := http.StatusInternalServerError
			c.JSON(status, NewError(status, http.StatusText(status)))
			return
		}

		c.JSON(response.Status, response.Body)
	}
}

type Handlers struct {
	investment       InvestmentHandler
	investmentUpdate InvestmentUpdateHandler
	transaction      TransactionHandler
	auth             AuthHandler
	user             UserHandler
	settings         SettingsHandler
	feedback         FeedbackHandler
	stripe           StripeHandler
	contact          ContactHandler
}

func NewHandlers(
	investment InvestmentHandler,
	investmentUpdate InvestmentUpdateHandler,
	transaction TransactionHandler,
	auth AuthHandler,
	user UserHandler,
	settings SettingsHandler,
	feedback FeedbackHandler,
	stripe StripeHandler,
	contact ContactHandler,
) Handlers {
	return Handlers{
		investment:       investment,
		investmentUpdate: investmentUpdate,
		transaction:      transaction,
		auth:             auth,
		user:             user,
		settings:         settings,
		feedback:         feedback,
		stripe:           stripe,
		contact:          contact,
	}
}

type Middlewares struct {
	token gin.HandlerFunc
}

func NewMiddlewares(token gin.HandlerFunc) Middlewares {
	return Middlewares{
		token: token,
	}
}
