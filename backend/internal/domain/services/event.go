package services

import "log/slog"

type EventHandler interface {
	Handle(event any) error
}

type EventPublisher struct {
	eventHandlers []EventHandler
}

func NewEventPublisher(eventHandlers []EventHandler) EventPublisher {
	return EventPublisher{
		eventHandlers: eventHandlers,
	}
}

func (p EventPublisher) Publish(event any) {
	for _, eventHandler := range p.eventHandlers {
		go func(h EventHandler) {
			err := h.Handle(event)
			if err != nil {
				slog.Error("Error handling event: " + err.Error())
			}
		}(eventHandler)
	}
}
