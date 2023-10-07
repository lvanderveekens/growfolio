package api

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/bwmarrin/discordgo"
	"github.com/gin-gonic/gin"
)

type FeedbackHandler struct {
	DiscordBotToken          string
	DiscordFeedbackChannelID string
}

func NewFeedbackHandler(discordBotToken, discordFeedbackChannelID string) FeedbackHandler {
	return FeedbackHandler{
		DiscordBotToken:          discordBotToken,
		DiscordFeedbackChannelID: discordFeedbackChannelID,
	}
}

type submitFeedbackRequest struct {
	Text    string `json:"text"`
	PageURL string `json:"pageUrl"`
}

func (r submitFeedbackRequest) validate() error {
	if r.Text == "" {
		return errors.New("field 'text' is missing")
	}
	if r.PageURL == "" {
		return errors.New("field 'pageUrl' is missing")
	}
	return nil
}

func (h FeedbackHandler) SubmitFeedback(c *gin.Context) (response[empty], error) {
	var req submitFeedbackRequest
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

	msg := "Received feedback\nText: " + req.Text + "\nPageURL: " + req.PageURL
	_, err = discord.ChannelMessageSend(h.DiscordFeedbackChannelID, msg)
	if err != nil {
		return response[empty]{}, err
	}

	return newEmptyResponse(http.StatusOK), nil
}
