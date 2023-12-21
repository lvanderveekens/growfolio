package discord

import (
	"fmt"
	"growfolio/internal/domain"
	"log/slog"

	"github.com/bwmarrin/discordgo"
)

type DiscordEventHandler struct {
	DiscordBotToken       string
	DiscordEventChannelID string
}

func NewDiscordEventHandler(discordBotToken, discordEventChannelID string) DiscordEventHandler {
	return DiscordEventHandler{
		DiscordBotToken:       discordBotToken,
		DiscordEventChannelID: discordEventChannelID,
	}
}

func (h DiscordEventHandler) Handle(event any) error {
	switch v := event.(type) {
	case domain.UserCreatedEvent:
		if !v.User.IsDemo {
			h.sendMessageToChannel("New user: " + v.User.Email)
		}
	default:
		slog.Warn(fmt.Sprintf("Ignoring unhandled event: %+v", event))
	}

	return nil
}

func (h DiscordEventHandler) sendMessageToChannel(message string) error {
	discordSession, err := discordgo.New("Bot " + h.DiscordBotToken)
	if err != nil {
		return fmt.Errorf("failed to create discord session: %w", err)
	}

	_, err = discordSession.ChannelMessageSend(h.DiscordEventChannelID, message)
	return err
}
