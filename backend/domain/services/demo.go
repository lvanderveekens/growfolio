package services

import (
	"log/slog"
)

type DemoUserCleaner struct {
}

func NewDemoUserCleaner() DemoUserCleaner {
	return DemoUserCleaner{}
}

func (c DemoUserCleaner) Clean() {
	slog.Info("Cleaning demo users...")

	// JWTs are valid for 24 hours, so I can probably clean up demo users 24 hours after creation

	// TODO: clean up demo user data
	// TODO: clean up demo user
}
