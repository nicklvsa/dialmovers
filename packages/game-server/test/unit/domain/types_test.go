package domain_test

import (
	"sync"
	"testing"
	"time"

	"github.com/dialmovers/game-server/internal/domain"
)

func TestNewGame(t *testing.T) {
	gameID := domain.GameID("test-game")
	game := domain.NewGame(gameID)

	if game.ID != gameID {
		t.Errorf("Expected game ID %s, got %s", gameID, game.ID)
	}

	if game.Players == nil {
		t.Error("Players map should be initialized")
	}
}

func TestGameAddPlayer(t *testing.T) {
	game := domain.NewGame("test-game")
	player := &domain.Player{
		ID: domain.UserID("user1"),
		Position: domain.Position{X: 100, Y: 100},
		GameID: "test-game",
	}

	game.AddPlayer(player)

	retrieved, exists := game.GetPlayer(player.ID)
	if !exists {
		t.Error("Player should exist after adding")
	}

	if retrieved.ID != player.ID {
		t.Errorf("Expected player ID %s, got %s", player.ID, retrieved.ID)
	}
}

func TestGameRemovePlayer(t *testing.T) {
	game := domain.NewGame("test-game")
	player := &domain.Player{
		ID: domain.UserID("user1"),
		Position: domain.Position{X: 100, Y: 100},
		GameID: "test-game",
	}

	game.AddPlayer(player)
	game.RemovePlayer(player.ID)

	_, exists := game.GetPlayer(player.ID)
	if exists {
		t.Error("Player should not exist after removal")
	}
}

func TestGameGetPlayers(t *testing.T) {
	game := domain.NewGame("test-game")

	// Add multiple players
	players := []*domain.Player{
		{ID: domain.UserID("user1"), Position: domain.Position{X: 100, Y: 100}, GameID: "test-game"},
		{ID: domain.UserID("user2"), Position: domain.Position{X: 200, Y: 200}, GameID: "test-game"},
		{ID: domain.UserID("user3"), Position: domain.Position{X: 300, Y: 300}, GameID: "test-game"},
	}

	for _, player := range players {
		game.AddPlayer(player)
	}

	retrieved := game.GetPlayers()
	if len(retrieved) != len(players) {
		t.Errorf("Expected %d players, got %d", len(players), len(retrieved))
	}
}

func TestGameMovePlayer(t *testing.T) {
	game := domain.NewGame("test-game")
	player := &domain.Player{
		ID: domain.UserID("user1"),
		Position: domain.Position{X: 100, Y: 100},
		GameID: "test-game",
	}

	game.AddPlayer(player)

	tests := []struct {
		name      string
		direction domain.Direction
		expected  domain.Position
	}{
		{"UP", domain.DirectionUp, domain.Position{X: 100, Y: 80}},
		{"DOWN", domain.DirectionDown, domain.Position{X: 100, Y: 120}},
		{"LEFT", domain.DirectionLeft, domain.Position{X: 80, Y: 100}},
		{"RIGHT", domain.DirectionRight, domain.Position{X: 120, Y: 100}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Reset position
			player.Position = domain.Position{X: 100, Y: 100}

			moved := game.MovePlayer(player.ID, tt.direction)
			if !moved {
				t.Error("MovePlayer should return true")
			}

			if player.Position != tt.expected {
				t.Errorf("Expected position %+v, got %+v", tt.expected, player.Position)
			}
		})
	}
}

func TestGameConcurrentAccess(t *testing.T) {
	game := domain.NewGame("test-game")
	player := &domain.Player{
		ID: domain.UserID("user1"),
		Position: domain.Position{X: 100, Y: 100},
		GameID: "test-game",
	}

	game.AddPlayer(player)

	var wg sync.WaitGroup
	done := make(chan bool)

	// Concurrent reads
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 0; j < 100; j++ {
				game.GetPlayer(player.ID)
				game.GetPlayers()
			}
		}()
	}

	// Concurrent writes
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 0; j < 100; j++ {
				game.MovePlayer(player.ID, domain.DirectionUp)
			}
		}()
	}

	go func() {
		wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		// Success
	case <-time.After(5 * time.Second):
		t.Fatal("Concurrent test timed out - possible deadlock")
	}
}
