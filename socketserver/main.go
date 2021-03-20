package main

import (
	"fmt"
	"net/http"
	"socketserver/events"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

func main() {
	r := gin.Default()

	events.InitCore()

	r.Any("/ws/:user_id", func(c *gin.Context) {
		userID := c.Param("user_id")

		upgrader := &websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
		}

		upgrader.CheckOrigin = func(r *http.Request) bool {
			return true
		}

		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			fmt.Println(fmt.Sprintf("[ERR] - %s", err.Error()))
			return
		}

		events.RegisterConnection(conn, userID)
	})

	r.Run(":8081")
}
