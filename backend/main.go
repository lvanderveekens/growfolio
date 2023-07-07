package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"growfolio/internal/api"
	"growfolio/internal/database/postgres"

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

	m, err := migrate.New("file://migrations", postgresConnString)
	if err != nil {
		log.Fatal("Failed to create Migrate instance: ", err)
	}
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		log.Fatal("Failed to migrate the database: ", err)
	}

	var investmentRepository = postgres.NewInvestmentRepository(db)
	var handlers = api.NewHandlers(api.NewPingHandler(), api.NewInvestmentHandler(investmentRepository))
	var server = api.NewServer(handlers)

	log.Fatal(server.Start(8888))
}
