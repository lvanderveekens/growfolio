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
	portalsession "github.com/stripe/stripe-go/v75/billingportal/session"
	checkoutsession "github.com/stripe/stripe-go/v75/checkout/session"
	"github.com/stripe/stripe-go/v75/webhook"
)

type StripeHandler struct {
	stripeWebhookSecret string
	stripePriceID       string
	userService         services.UserService
	frontendHost        string
}

func NewStripeHandler(
	stripeKey,
	stripeWebhookSecret,
	stripePriceID string,
	userService services.UserService,
	frontendHost string,
) StripeHandler {
	stripe.Key = stripeKey
	return StripeHandler{
		stripeWebhookSecret: stripeWebhookSecret,
		stripePriceID:       stripePriceID,
		userService:         userService,
		frontendHost:        frontendHost,
	}
}

type createCheckoutSessionRequest struct {
	CancelURL string `json:"cancelUrl"`
}

type createPortalSessionRequest struct {
	ReturnURL string `json:"returnUrl"`
}

type sessionDto struct {
	URL string `json:"url"`
}

func (h StripeHandler) CreateCheckoutSession(c *gin.Context) (response[sessionDto], error) {
	tokenClaims := c.Value("token").(*jwt.Token).Claims.(jwt.MapClaims)
	tokenUserID := tokenClaims["userId"].(string)

	var request createCheckoutSessionRequest
	err := c.ShouldBindJSON(&request)
	if err != nil {
		return response[sessionDto]{}, NewError(http.StatusBadRequest, err.Error())
	}

	user, err := h.userService.FindByID(tokenUserID)
	if err != nil {
		return response[sessionDto]{}, fmt.Errorf("failed to find user by id: %s: %w", tokenUserID, err)
	}

	params := &stripe.CheckoutSessionParams{
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(h.stripePriceID),
				Quantity: stripe.Int64(1),
			},
		},
		Mode:          stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		SuccessURL:    stripe.String(h.frontendHost + "/checkout/success"),
		CancelURL:     stripe.String(request.CancelURL),
		CustomerEmail: stripe.String(user.Email),
	}

	checkoutSession, err := checkoutsession.New(params)
	if err != nil {
		return response[sessionDto]{}, err
	}

	return newResponse(http.StatusOK, sessionDto{URL: checkoutSession.URL}), nil
}

func (h StripeHandler) CreatePortalSession(c *gin.Context) (response[sessionDto], error) {
	tokenClaims := c.Value("token").(*jwt.Token).Claims.(jwt.MapClaims)
	tokenUserID := tokenClaims["userId"].(string)

	var request createPortalSessionRequest
	err := c.ShouldBindJSON(&request)
	if err != nil {
		return response[sessionDto]{}, NewError(http.StatusBadRequest, err.Error())
	}

	user, err := h.userService.FindByID(tokenUserID)
	if err != nil {
		return response[sessionDto]{}, fmt.Errorf("failed to find user by id: %s: %w", tokenUserID, err)
	}

	if user.StripeCustomerID == nil {
		return response[sessionDto]{}, fmt.Errorf("user does not have a stripe customer id")
	}

	params := &stripe.BillingPortalSessionParams{
		Customer:  user.StripeCustomerID,
		ReturnURL: stripe.String(request.ReturnURL),
	}

	portalSession, err := portalsession.New(params)
	if err != nil {
		return response[sessionDto]{}, err
	}

	return newResponse(http.StatusOK, sessionDto{URL: portalSession.URL}), nil
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

	slog.Info("Received event: " + string(event.Data.Raw))

	switch event.Type {
	case "checkout.session.completed":
		var checkoutSession stripe.CheckoutSession
		err := json.Unmarshal(event.Data.Raw, &checkoutSession)
		if err != nil {
			return response[empty]{}, fmt.Errorf("failed to unmarshal event %w", err)
		}

		if checkoutSession.Customer == nil {
			return response[empty]{}, fmt.Errorf("stripe customer id not found")
		}

		user, err := h.userService.FindByEmail(checkoutSession.CustomerEmail)
		if err != nil {
			return response[empty]{}, fmt.Errorf("failed to find user: %w", err)
		}

		err = h.userService.UpgradeToPremium(user, checkoutSession.Customer.ID)
		if err != nil {
			return response[empty]{}, fmt.Errorf("failed to upgrade user to premium: %w", err)
		}
	case "customer.subscription.deleted":
		var subscription stripe.Subscription
		err := json.Unmarshal(event.Data.Raw, &subscription)
		if err != nil {
			return response[empty]{}, fmt.Errorf("failed to unmarshal event %w", err)
		}

		if subscription.Customer == nil {
			return response[empty]{}, fmt.Errorf("stripe customer id not found")
		}

		user, err := h.userService.FindByStripeCustomerID(subscription.Customer.ID)
		if err != nil {
			return response[empty]{}, fmt.Errorf("failed to find user: %w", err)
		}

		err = h.userService.DowngradeToBasic(user)
		if err != nil {
			return response[empty]{}, fmt.Errorf("failed to downgrade user to basic: %w", err)
		}
	default:
		slog.Info("Unhandled event type: " + string(event.Type))
	}

	return newEmptyResponse(http.StatusOK), nil
}
