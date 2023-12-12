package pointer

import "strconv"

func GetOrDefault[T any](nillable *T, defaultValue T) T {
	if nillable == nil {
		return defaultValue
	}
	return *nillable
}

func StringOrNil(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func IntToString(i *int64) string {
	if i == nil {
		return ""
	}
	return strconv.FormatInt(*i, 10)
}
