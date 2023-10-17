package api

import (
	"encoding/json"
	"fmt"
	"growfolio/domain/services"
	"io"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/stripe/stripe-go/v75"
	"github.com/stripe/stripe-go/v75/checkout/session"
	"github.com/stripe/stripe-go/webhook"
)

type StripeHandler struct {
	stripeWebhookSecret string
	userRepository      services.UserRepository
}

func NewStripeHandler(stripeKey, stripeWebhookSecret string, userRepository services.UserRepository) StripeHandler {
	stripe.Key = stripeKey
	return StripeHandler{
		stripeWebhookSecret: stripeWebhookSecret,
		userRepository:      userRepository,
	}
}

type checkoutSessionDto struct {
	URL string `json:"url"`
}

func (h StripeHandler) CreateCheckoutSession(c *gin.Context) (response[checkoutSessionDto], error) {
	tokenClaims := c.Value("token").(*jwt.Token).Claims.(jwt.MapClaims)
	tokenUserID := tokenClaims["userId"].(string)

	user, err := h.userRepository.FindByID(tokenUserID)
	if err != nil {
		return response[checkoutSessionDto]{}, fmt.Errorf("failed to find user by id: %s: %w", tokenUserID, err)
	}

	domain := "http://localhost:8080"
	params := &stripe.CheckoutSessionParams{
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String("price_1O1CwUAyXSBS0v1N9WDxsPBd"),
				Quantity: stripe.Int64(1),
			},
		},
		Mode:          stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		SuccessURL:    stripe.String(domain + "?success=true"),
		CancelURL:     stripe.String(domain + "?canceled=true"),
		CustomerEmail: stripe.String(user.Email),
	}

	session, err := session.New(params)
	if err != nil {
		return response[checkoutSessionDto]{}, err
	}

	return newResponse(http.StatusOK, checkoutSessionDto{URL: session.URL}), nil
}

func (h StripeHandler) Webhook(c *gin.Context) (response[empty], error) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		return response[empty]{}, fmt.Errorf("failed to read body %w", err)
	}

	event, err := webhook.ConstructEvent(body, c.Request.Header.Get("Stripe-Signature"), h.stripeWebhookSecret)
	if err != nil {
		return response[empty]{}, fmt.Errorf("failed to construct event %w", err)
	}

	switch event.Type {
	case "checkout.session.completed":
		var checkoutSession stripe.CheckoutSession
		err := json.Unmarshal(event.Data.Raw, &checkoutSession)
		if err != nil {
			return response[empty]{}, fmt.Errorf("failed to unmarshal event %w", err)
		}

		if checkoutSession.Customer != nil {
			err := h.userRepository.UpdateStripeCustomerIDByEmail(
				checkoutSession.CustomerEmail,
				checkoutSession.Customer.ID,
			)
			if err != nil {
				return response[empty]{}, fmt.Errorf("failed to update user with stripe customer id: %w", err)
			}
		}
	default:
		slog.Info("Unhandled event type: " + event.Type)
	}

	return newEmptyResponse(http.StatusOK), nil
}
