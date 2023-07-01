package http

type Error struct {
	Status int    `json:"status"`
	Err    string `json:"error"`
}

func NewError(status int, err string) Error {
	return Error{
		Status: status,
		Err:    err,
	}
}

func (e Error) Error() string {
	return e.Err
}
