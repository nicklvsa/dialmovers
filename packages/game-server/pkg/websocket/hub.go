package websocket

import (
	"encoding/json"
	"sync"
	"time"

	"github.com/dialmovers/game-server/internal/domain"
	"github.com/rs/zerolog"
)

// Hub maintains the set of active clients and broadcasts messages
type Hub struct {
	// Registered connections
	connections map[*Connection]bool

	// Map from GameID to connections
	games map[domain.GameID]map[*Connection]bool

	// Register requests from connections
	register chan *Connection

	// Unregister requests from connections
	unregister chan *Connection

	// Message handlers
	broadcast chan *BroadcastMessage

	// Logger
	logger zerolog.Logger

	// Mutex for thread safety
	mu sync.RWMutex
}

// BroadcastMessage represents a message to broadcast
type BroadcastMessage struct {
	Event    domain.Event
	Excluded *Connection
	GameID   *domain.GameID
}

// NewHub creates a new Hub instance
func NewHub(logger zerolog.Logger) *Hub {
	return &Hub{
		connections: make(map[*Connection]bool),
		games:       make(map[domain.GameID]map[*Connection]bool),
		register:    make(chan *Connection),
		unregister:  make(chan *Connection),
		broadcast:   make(chan *BroadcastMessage, 256),
		logger:      logger,
	}
}

// Run starts the hub's main loop
func (h *Hub) Run() {
	for {
		select {
		case conn := <-h.register:
			h.handleRegister(conn)

		case conn := <-h.unregister:
			h.handleUnregister(conn)

		case message := <-h.broadcast:
			h.handleBroadcast(message)
		}
	}
}

// Register registers a new connection
func (h *Hub) Register(conn *Connection) {
	h.register <- conn
}

// Unregister unregisters a connection
func (h *Hub) Unregister(conn *Connection) {
	h.unregister <- conn
}

// Broadcast sends a message to all connections
func (h *Hub) Broadcast(event domain.Event, excluded *Connection) {
	h.broadcast <- &BroadcastMessage{
		Event:    event,
		Excluded: excluded,
	}
}

// BroadcastToGame sends a message to all connections in a game
func (h *Hub) BroadcastToGame(gameID domain.GameID, event domain.Event, excluded *Connection) {
	h.broadcast <- &BroadcastMessage{
		Event:    event,
		Excluded: excluded,
		GameID:   &gameID,
	}
}

// OnMessage handles incoming messages from connections
func (h *Hub) OnMessage(conn *Connection, event domain.Event) {
	switch event.Type {
	case domain.EventTypeConnect:
		h.Broadcast(event, conn)

	case domain.EventTypeDisconnect:
		h.Broadcast(event, conn)

	case domain.EventTypeJoin:
		h.handleJoin(conn, event)

	case domain.EventTypeMove:
		h.handleMove(conn, event)
	}
}

// handleRegister handles connection registration
func (h *Hub) handleRegister(conn *Connection) {
	h.mu.Lock()
	defer h.mu.Unlock()

	h.connections[conn] = true
	h.logger.Info().
		Str("connection_id", conn.ID).
		Str("user_id", string(conn.UserID)).
		Msg("Connection registered")

	// Emit connect event
	event := domain.Event{
		Type: domain.EventTypeConnect,
		Payload: domain.ConnectionPayload{
			UserID: string(conn.UserID),
		},
		Timestamp: time.Now(),
	}
	conn.Send <- event
}

// handleUnregister handles connection unregistration
func (h *Hub) handleUnregister(conn *Connection) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, ok := h.connections[conn]; ok {
		delete(h.connections, conn)

		// Remove from games
		if conn.GameID != nil {
			if gameConns, exists := h.games[*conn.GameID]; exists {
				delete(gameConns, conn)
				if len(gameConns) == 0 {
					delete(h.games, *conn.GameID)
				}
			}
		}

		h.logger.Info().
			Str("connection_id", conn.ID).
			Str("user_id", string(conn.UserID)).
			Msg("Connection unregistered")

		// Emit disconnect event
		event := domain.Event{
			Type: domain.EventTypeDisconnect,
			Payload: domain.ConnectionPayload{
				UserID: string(conn.UserID),
			},
			Timestamp: time.Now(),
		}
		h.broadcast <- &BroadcastMessage{Event: event}

		close(conn.Send)
	}
}

// handleBroadcast handles broadcasting messages
func (h *Hub) handleBroadcast(message *BroadcastMessage) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	var targets map[*Connection]bool

	if message.GameID != nil {
		// Broadcast to game only
		targets = h.games[*message.GameID]
	} else {
		// Broadcast to all
		targets = h.connections
	}

	for conn := range targets {
		if message.Excluded != nil && conn == message.Excluded {
			continue
		}

		select {
		case conn.Send <- message.Event:
		default:
			// Channel full, close connection
			h.logger.Warn().
				Str("connection_id", conn.ID).
				Msg("Send channel full, closing connection")
			go h.Unregister(conn)
		}
	}
}

// handleJoin handles game join events
func (h *Hub) handleJoin(conn *Connection, event domain.Event) {
	// Unmarshal payload
	var payload domain.JoinPayload
	data, _ := json.Marshal(event.Payload)
	if err := json.Unmarshal(data, &payload); err != nil {
		h.logger.Error().Err(err).Msg("Failed to unmarshal join payload")
		return
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	// Update connection's game ID
	gameID := domain.GameID(payload.GameID)
	conn.GameID = &gameID

	// Add connection to game
	if _, exists := h.games[gameID]; !exists {
		h.games[gameID] = make(map[*Connection]bool)
	}
	h.games[gameID][conn] = true

	h.logger.Info().
		Str("connection_id", conn.ID).
		Str("user_id", string(conn.UserID)).
		Str("game_id", payload.GameID).
		Msg("User joined game")

	// Broadcast to game
	h.BroadcastToGame(gameID, event, conn)
}

// handleMove handles movement events
func (h *Hub) handleMove(conn *Connection, event domain.Event) {
	if conn.GameID == nil {
		h.logger.Warn().
			Str("connection_id", conn.ID).
			Msg("Connection not in a game")
		return
	}

	h.logger.Debug().
		Str("connection_id", conn.ID).
		Str("game_id", string(*conn.GameID)).
		Msg("Broadcasting move event")

	// Broadcast to game
	h.BroadcastToGame(*conn.GameID, event, conn)
}

// GetStats returns hub statistics
func (h *Hub) GetStats() map[string]interface{} {
	h.mu.RLock()
	defer h.mu.RUnlock()

	return map[string]interface{}{
		"total_connections": len(h.connections),
		"active_games":      len(h.games),
	}
}
