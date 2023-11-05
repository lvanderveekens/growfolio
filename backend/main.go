package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"growfolio/api"
	"growfolio/domain/services"
	"growfolio/postgres"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/jackc/pgx/stdlib"

	"github.com/joho/godotenv"

	"github.com/jmoiron/sqlx"
)

func main() {
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatal("Failed loading .env file: ", err)
	}

	zoneName, _ := time.Now().Zone()
	fmt.Println("Configured time zone: ", zoneName)

	postgresConnString := os.Getenv("POSTGRES_CONN_STRING")
	db, err := sqlx.Connect("pgx", postgresConnString)
	if err != nil {
		log.Fatalln(err)
	}

	err = db.Ping()
	if err != nil {
		log.Fatal("Error pinging the database: ", err)
	}

	fmt.Println("Database connection successful!")

	m, err := migrate.New("file://postgres/migrations", postgresConnString)
	if err != nil {
		log.Fatal("Failed to create Migrate instance: ", err)
	}
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		log.Fatal("Failed to migrate the database: ", err)
	}

	investmentRepository := postgres.NewInvestmentRepository(db)
	investmentUpdateRepository := postgres.NewInvestmentUpdateRepository(db)
	investmentUpdateService := services.NewInvestmentUpdateService(investmentUpdateRepository)
	transactionRepository := postgres.NewTransactionRepository(db)
	userRepository := postgres.NewUserRepository(db)
	settingsRepository := postgres.NewSettingsRepository(db)

	tokenService := api.NewTokenService(os.Getenv("JWT_SECRET"))
	settingsService := services.NewSettingsService(settingsRepository)
	investmentService := services.NewInvestmentService(investmentRepository)
	transactionService := services.NewTransactionService(transactionRepository)
	userService := services.NewUserService(userRepository, investmentRepository)

	investmentHandler := api.NewInvestmentHandler(investmentService, &investmentUpdateRepository, transactionRepository, &userRepository)
	investmentUpdateHandler := api.NewInvestmentUpdateHandler(investmentService, investmentUpdateService)
	transactionHandler := api.NewTransactionHandler(transactionService, investmentService)
	authHandler := api.NewAuthHandler(&userRepository, tokenService, os.Getenv("DOMAIN"))
	userHandler := api.NewUserHandler(&userRepository)
	settingsHandler := api.NewSettingsHandler(settingsService)
	feedbackHandler := api.NewFeedbackHandler(os.Getenv("DISCORD_BOT_TOKEN"), os.Getenv("DISCORD_FEEDBACK_CHANNEL_ID"), &userRepository)
	stripeHandler := api.NewStripeHandler(
		os.Getenv("STRIPE_KEY"),
		os.Getenv("STRIPE_WEBHOOK_SECRET"),
		userService,
		os.Getenv("FRONTEND_HOST"),
	)
	contactHandler := api.NewContactHandler(os.Getenv("DISCORD_BOT_TOKEN"), os.Getenv("DISCORD_CONTACT_CHANNEL_ID"))

	handlers := api.NewHandlers(
		investmentHandler,
		investmentUpdateHandler,
		transactionHandler,
		authHandler,
		userHandler,
		settingsHandler,
		feedbackHandler,
		stripeHandler,
		contactHandler,
	)
	middlewares := api.NewMiddlewares(api.TokenMiddleware(tokenService))
	server := api.NewServer(
		os.Getenv("GOOGLE_CLIENT_ID"),
		os.Getenv("GOOGLE_CLIENT_SECRET"),
		os.Getenv("GORILLA_SESSIONS_SECRET"),
		os.Getenv("FRONTEND_HOST"),
		handlers,
		middlewares,
	)

	log.Fatal(server.Start(8888))
}
