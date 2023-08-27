package api

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/sessions"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/google"
)

func (s *Server) RegisterRoutes(r *gin.Engine) {
	store := sessions.NewCookieStore([]byte(s.sessionSecret))
	store.Options.Path = "/"
	store.Options.HttpOnly = true

	gothic.Store = store

	goth.UseProviders(
		google.New(s.googleClientId, s.googleClientSecret, "http://localhost:8080/auth/google/callback"),
	)

	r.GET("/auth/:provider", func(c *gin.Context) {
		gothic.GetProviderName = func(r *http.Request) (string, error) { return c.Param("provider"), nil }
		if user, err := gothic.CompleteUserAuth(c.Writer, c.Request); err == nil {
			fmt.Printf("Hi, %#v\n", user)
		} else {
			gothic.BeginAuthHandler(c.Writer, c.Request)
		}
	})

	r.GET("/auth/:provider/callback", func(c *gin.Context) {
		gothic.GetProviderName = func(r *http.Request) (string, error) { return c.Param("provider"), nil }
		user, err := gothic.CompleteUserAuth(c.Writer, c.Request)
		if err != nil {
			fmt.Printf("Error: %s\n", err.Error())
			return
		}
		fmt.Printf("Hi, %#v\n", user)
	})

	r.GET("/v1/investments", createHandlerFunc(s.handlers.investment.GetInvestments))
	r.GET("/v1/investments/:id", createHandlerFunc(s.handlers.investment.GetInvestment))
	r.POST("/v1/investments", createHandlerFunc(s.handlers.investment.CreateInvestment))

	r.GET("/v1/investment-updates", createHandlerFunc(s.handlers.investmentUpdate.GetInvestmentUpdates))
	r.POST("/v1/investment-updates", createHandlerFunc(s.handlers.investmentUpdate.CreateInvestmentUpdate))
	r.DELETE("/v1/investment-updates/:id", createHandlerFunc(s.handlers.investmentUpdate.DeleteInvestmentUpdate))

	r.GET("/v1/transactions", createHandlerFunc(s.handlers.transaction.GetTransactions))
	r.POST("/v1/transactions", createHandlerFunc(s.handlers.transaction.CreateTransaction))
	r.DELETE("/v1/transactions/:id", createHandlerFunc(s.handlers.transaction.DeleteTransaction))
}
