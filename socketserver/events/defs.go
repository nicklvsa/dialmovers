package events

import (
	"fmt"
	"time"

	"github.com/gorilla/websocket"
)

var (
	core             *SocketCore
	EmptySocketBytes = []byte{}
)

const (
	SocketMaxMessageSize = 1024
	SocketPingAckTimeout = 30 * time.Second
	SocketWriteTimeout   = 10 * time.Second
	SocketPingPeriod     = (SocketPingAckTimeout * 9) / 10
)

func RegisterConnection(conn *websocket.Conn, userID string) {
	if core.isInitialized {
		client := SocketClient{
			Core:       core,
			Connection: conn,
			Data:       make(chan SocketEvent),
			User: &SocketUser{
				UserID:        userID,
				CurrentGameID: nil,
			},
		}

		go core.RegisterWriter(&client)
		go core.RegisterReader(&client)

		client.Core.Create <- &client
	}
}

func InitCore() {
	core = &SocketCore{
		isInitialized: true,
		Clients:       make(map[*SocketClient]bool),
		Create:        make(chan *SocketClient),
		Destroy:       make(chan *SocketClient),
	}

	go core.Run()
}

func GetCore() (*SocketCore, error) {
	if !core.isInitialized {
		return nil, fmt.Errorf("unable to return uninitialized socket core")
	}

	return core, nil
}
