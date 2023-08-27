package api

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/markbates/goth/gothic"
)

type AuthHandler struct {
}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{}
}

func (h *AuthHandler) Begin(c *gin.Context) (*response[empty], error) {
	gothic.GetProviderName = getProviderName(c)
	if user, err := gothic.CompleteUserAuth(c.Writer, c.Request); err == nil {
		fmt.Printf("Hi, %#v\n", user)
	} else {
		gothic.BeginAuthHandler(c.Writer, c.Request)
	}

	return newEmptyResponse(http.StatusOK), nil
}

func (h *AuthHandler) Callback(c *gin.Context) (*response[empty], error) {
	gothic.GetProviderName = getProviderName(c)
	user, err := gothic.CompleteUserAuth(c.Writer, c.Request)
	if err != nil {
		return nil, err
	}

	// TODO: get or create user if does not exist
	// TODO: create jwt and return as cookie

	fmt.Printf("Hi, %#v\n", user)
	return newEmptyResponse(http.StatusOK), nil
}

func getProviderName(c *gin.Context) func(*http.Request) (string, error) {
	return func(*http.Request) (string, error) { return c.Param("provider"), nil }
}
