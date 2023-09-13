package domain

import "errors"

var ErrInvestmentNotFound = errors.New("investment not found")

var ErrInvestmentUpdateNotFound = errors.New("investment update not found")

var ErrUserNotFound = errors.New("user not found")

var ErrTransactionNotFound = errors.New("transaction not found")
