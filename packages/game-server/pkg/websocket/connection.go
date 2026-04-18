package websocket

import (
	"encoding/json"
	"sync"
	"time"

	"github.com/dialmovers/game-server/internal/domain"
	"github.com/gorilla/websocket"
	"github.com/rs/zerolog"
)

// Connection represents a WebSocket client connection
type Connection struct {
	ID        string
	Socket    *websocket.Conn
	Send      chan domain.Event
	mu        sync.Mutex
	UserID    domain.UserID
	GameID    *domain.GameID
	logger    zerolog.Logger
	hub       *Hub
	writeWait time.Duration
}

// NewConnection creates a new WebSocket connection
func NewConnection(id string, socket *websocket.Conn, userID domain.UserID, hub *Hub, logger zerolog.Logger, writeWait time.Duration) *Connection {
	return &Connection{
		ID:     id,
		Socket: socket,
		Send:   make(chan domain.Event, 256),
		UserID: userID,
		hub:    hub,
		logger: logger,
		writeWait: writeWait,
	}
}

// ReadPump pumps messages from the WebSocket connection to the hub
func (c *Connection) ReadPump(messageLimit int64, pingTimeout time.Duration) {
	defer func() {
		c.hub.Unregister(c)
		c.Socket.Close()
	}()

	c.Socket.SetReadLimit(messageLimit)
	c.Socket.SetReadDeadline(time.Now().Add(pingTimeout))
	c.Socket.SetPongHandler(func(string) error {
		c.Socket.SetReadDeadline(time.Now().Add(pingTimeout))
		return nil
	})

	for {
		_, message, err := c.Socket.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				c.logger.Error().Err(err).Str("connection_id", c.ID).Msg("Unexpected close error")
			}
			break
		}

		var event domain.Event
		if err := json.Unmarshal(message, &event); err != nil {
			c.logger.Error().Err(err).Str("connection_id", c.ID).Msg("Failed to unmarshal message")
			continue
		}

		c.hub.OnMessage(c, event)
	}
}

// WritePump pumps messages from the hub to the WebSocket connection
func (c *Connection) WritePump(pingPeriod, writeTimeout time.Duration) {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Socket.Close()
	}()

	for {
		select {
		case event, ok := <-c.Send:
			c.Socket.SetWriteDeadline(time.Now().Add(writeTimeout))
			if !ok {
				// Hub closed the channel
				c.Socket.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			c.mu.Lock()
			data, err := json.Marshal(event)
			if err != nil {
				c.logger.Error().Err(err).Str("connection_id", c.ID).Msg("Failed to marshal event")
				c.mu.Unlock()
				continue
			}

			writer, err := c.Socket.NextWriter(websocket.TextMessage)
			if err != nil {
				c.logger.Error().Err(err).Str("connection_id", c.ID).Msg("Failed to get writer")
				c.mu.Unlock()
				return
			}

			if _, err := writer.Write(data); err != nil {
				c.logger.Error().Err(err).Str("connection_id", c.ID).Msg("Failed to write message")
			}

			// Drain queued messages
			n := len(c.Send)
			for i := 0; i < n; i++ {
				event := <-c.Send
				if data, err := json.Marshal(event); err == nil {
					writer.Write(data)
				}
			}

			if err := writer.Close(); err != nil {
				c.logger.Error().Err(err).Str("connection_id", c.ID).Msg("Failed to close writer")
			}
			c.mu.Unlock()

		case <-ticker.C:
			c.Socket.SetWriteDeadline(time.Now().Add(writeTimeout))
			if err := c.Socket.WriteMessage(websocket.PingMessage, nil); err != nil {
				c.logger.Error().Err(err).Str("connection_id", c.ID).Msg("Failed to send ping")
				return
			}
		}
	}
}

// Close closes the connection safely
func (c *Connection) Close() {
	c.mu.Lock()
	defer c.mu.Unlock()

	close(c.Send)
}

// SendEvent sends an event to the connection
func (c *Connection) SendEvent(event domain.Event) bool {
	c.mu.Lock()
	defer c.mu.Unlock()

	select {
	case c.Send <- event:
		return true
	default:
		c.logger.Warn().Str("connection_id", c.ID).Msg("Send channel full, dropping event")
		return false
	}
}
