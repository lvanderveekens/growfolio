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
		public.GET("/auth/:provider", createHandlerFuncWithResponse(s.handlers.auth.Begin))
		public.GET("/auth/:provider/callback", createHandlerFuncWithResponse(s.handlers.auth.Callback))

		public.POST("/stripe/webhook", createHandlerFuncWithResponse(s.handlers.stripe.Webhook))

		public.POST("/contact", createHandlerFuncWithResponse(s.handlers.contact.SendContactMessage))
	}

	private := r.Group("")
	private.Use(s.middlewares.token)
	{
		private.POST("/auth/logout", createHandlerFuncWithResponse(s.handlers.auth.LogOut))

		private.GET("/investments", createHandlerFuncWithResponse(s.handlers.investment.GetInvestments))
		private.POST("/investments", createHandlerFuncWithResponse(s.handlers.investment.CreateInvestment))
		private.GET("/investments/:id", createHandlerFuncWithResponse(s.handlers.investment.GetInvestment))
		private.DELETE("/investments/:id", createHandlerFuncWithResponse(s.handlers.investment.DeleteInvestment))
		private.POST("/investments/:id/updates", createHandlerFuncWithResponse(s.handlers.investment.CreateUpdate))
		private.POST("/investments/:id/updates/csv", createHandlerFuncWithResponse(s.handlers.investment.ImportUpdates))
		private.GET("/investments/:id/updates/csv", createHandlerFunc(s.handlers.investment.ExportUpdates))

		private.GET("/investment-updates", createHandlerFuncWithResponse(s.handlers.investmentUpdate.GetInvestmentUpdates))
		private.DELETE("/investment-updates/:id", createHandlerFuncWithResponse(s.handlers.investmentUpdate.DeleteInvestmentUpdate))

		private.GET("/user", createHandlerFuncWithResponse(s.handlers.user.GetUser))

		private.GET("/settings", createHandlerFuncWithResponse(s.handlers.settings.GetSettings))
		private.PUT("/settings", createHandlerFuncWithResponse(s.handlers.settings.UpdateSettings))

		private.POST("/feedback", createHandlerFuncWithResponse(s.handlers.feedback.SubmitFeedback))

		private.POST("/stripe/checkout-sessions", createHandlerFuncWithResponse(s.handlers.stripe.CreateCheckoutSession))
		private.POST("/stripe/portal-sessions", createHandlerFuncWithResponse(s.handlers.stripe.CreatePortalSession))
	}
}
