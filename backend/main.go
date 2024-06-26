package main

import (
	"fmt"
	"log"
	"log/slog"
	"os"
	"strconv"
	"time"

	"growfolio/internal/api"
	"growfolio/internal/discord"
	"growfolio/internal/domain/services"
	"growfolio/internal/postgres"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/jackc/pgx/stdlib"

	"github.com/joho/godotenv"

	"github.com/jmoiron/sqlx"

	"github.com/robfig/cron/v3"
)

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	slog.SetDefault(logger)

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

	investmentUpdateRepository := postgres.NewInvestmentUpdateRepository(db)
	investmentRepository := postgres.NewInvestmentRepository(db, investmentUpdateRepository)
	investmentUpdateService := services.NewInvestmentUpdateService(investmentUpdateRepository)
	userRepository := postgres.NewUserRepository(db)
	settingsRepository := postgres.NewSettingsRepository(db)

	eventHandlers := []services.EventHandler{
		discord.NewDiscordEventHandler(os.Getenv("DISCORD_BOT_TOKEN"), os.Getenv("DISCORD_EVENT_CHANNEL_ID")),
	}
	eventPublisher := services.NewEventPublisher(eventHandlers)

	tokenService := api.NewTokenService(
		os.Getenv("JWT_SECRET"),
		mustParseInt(os.Getenv("JWT_EXPIRE_AFTER_HOURS")),
		os.Getenv("DOMAIN"),
		mustParseBool(os.Getenv("USE_SECURE_COOKIES")),
	)
	settingsService := services.NewSettingsService(settingsRepository)
	investmentService := services.NewInvestmentService(investmentRepository, investmentUpdateService)
	userService := services.NewUserService(userRepository, investmentService, eventPublisher, settingsService)
	demoUserCleaner := services.NewDemoUserCleaner(userService)
	investmentUpdateCSVImporter := api.NewInvestmentUpdateCSVImporter(investmentUpdateService)

	investmentHandler := api.NewInvestmentHandler(investmentService, investmentUpdateService, &userRepository, investmentUpdateCSVImporter)
	investmentUpdateHandler := api.NewInvestmentUpdateHandler(investmentService, investmentUpdateService)
	authHandler := api.NewAuthHandler(userService, tokenService)
	userHandler := api.NewUserHandler(&userRepository)
	settingsHandler := api.NewSettingsHandler(settingsService)
	feedbackHandler := api.NewFeedbackHandler(os.Getenv("DISCORD_BOT_TOKEN"), os.Getenv("DISCORD_FEEDBACK_CHANNEL_ID"), &userRepository)
	stripeHandler := api.NewStripeHandler(
		os.Getenv("STRIPE_KEY"),
		os.Getenv("STRIPE_WEBHOOK_SECRET"),
		os.Getenv("STRIPE_PRICE_ID"),
		userService,
		os.Getenv("FRONTEND_HOST"),
	)
	contactHandler := api.NewContactHandler(os.Getenv("DISCORD_BOT_TOKEN"), os.Getenv("DISCORD_CONTACT_CHANNEL_ID"))
	demoHandler := api.NewDemoHandler(userService, investmentService, investmentUpdateCSVImporter, tokenService)

	handlers := api.NewHandlers(
		investmentHandler,
		investmentUpdateHandler,
		authHandler,
		userHandler,
		settingsHandler,
		feedbackHandler,
		stripeHandler,
		contactHandler,
		demoHandler,
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

	c := cron.New(cron.WithSeconds(), cron.WithChain(cron.SkipIfStillRunning(cron.DefaultLogger)))
	c.AddFunc("0 0 * * * *", demoUserCleaner.Clean) // every hour
	c.Start()

	log.Fatal(server.Start(8888))
}

func mustParseInt(s string) int {
	i, err := strconv.Atoi(s)
	if err != nil {
		panic(err)
	}
	return i
}

func mustParseBool(s string) bool {
	b, err := strconv.ParseBool(s)
	if err != nil {
		panic(err)
	}
	return b
}
