package api

import (
	"github.com/gin-gonic/gin"
	cors "github.com/rs/cors/wrapper/gin"
)

func (s *Server) RegisterRoutes(r *gin.Engine) {
	r.Use(cors.New(cors.Options{
		AllowedOrigins: []string{"http://localhost:3000", "http://lucianos-macbook-pro.local:3000"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
	}))

	r.GET("/v1/investments", createHandlerFunc(s.handlers.investment.GetInvestments))
	r.GET("/v1/investments/:id", createHandlerFunc(s.handlers.investment.GetInvestment))
	r.POST("/v1/investments", createHandlerFunc(s.handlers.investment.CreateInvestment))

	r.GET("/v1/investment-updates", createHandlerFunc(s.handlers.investmentUpdate.GetInvestmentUpdates))
	r.POST("/v1/investment-updates", createHandlerFunc(s.handlers.investmentUpdate.CreateInvestmentUpdate))
	r.DELETE("/v1/investment-updates/:id", createHandlerFunc(s.handlers.investmentUpdate.DeleteInvestmentUpdate))

	r.GET("/v1/transactions", createHandlerFunc(s.handlers.transaction.GetTransactions))
	r.POST("/v1/transactions", createHandlerFunc(s.handlers.transaction.CreateTransaction))
}
