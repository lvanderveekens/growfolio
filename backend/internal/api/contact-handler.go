package api

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/bwmarrin/discordgo"
	"github.com/gin-gonic/gin"
)

type ContactHandler struct {
	DiscordBotToken         string
	DiscordContactChannelID string
}

func NewContactHandler(
	discordBotToken,
	discordContactChannelID string,
) ContactHandler {
	return ContactHandler{
		DiscordBotToken:         discordBotToken,
		DiscordContactChannelID: discordContactChannelID,
	}
}

type sendContactMessageRequest struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	Message string `json:"message"`
}

func (r sendContactMessageRequest) validate() error {
	if r.Name == "" {
		return errors.New("field 'name' is missing")
	}
	if r.Email == "" {
		return errors.New("field 'email' is missing")
	}
	if r.Message == "" {
		return errors.New("field 'message' is missing")
	}
	return nil
}

func (h ContactHandler) SendContactMessage(c *gin.Context) (response[empty], error) {
	var req sendContactMessageRequest
	err := c.ShouldBindJSON(&req)
	if err != nil {
		return response[empty]{}, fmt.Errorf("failed to decode request body: %w", err)
	}
	if err := req.validate(); err != nil {
		return response[empty]{}, NewError(http.StatusBadRequest, err.Error())
	}

	discord, err := discordgo.New("Bot " + h.DiscordBotToken)
	if err != nil {
		return response[empty]{}, err
	}

	msg := "Received contact message\nName: " + req.Name + "\nEmail: " + req.Email + "\nMessage: " + req.Message
	_, err = discord.ChannelMessageSend(h.DiscordContactChannelID, msg)
	if err != nil {
		return response[empty]{}, err
	}

	return newEmptyResponse(http.StatusOK), nil
}
