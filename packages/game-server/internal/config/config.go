package config

import (
	"os"
	"strconv"
	"time"
)

// Config holds the application configuration
type Config struct {
	Server ServerConfig
	Game   GameConfig
	WS     WebSocketConfig
	Log    LogConfig
}

// ServerConfig holds server configuration
type ServerConfig struct {
	Port    string
	Host    string
	Timeout time.Duration
}

// GameConfig holds game configuration
type GameConfig struct {
	Speed       int
	CanvasWidth int
	CanvasHeight int
	StartingX   int
	StartingY   int
}

// WebSocketConfig holds WebSocket configuration
type WebSocketConfig struct {
	PingInterval time.Duration
	WriteTimeout time.Duration
	MessageLimit int64
	PingAckTimeout time.Duration
}

// LogConfig holds logging configuration
type LogConfig struct {
	Level  string
	Format string
}

// Load loads configuration from environment variables with defaults
func Load() *Config {
	return &Config{
		Server: ServerConfig{
			Port: getEnv("GAME_SERVER_PORT", "8081"),
			Host: getEnv("GAME_SERVER_HOST", "0.0.0.0"),
			Timeout: getDurationEnv("SERVER_TIMEOUT", 10*time.Second),
		},
		Game: GameConfig{
			Speed:       getIntEnv("GAME_SPEED", 20),
			CanvasWidth: getIntEnv("CANVAS_WIDTH", 800),
			CanvasHeight: getIntEnv("CANVAS_HEIGHT", 600),
			StartingX:   getIntEnv("STARTING_X", 100),
			StartingY:   getIntEnv("STARTING_Y", 100),
		},
		WS: WebSocketConfig{
			PingInterval:   getDurationEnv("WS_PING_INTERVAL", 27*time.Second),
			WriteTimeout:   getDurationEnv("WS_WRITE_TIMEOUT", 10*time.Second),
			MessageLimit:   int64(getIntEnv("WS_MESSAGE_LIMIT", 1024)),
			PingAckTimeout: getDurationEnv("WS_PING_ACK_TIMEOUT", 30*time.Second),
		},
		Log: LogConfig{
			Level:  getEnv("LOG_LEVEL", "info"),
			Format: getEnv("LOG_FORMAT", "json"),
		},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getIntEnv(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}

func getDurationEnv(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}
