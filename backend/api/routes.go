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
		google.New(s.googleClientId, s.googleClientSecret, s.frontendHost+"/auth/google/callback"),
	)

	public := r.Group("")
	{
		public.GET("/auth/:provider", createHandlerFunc(s.handlers.auth.Begin))
		public.GET("/auth/:provider/callback", createHandlerFunc(s.handlers.auth.Callback))

		public.POST("/stripe/webhook", createHandlerFunc(s.handlers.stripe.Webhook))

		public.POST("/contact", createHandlerFunc(s.handlers.contact.SendContactMessage))
	}

	private := r.Group("")
	private.Use(s.middlewares.token)
	{
		private.POST("/auth/logout", createHandlerFunc(s.handlers.auth.LogOut))

		private.GET("/investments", createHandlerFunc(s.handlers.investment.GetInvestments))
		private.GET("/investments/:id", createHandlerFunc(s.handlers.investment.GetInvestment))
		private.DELETE("/investments/:id", createHandlerFunc(s.handlers.investment.DeleteInvestment))
		private.POST("/investments", createHandlerFunc(s.handlers.investment.CreateInvestment))
		private.POST("/investments/:id/updates", createHandlerFunc(s.handlers.investment.ImportUpdates))
		private.POST("/investments/:id/transactions", createHandlerFunc(s.handlers.investment.ImportTransactions))

		private.GET("/investment-updates", createHandlerFunc(s.handlers.investmentUpdate.GetInvestmentUpdates))
		private.POST("/investment-updates", createHandlerFunc(s.handlers.investmentUpdate.CreateInvestmentUpdate))
		private.DELETE("/investment-updates/:id", createHandlerFunc(s.handlers.investmentUpdate.DeleteInvestmentUpdate))

		private.GET("/transactions", createHandlerFunc(s.handlers.transaction.GetTransactions))
		private.POST("/transactions", createHandlerFunc(s.handlers.transaction.CreateTransaction))
		private.DELETE("/transactions/:id", createHandlerFunc(s.handlers.transaction.DeleteTransaction))

		private.GET("/user", createHandlerFunc(s.handlers.user.GetUser))

		private.GET("/settings", createHandlerFunc(s.handlers.settings.GetSettings))
		private.PUT("/settings", createHandlerFunc(s.handlers.settings.UpdateSettings))

		private.POST("/feedback", createHandlerFunc(s.handlers.feedback.SubmitFeedback))

		private.POST("/stripe/checkout-sessions", createHandlerFunc(s.handlers.stripe.CreateCheckoutSession))
		private.POST("/stripe/portal-sessions", createHandlerFunc(s.handlers.stripe.CreatePortalSession))
	}
}
