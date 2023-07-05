package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type PingHandler struct {
}

func NewPingHandler() *PingHandler {
	return &PingHandler{}
}

func (h *PingHandler) HandlePing(c *gin.Context) error {
	c.JSON(http.StatusOK, map[string]any{"message": "PONG!"})
	return nil
}
