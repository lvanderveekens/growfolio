package domain

import "errors"

var ErrInvestmentNotFound = errors.New("investment not found")

var ErrInvestmentUpdateNotFound = errors.New("investment update not found")

var ErrUserNotFound = errors.New("user not found")

var ErrTransactionNotFound = errors.New("transaction not found")

var ErrSettingsNotFound = errors.New("settings not found")

var ErrMaxInvestmentsReached = errors.New("max investments reached")

var ErrInvestmentIsLocked = errors.New("investment is locked")
