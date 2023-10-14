package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/stripe/stripe-go/v75"
	"github.com/stripe/stripe-go/v75/checkout/session"
)

type StripeHandler struct {
	stripeKey string
}

func NewStripeHandler(stripeKey string) StripeHandler {
	return StripeHandler{
		stripeKey: stripeKey,
	}
}

type checkoutSessionDto struct {
	URL string `json:"url"`
}

func (h StripeHandler) CreateCheckoutSession(c *gin.Context) (response[checkoutSessionDto], error) {
	stripe.Key = h.stripeKey

	domain := "http://localhost:8080"
	params := &stripe.CheckoutSessionParams{
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String("price_1O1CwUAyXSBS0v1N9WDxsPBd"),
				Quantity: stripe.Int64(1),
			},
		},
		Mode:       stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		SuccessURL: stripe.String(domain + "?success=true"),
		CancelURL:  stripe.String(domain + "?canceled=true"),
	}

	s, err := session.New(params)
	if err != nil {
		return response[checkoutSessionDto]{}, err
	}

	return newResponse(http.StatusOK, checkoutSessionDto{URL: s.URL}), nil
}
