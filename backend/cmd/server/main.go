// Server stats the calculator API on port 8080 by default
package main

import (
	"log"
	"net/http"
	"os"

	"github.com/CamiloLM/sezzle-calculator/backend/internal/api"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("listening on port :%s", port)
	if err := http.ListenAndServe(":"+port, api.NewRouter()); err != nil {
		log.Fatal(err)
	}
}
