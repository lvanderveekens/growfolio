package pointer

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
