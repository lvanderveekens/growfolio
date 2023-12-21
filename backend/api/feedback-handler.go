package api

import (
	"errors"
	"fmt"
	"growfolio/domain/services"
	"net/http"

	"github.com/bwmarrin/discordgo"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type FeedbackHandler struct {
	DiscordBotToken          string
	DiscordFeedbackChannelID string
	UserRepository           services.UserRepository
}

func NewFeedbackHandler(
	discordBotToken,
	discordFeedbackChannelID string,
	userRepository services.UserRepository,
) FeedbackHandler {
	return FeedbackHandler{
		DiscordBotToken:          discordBotToken,
		DiscordFeedbackChannelID: discordFeedbackChannelID,
		UserRepository:           userRepository,
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
	tokenClaims := c.Value("token").(*jwt.Token).Claims.(jwt.MapClaims)
	tokenUserID := tokenClaims["userId"].(string)

	user, err := h.UserRepository.FindByID(tokenUserID)
	if err != nil {
		return response[empty]{}, fmt.Errorf("failed to find user: %w", err)
	}

	var req submitFeedbackRequest
	err = c.ShouldBindJSON(&req)
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

	msg := "Received feedback\nUser: " + user.Email + "\nPageURL: " + req.PageURL + "\nText: " + req.Text
	_, err = discord.ChannelMessageSend(h.DiscordFeedbackChannelID, msg)
	if err != nil {
		return response[empty]{}, err
	}

	return newEmptyResponse(http.StatusOK), nil
}
