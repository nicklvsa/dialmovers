package domain

import "time"

// EventType represents the type of WebSocket event
type EventType string

const (
	EventTypeConnect    EventType = "connect"
	EventTypeDisconnect EventType = "disconnect"
	EventTypeJoin       EventType = "game:join"
	EventTypeMove       EventType = "game:move"
)

// Direction represents movement direction
type Direction string

const (
	DirectionUp    Direction = "UP"
	DirectionDown  Direction = "DOWN"
	DirectionLeft  Direction = "LEFT"
	DirectionRight Direction = "RIGHT"
)

// Event represents a WebSocket event
type Event struct {
	Type      EventType   `json:"payload_type"`
	Payload   interface{} `json:"payload"`
	Timestamp time.Time   `json:"timestamp"`
}

// ConnectionPayload represents connect/disconnect payload
type ConnectionPayload struct {
	UserID string `json:"user_id"`
}

// JoinPayload represents game join payload
type JoinPayload struct {
	UserID string `json:"user_id"`
	GameID string `json:"game_id"`
}

// MovePayload represents movement payload
type MovePayload struct {
	UserID    string    `json:"user_id"`
	GameID    string    `json:"game_id"`
	Direction Direction `json:"direction"`
}

// Position represents a position on the canvas
type Position struct {
	X int `json:"x"`
	Y int `json:"y"`
}

// Player represents a player in a game
type Player struct {
	ID       UserID   `json:"user_id"`
	Position Position `json:"position"`
	GameID   GameID   `json:"game_id"`
}
