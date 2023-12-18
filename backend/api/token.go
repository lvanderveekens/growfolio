package api

import (
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type TokenService struct {
	jwtSecret          string
	jwtExireAfterHours int
	domain             string
	useSecureCookies   bool
}

func NewTokenService(jwtSecret string, jwtExpireAfterHours int, domain string, useSecureCookie bool) TokenService {
	return TokenService{
		jwtSecret:          jwtSecret,
		jwtExireAfterHours: jwtExpireAfterHours,
		domain:             domain,
		useSecureCookies:   useSecureCookie,
	}
}

func (s TokenService) generateToken(userID string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"exp":    time.Now().Add(time.Duration(s.jwtExireAfterHours) * time.Hour).Unix(),
		"userId": userID,
	})

	return token.SignedString([]byte(s.jwtSecret))
}

func (s TokenService) validateToken(tokenString string) (*jwt.Token, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.jwtSecret), nil
	})
	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}
	return token, nil
}

func (s TokenService) setCookie(c *gin.Context, jwt string) {
	c.SetCookie("token", jwt, s.jwtExireAfterHours*60*60, "/", s.domain, s.useSecureCookies, true)
}

func (s TokenService) unsetCookie(c *gin.Context) {
	c.SetCookie("token", "", -1, "/", s.domain, false, true)
}

func TokenMiddleware(tokenService TokenService) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString, err := c.Cookie("token")
		if err != nil {
			fmt.Printf("failed to read token cookie: %s\n", err.Error())
			c.JSON(401, NewError(401, "Unauthorized"))
			c.Abort()
			return
		}

		token, err := tokenService.validateToken(tokenString)
		if err != nil {
			fmt.Printf("invalid token: %s\n", err.Error())
			c.JSON(401, NewError(401, "Unauthorized"))
			c.Abort()
			return
		}

		c.Set("token", token)
	}
}
