package domain

import (
	"sync"
)

// UserID represents a unique user identifier
type UserID string

// GameID represents a unique game identifier
type GameID string

// ClientID represents a unique connection identifier
type ClientID string

// Game represents a game session
type Game struct {
	ID      GameID
	Players map[UserID]*Player
	mu      sync.RWMutex
}

// NewGame creates a new game instance
func NewGame(id GameID) *Game {
	return &Game{
		ID:      id,
		Players: make(map[UserID]*Player),
	}
}

// AddPlayer adds a player to the game
func (g *Game) AddPlayer(player *Player) {
	g.mu.Lock()
	defer g.mu.Unlock()
	g.Players[player.ID] = player
}

// RemovePlayer removes a player from the game
func (g *Game) RemovePlayer(userID UserID) {
	g.mu.Lock()
	defer g.mu.Unlock()
	delete(g.Players, userID)
}

// GetPlayer gets a player by ID
func (g *Game) GetPlayer(userID UserID) (*Player, bool) {
	g.mu.RLock()
	defer g.mu.RUnlock()
	player, exists := g.Players[userID]
	return player, exists
}

// GetPlayers returns all players
func (g *Game) GetPlayers() []*Player {
	g.mu.RLock()
	defer g.mu.RUnlock()

	players := make([]*Player, 0, len(g.Players))
	for _, player := range g.Players {
		players = append(players, player)
	}
	return players
}

// MovePlayer moves a player in the specified direction
func (g *Game) MovePlayer(userID UserID, direction Direction) bool {
	g.mu.Lock()
	defer g.mu.Unlock()

	player, exists := g.Players[userID]
	if !exists {
		return false
	}

	// Update position based on direction
	switch direction {
	case DirectionUp:
		player.Position.Y -= 20
	case DirectionDown:
		player.Position.Y += 20
	case DirectionLeft:
		player.Position.X -= 20
	case DirectionRight:
		player.Position.X += 20
	}

	return true
}
