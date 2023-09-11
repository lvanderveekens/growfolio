package slices

func Map[T any, M any](a []T, f func(T) M) []M {
	n := make([]M, len(a))
	for i, e := range a {
		n[i] = f(e)
	}
	return n
}

func MapNotNull[T any, M any](a []T, f func(T) *M) []M {
	n := make([]M, len(a))
	for i, e := range a {
		nullable := f(e)
		if nullable != nil {
			n[i] = *nullable
		}
	}
	return n
}


func AssociateBy[T any, V comparable](src []T, key func(T) V) map[V]T {
	var result = make(map[V]T)
	for _, v := range src {
		result[key(v)] = v
	}
	return result
}

func Deduplicate[T comparable](input []T) []T {
	n := make([]T, 0)
	m := make(map[T]bool)

	for _, val := range input {
		if _, ok := m[val]; !ok {
			m[val] = true
			n = append(n, val)
		}
	}

	return n
}