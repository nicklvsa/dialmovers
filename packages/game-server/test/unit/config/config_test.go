package config_test

import (
	"os"
	"testing"
	"time"

	"github.com/dialmovers/game-server/internal/config"
)

func TestLoadDefaults(t *testing.T) {
	// Clear environment variables
	os.Unsetenv("GAME_SERVER_PORT")
	os.Unsetenv("GAME_SERVER_HOST")
	os.Unsetenv("GAME_SPEED")
	os.Unsetenv("CANVAS_WIDTH")
	os.Unsetenv("LOG_LEVEL")

	cfg := config.Load()

	if cfg.Server.Port != "8081" {
		t.Errorf("Expected default port 8081, got %s", cfg.Server.Port)
	}

	if cfg.Server.Host != "0.0.0.0" {
		t.Errorf("Expected default host 0.0.0.0, got %s", cfg.Server.Host)
	}

	if cfg.Game.Speed != 20 {
		t.Errorf("Expected default game speed 20, got %d", cfg.Game.Speed)
	}

	if cfg.Log.Level != "info" {
		t.Errorf("Expected default log level info, got %s", cfg.Log.Level)
	}
}

func TestLoadFromEnv(t *testing.T) {
	os.Setenv("GAME_SERVER_PORT", "9000")
	os.Setenv("GAME_SERVER_HOST", "localhost")
	os.Setenv("GAME_SPEED", "30")
	os.Setenv("CANVAS_WIDTH", "1024")
	os.Setenv("LOG_LEVEL", "debug")
	defer os.Unsetenv("GAME_SERVER_PORT")
	defer os.Unsetenv("GAME_SERVER_HOST")
	defer os.Unsetenv("GAME_SPEED")
	defer os.Unsetenv("CANVAS_WIDTH")
	defer os.Unsetenv("LOG_LEVEL")

	cfg := config.Load()

	if cfg.Server.Port != "9000" {
		t.Errorf("Expected port 9000, got %s", cfg.Server.Port)
	}

	if cfg.Server.Host != "localhost" {
		t.Errorf("Expected host localhost, got %s", cfg.Server.Host)
	}

	if cfg.Game.Speed != 30 {
		t.Errorf("Expected game speed 30, got %d", cfg.Game.Speed)
	}

	if cfg.Game.CanvasWidth != 1024 {
		t.Errorf("Expected canvas width 1024, got %d", cfg.Game.CanvasWidth)
	}

	if cfg.Log.Level != "debug" {
		t.Errorf("Expected log level debug, got %s", cfg.Log.Level)
	}
}

func TestDurationParsing(t *testing.T) {
	os.Setenv("WS_PING_INTERVAL", "30s")
	os.Setenv("WS_WRITE_TIMEOUT", "5s")
	defer os.Unsetenv("WS_PING_INTERVAL")
	defer os.Unsetenv("WS_WRITE_TIMEOUT")

	cfg := config.Load()

	if cfg.WS.PingInterval != 30*time.Second {
		t.Errorf("Expected ping interval 30s, got %v", cfg.WS.PingInterval)
	}

	if cfg.WS.WriteTimeout != 5*time.Second {
		t.Errorf("Expected write timeout 5s, got %v", cfg.WS.WriteTimeout)
	}
}
