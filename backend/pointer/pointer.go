package pointer

func GetOrDefault[T any](nillable *T, defaultValue T) T {
	if nillable == nil {
		return defaultValue
	}
	return *nillable
}
