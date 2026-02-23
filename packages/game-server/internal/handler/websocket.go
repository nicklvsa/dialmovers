package handler

import (
	"net/http"
	"time"

	"github.com/dialmovers/game-server/internal/config"
	"github.com/dialmovers/game-server/internal/domain"
	"github.com/dialmovers/game-server/pkg/websocket"
	gorillaws "github.com/gorilla/websocket"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
)

// WebSocketHandler handles WebSocket connections
type WebSocketHandler struct {
	hub     *websocket.Hub
	config  *config.Config
	logger  zerolog.Logger
	upgrader gorillaws.Upgrader
}

// NewWebSocketHandler creates a new WebSocket handler
func NewWebSocketHandler(cfg *config.Config, logger zerolog.Logger) *WebSocketHandler {
	hub := websocket.NewHub(logger)
	go hub.Run()

	return &WebSocketHandler{
		hub:    hub,
		config: cfg,
		logger: logger,
		upgrader: gorillaws.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin: func(r *http.Request) bool {
				return true // Allow all origins in development
			},
		},
	}
}

// HandleWebSocket handles WebSocket upgrade requests
func (h *WebSocketHandler) HandleWebSocket(c *gin.Context) {
	userID := c.Param("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	conn, err := h.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		h.logger.Error().Err(err).Str("user_id", userID).Msg("Failed to upgrade connection")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upgrade connection"})
		return
	}

	// Create connection
	wsConn := websocket.NewConnection(
		userID,
		conn,
		domain.UserID(userID),
		h.hub,
		h.logger,
		h.config.WS.WriteTimeout,
	)

	// Register connection
	h.hub.Register(wsConn)

	// Start pumps
	go wsConn.WritePump(h.config.WS.PingInterval, h.config.WS.WriteTimeout)
	go wsConn.ReadPump(h.config.WS.MessageLimit, h.config.WS.PingAckTimeout)

	h.logger.Info().
		Str("user_id", userID).
		Str("connection_id", wsConn.ID).
		Msg("WebSocket connection established")
}

// HandleHealth returns health status
func (h *WebSocketHandler) HandleHealth(c *gin.Context) {
	stats := h.hub.GetStats()

	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"timestamp": time.Now().Format(time.RFC3339),
		"stats":     stats,
	})
}

// GetHub returns the hub instance
func (h *WebSocketHandler) GetHub() *websocket.Hub {
	return h.hub
}

// Shutdown gracefully shuts down the handler
func (h *WebSocketHandler) Shutdown() {
	h.logger.Info().Msg("Shutting down WebSocket handler")
	// TODO: Implement graceful shutdown of all connections
}
