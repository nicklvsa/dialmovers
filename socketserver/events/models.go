package events

import (
	"github.com/gorilla/websocket"
)

type SocketEventType string

const (
	SocketEventTypeConnect    SocketEventType = "connect"
	SocketEventTypeDisconnect SocketEventType = "disconnect"
	SocketEventTypeJoin       SocketEventType = "game:join"
	SocketEventTypeMove       SocketEventType = "game:move"
)

type SocketEvent struct {
	Type    SocketEventType `json:"payload_type"`
	Payload interface{}     `json:"payload"`
}

type ConnectionPayload struct {
	UserID *string `json:"user_id"`
}

type GameJoinPayload struct {
	UserID *string `json:"user_id"`
	GameID *string `json:"game_id"`
}

type GameMovePayload struct {
	UserID *string `json:"user_id"`
	GameID    *string `json:"game_id"`
	Direction *string `json:"direction"`
}

type SocketUser struct {
	UserID        string  `json:"user_id"`
	CurrentGameID *string `json:"current_game_id"`
}

type SocketCore struct {
	isInitialized bool
	Clients       map[*SocketClient]bool
	Create        chan *SocketClient
	Destroy       chan *SocketClient
}

type SocketClient struct {
	Core       *SocketCore
	Connection *websocket.Conn
	Data       chan SocketEvent
	User       *SocketUser
}
