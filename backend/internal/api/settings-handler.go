package api

import (
	"fmt"
	"growfolio/internal/domain"
	"growfolio/internal/domain/services"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type SettingsHandler struct {
	settingsService services.SettingsService
}

func NewSettingsHandler(settingsService services.SettingsService) SettingsHandler {
	return SettingsHandler{settingsService: settingsService}
}

func (h SettingsHandler) GetSettings(c *gin.Context) (response[settingsDto], error) {
	tokenClaims := c.Value("token").(*jwt.Token).Claims.(jwt.MapClaims)
	tokenUserID := tokenClaims["userId"].(string)

	settings, err := h.settingsService.FindByUserID(tokenUserID)
	if err != nil {
		return response[settingsDto]{}, fmt.Errorf("failed to find settings by user id %s: %w", tokenUserID, err)
	}

	return newResponse(http.StatusOK, newSettingsDto(string(settings.Currency))), nil
}

func (h SettingsHandler) UpdateSettings(c *gin.Context) (response[settingsDto], error) {
	tokenClaims := c.Value("token").(*jwt.Token).Claims.(jwt.MapClaims)
	tokenUserID := tokenClaims["userId"].(string)

	var request updateSettingsRequest
	err := c.ShouldBindJSON(&request)
	if err != nil {
		return response[settingsDto]{}, fmt.Errorf("failed to decode request body: %w", err)
	}

	updated, err := h.settingsService.Update(domain.NewSettings(tokenUserID, domain.Currency(request.Currency)))
	if err != nil {
		return response[settingsDto]{}, fmt.Errorf("failed to update settings: %w", err)
	}

	return newResponse(http.StatusOK, newSettingsDto(string(updated.Currency))), nil
}

type settingsDto struct {
	Currency string `json:"currency"`
}

func newSettingsDto(currency string) settingsDto {
	return settingsDto{
		Currency: currency,
	}
}

type updateSettingsRequest struct {
	Currency string `json:"currency"`
}
