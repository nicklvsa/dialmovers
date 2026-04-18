package main

import (
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/dialmovers/game-server/internal/config"
	"github.com/dialmovers/game-server/internal/handler"
	"github.com/dialmovers/game-server/internal/middleware"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize logger
	initLogger(cfg.Log)

	log.Info().Msg("Starting DialMovers Game Server...")

	// Set Gin mode
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Create router
	router := gin.New()

	// Add middleware
	router.Use(gin.Recovery())
	router.Use(middleware.CORS())
	router.Use(middleware.Logger(log.Logger))

	// Create handlers
	wsHandler := handler.NewWebSocketHandler(cfg, log.Logger)

	// Register routes
	router.GET("/ws/:user_id", wsHandler.HandleWebSocket)
	router.GET("/health", wsHandler.HandleHealth)
	router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"service": "DialMovers Game Server",
			"version": "1.0.0",
			"status":  "running",
		})
	})

	// Start server in a goroutine
	go func() {
		addr := fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port)
		log.Info().Str("addr", addr).Msg("Server listening")
		if err := router.Run(addr); err != nil {
			log.Fatal().Err(err).Msg("Failed to start server")
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info().Msg("Shutting down server...")
	wsHandler.Shutdown()
	log.Info().Msg("Server stopped")
}

// initLogger initializes the global logger
func initLogger(cfg config.LogConfig) {
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix

	// Set log level
	level, err := zerolog.ParseLevel(cfg.Level)
	if err != nil {
		level = zerolog.InfoLevel
	}
	zerolog.SetGlobalLevel(level)

	// Set output format
	if cfg.Format == "pretty" {
		log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
	}
}
