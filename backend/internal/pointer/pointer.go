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

func IntOrNil(i int64) *int64 {
	if i == 0 {
		return nil
	}
	return &i
}

func Of[T any](i T) *T {
	return &i
}
