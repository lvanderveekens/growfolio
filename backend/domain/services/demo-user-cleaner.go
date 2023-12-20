package services

import (
	"fmt"
	"log/slog"
	"time"
)

type DemoUserCleaner struct {
	userService UserService
}

func NewDemoUserCleaner(
	userService UserService,
) DemoUserCleaner {
	return DemoUserCleaner{
		userService: userService,
	}
}

func (c DemoUserCleaner) Clean() {
	slog.Info("Cleaning demo users...")

	// tokens are only valid for 24 hours
	createdBefore := time.Now().Add(-time.Duration(24) * time.Hour)
	demoUsers, err := c.userService.FindDemoUsersCreatedBefore(createdBefore)
	if err != nil {
		slog.Error(fmt.Sprintf("failed to find demo users: %+v", err))
		return
	}

	for _, demoUser := range demoUsers {
		err := c.userService.DeleteByID(demoUser.ID)
		if err != nil {
			slog.Error(fmt.Sprintf("failed to delete demo user: %+v", err))
			continue
		}
		slog.Info(fmt.Sprintf("Deleted demo user %s", demoUser.ID))
	}

	// TODO: clean up demo user data
	// TODO: do not forget settings
}
