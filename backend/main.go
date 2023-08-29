package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"growfolio/api"
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
	transactionRepository := postgres.NewTransactionRepository(db)
	userRepository := postgres.NewUserRepository(db)

	tokenService := api.NewTokenService(os.Getenv("JWT_SECRET"))

	investmentHandler := api.NewInvestmentHandler(investmentRepository)
	investmentUpdateHandler := api.NewInvestmentUpdateHandler(investmentRepository)
	transactionHandler := api.NewTransactionHandler(transactionRepository, investmentRepository)
	authHandler := api.NewAuthHandler(userRepository, tokenService)
	userHandler := api.NewUserHandler(userRepository)

	handlers := api.NewHandlers(investmentHandler, investmentUpdateHandler, transactionHandler, authHandler, userHandler)
	middlewares := api.NewMiddlewares(api.TokenMiddleware(userRepository, tokenService))
	server := api.NewServer(
		os.Getenv("GOOGLE_CLIENT_ID"),
		os.Getenv("GOOGLE_CLIENT_SECRET"),
		os.Getenv("GORILLA_SESSIONS_SECRET"),
		handlers,
		middlewares,
	)

	log.Fatal(server.Start(8888))
}
