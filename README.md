# DialMovers

A modern phone-controlled multiplayer game platform where players can control game characters using their phone's keypad.

## Architecture

```
┌─────────────┐     ┌────────────────┐     ┌─────────────────┐
│   Twilio   │────▶│  Webhook       │────▶│  Game Server    │
│  (Phone)   │     │  Server (Node) │     │  (Go + WS)      │
└─────────────┘     └────────────────┘     └─────────────────┘
                                                  │
                                                  ▼
                                          ┌─────────────────┐
                                          │   Web Client    │
                                          │   (Vue 3)       │
                                          └─────────────────┘
```

## Features

- **Phone Control**: Use any phone to control game characters via DTMF tones
- **Real-time Multiplayer**: WebSocket-based real-time game updates
- **Modern Stack**: TypeScript, Go, Vue 3, Docker
- **Production Ready**: Comprehensive testing, CI/CD, security hardening

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Twilio Account (for phone control)
- Node.js 20+, Go 1.22+ (for local development)

### Using Docker Compose

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# - Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN
# - Set TWILIO_PHONE_NUMBER

# Start all services
docker compose up

# Or build and start in production mode
docker compose -f infrastructure/docker-compose.prod.yml up -d
```

Services will be available at:
- Webhook Server: http://localhost:8080
- Game Server: http://localhost:8081
- Web Client: http://localhost:80

### Local Development

#### Webhook Server (Node.js/TypeScript)

```bash
cd packages/webhook-server
npm install
npm run dev
```

#### Game Server (Go)

```bash
cd packages/game-server
go mod download
go run cmd/server/main.go
```

#### Web Client (Vue 3)

```bash
cd packages/web-client
npm install
npm run dev
```

## How to Play

1. **Open the web client** at http://localhost:5173 (dev) or http://localhost:80 (prod)
2. **Enter your phone number** (10 digits, no special characters)
3. **Call your Twilio number** from your phone
4. **Enter your game PIN** (shown on the web client)
5. **Control your character** using phone keypad:
   - `2` = Move UP
   - `8` = Move DOWN
   - `4` = Move LEFT
   - `6` = Move RIGHT
   - `*` = Disconnect

## Project Structure

```
dialmovers/
├── packages/
│   ├── webhook-server/      # Node.js/TypeScript webhook handler
│   ├── game-server/         # Go WebSocket game server
│   └── web-client/          # Vue 3 + TypeScript frontend
├── docker/                  # Dockerfiles for each service
├── infrastructure/          # nginx, prometheus configs
├── .github/workflows/       # CI/CD pipelines
├── docker-compose.yml       # Development setup
└── README.md
```

## Configuration

See `.env.example` for all available configuration options:

```bash
# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Servers
WEBHOOK_SERVER_PORT=8080
GAME_SERVER_PORT=8081

# Game
GAME_SPEED=20
CANVAS_WIDTH=800
CANVAS_HEIGHT=600
```

## Development

### Running Tests

```bash
# Webhook Server
cd packages/webhook-server
npm test

# Game Server
cd packages/game-server
go test ./...

# Web Client
cd packages/web-client
npm run test

# E2E Tests
cd packages/web-client
npx playwright test
```

### Linting

```bash
# Webhook Server
npm run lint

# Game Server
golangci-lint run

# Web Client
npm run lint
```

## Deployment

### Docker

```bash
# Build images
docker compose build

# Start services
docker compose up -d

# Check health
curl http://localhost/health
```

### Production

```bash
# Use production compose file
docker compose -f infrastructure/docker-compose.prod.yml up -d
```

The production configuration includes:
- Nginx reverse proxy with SSL/TLS
- Resource limits and health checks
- Log aggregation via Prometheus
- Automatic restarts

## Monitoring

- Health endpoints: `/health`
- Prometheus metrics: `/metrics`
- Structured JSON logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run linting and tests
6. Submit a pull request

## License

ISC

## Support

- Open an issue for bugs or feature requests
- Email: support@dialmovers.com
- Documentation: https://docs.dialmovers.com

## Security

See [SECURITY.md](SECURITY.md) for security policies and vulnerability reporting.
