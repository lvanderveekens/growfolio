package main

import (
	"growfolio/internal/http"
	"log"
)

func main() {
	var handlers = http.NewHandlers(http.NewPingHandler())
	var server = http.NewServer(handlers)

	log.Fatal(server.Start(8888))
}
