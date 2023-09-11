package api

import (
	"github.com/gin-gonic/gin"
	"github.com/gorilla/sessions"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/google"
)

func (s *Server) RegisterRoutes(r *gin.Engine) {
	store := sessions.NewCookieStore([]byte(s.gorillaSessionsSecret))
	store.Options.Path = "/"
	store.Options.HttpOnly = true

	gothic.Store = store

	goth.UseProviders(
		google.New(s.googleClientId, s.googleClientSecret, "http://localhost:8080/auth/google/callback"),
	)

	r.GET("/auth/:provider", createHandlerFunc(s.handlers.auth.Begin))
	r.GET("/auth/:provider/callback", createHandlerFunc(s.handlers.auth.Callback))

	private := r.Group("")
	private.Use(s.middlewares.token)
	{
		private.POST("/auth/logout", createHandlerFunc(s.handlers.auth.LogOut))

		private.GET("/v1/investments", createHandlerFunc(s.handlers.investment.GetInvestments))
		private.GET("/v1/investments/:id", createHandlerFunc(s.handlers.investment.GetInvestment))
		private.POST("/v1/investments", createHandlerFunc(s.handlers.investment.CreateInvestment))

		private.GET("/v1/investment-updates", createHandlerFunc(s.handlers.investmentUpdate.GetInvestmentUpdates))
		private.POST("/v1/investment-updates", createHandlerFunc(s.handlers.investmentUpdate.CreateInvestmentUpdate))
		private.DELETE("/v1/investment-updates/:id", createHandlerFunc(s.handlers.investmentUpdate.DeleteInvestmentUpdate))

		private.GET("/v1/transactions", createHandlerFunc(s.handlers.transaction.GetTransactions))
		private.POST("/v1/transactions", createHandlerFunc(s.handlers.transaction.CreateTransaction))
		private.DELETE("/v1/transactions/:id", createHandlerFunc(s.handlers.transaction.DeleteTransaction))

		private.GET("/v1/users/current", createHandlerFunc(s.handlers.user.GetCurrentUser))
	}
}
