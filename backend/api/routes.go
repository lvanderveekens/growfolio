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

	public := r.Group("")
	{
		public.GET("/v1/auth/:provider", createHandlerFunc(s.handlers.auth.Begin))
		public.GET("/v1/auth/:provider/callback", createHandlerFunc(s.handlers.auth.Callback))

		public.POST("/v1/stripe/webhook", createHandlerFunc(s.handlers.stripe.Webhook))
	}

	private := r.Group("")
	private.Use(s.middlewares.token)
	{
		private.POST("/v1/auth/logout", createHandlerFunc(s.handlers.auth.LogOut))

		private.GET("/v1/investments", createHandlerFunc(s.handlers.investment.GetInvestments))
		private.GET("/v1/investments/:id", createHandlerFunc(s.handlers.investment.GetInvestment))
		private.DELETE("/v1/investments/:id", createHandlerFunc(s.handlers.investment.DeleteInvestment))
		private.POST("/v1/investments", createHandlerFunc(s.handlers.investment.CreateInvestment))
		private.POST("/v1/investments/:id/updates", createHandlerFunc(s.handlers.investment.ImportUpdates))
		private.POST("/v1/investments/:id/transactions", createHandlerFunc(s.handlers.investment.ImportTransactions))

		private.GET("/v1/investment-updates", createHandlerFunc(s.handlers.investmentUpdate.GetInvestmentUpdates))
		private.POST("/v1/investment-updates", createHandlerFunc(s.handlers.investmentUpdate.CreateInvestmentUpdate))
		private.DELETE("/v1/investment-updates/:id", createHandlerFunc(s.handlers.investmentUpdate.DeleteInvestmentUpdate))

		private.GET("/v1/transactions", createHandlerFunc(s.handlers.transaction.GetTransactions))
		private.POST("/v1/transactions", createHandlerFunc(s.handlers.transaction.CreateTransaction))
		private.DELETE("/v1/transactions/:id", createHandlerFunc(s.handlers.transaction.DeleteTransaction))

		private.GET("/v1/user", createHandlerFunc(s.handlers.user.GetUser))

		private.GET("/v1/settings", createHandlerFunc(s.handlers.settings.GetSettings))
		private.PUT("/v1/settings", createHandlerFunc(s.handlers.settings.UpdateSettings))

		private.POST("/v1/feedback", createHandlerFunc(s.handlers.feedback.SubmitFeedback))

		private.POST("/v1/stripe/checkout-sessions", createHandlerFunc(s.handlers.stripe.CreateCheckoutSession))
		// private.POST("/v1/stripe/portal-sessions", createHandlerFunc(s.handlers.stripe.CreateCheckoutSession))
	}
}
