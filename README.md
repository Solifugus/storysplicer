# StorySplicer

World simulation system for developing stories for book series and interactive role-playing experiences.

## Overview

StorySplicer creates dynamic, AI-driven worlds where:
- **Characters are autonomous agents** with their own LLM-powered behavior
- **The world expands dynamically** through AI to support narratives
- **Multiple control modes** operate simultaneously (Narrator, Players, Minor Characters)
- **Stories are generated** through character-driven simulation

## Features

- **Multi-Agent Simulation**: Cycle-based time model processing all awake characters
- **Character Agency**: Each character has identity, memory, physical needs, and autonomous behavior
- **Dynamic World**: Areas with triggers, state changes, and AI-generated expansions
- **Narrator System**: Special orchestrator agent for story generation and world expansion
- **Book Series Management**: Tools for creating, writing, and publishing book series
- **Writing Style System**: Configurable narrative voice, tone, pacing, and prose rules

## Project Status

✅ **Phase 1 Complete**: Foundation & Database Layer
- Node.js project structure
- PostgreSQL connection and pooling
- Database schema with migrations
- CRUD models for all entities
- Unit tests for database layer

✅ **Phase 2 Complete**: MCP Server Core
- MCP server with stdio and WebSocket transports
- Complete tool set for world/area/character/item operations
- Area trigger system with multiple reaction types
- Player authentication and session management
- Integration tests for all MCP tools

🚧 **Next Phase**: Character Agent Controller (Phase 3)

See [DEVELOPMENT-ROADMAP.md](./DEVELOPMENT-ROADMAP.md) for full implementation plan.

## Quick Start

### Prerequisites

- Node.js >= 20.0.0
- PostgreSQL >= 14

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd storysplicer
```

2. Install dependencies:
```bash
npm install
```

3. Set up PostgreSQL database:
```bash
# Create database and user
psql -U postgres
CREATE DATABASE storysplicer;
CREATE USER storysplicer WITH PASSWORD 'storysplicer';
GRANT ALL PRIVILEGES ON DATABASE storysplicer TO storysplicer;
\q
```

4. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database credentials if different from defaults
```

5. Run database migrations:
```bash
npm run migrate
```

6. Test the setup:
```bash
npm test
```

7. Start the application:
```bash
npm start
```

## Project Structure

```
storysplicer/
├── src/
│   ├── db/
│   │   ├── migrations/     # Database migrations
│   │   ├── models/         # Data models (World, Character, Area, etc.)
│   │   ├── config.js       # Database configuration
│   │   ├── index.js        # Database connection pool
│   │   └── migrate.js      # Migration runner
│   ├── tests/              # Unit tests
│   └── index.js            # Main entry point
├── .env.example            # Environment variables template
├── package.json
├── CLAUDE.md               # AI assistant guidance
├── DATABASE.md             # Database schema documentation
├── DEVELOPMENT-ROADMAP.md  # Implementation roadmap
└── README.md               # This file
```

## Scripts

- `npm start` - Start the application
- `npm run dev` - Start with auto-reload on file changes
- `npm run mcp` - Start MCP server (WebSocket mode)
- `npm test` - Run unit tests
- `npm run migrate` - Run pending database migrations
- `npm run migrate down` - Rollback last migration

## Configuration

Environment variables (see `.env.example`):

- `DB_HOST` - PostgreSQL host (default: localhost)
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_NAME` - Database name (default: storysplicer)
- `DB_USER` - Database user (default: storysplicer)
- `DB_PASSWORD` - Database password (default: storysplicer)
- `LOG_QUERIES` - Enable query logging (default: false)

## Documentation

- [Database Schema](./DATABASE.md) - Complete database documentation
- [MCP API](./MCP-API.md) - MCP server tools and usage
- [Development Roadmap](./DEVELOPMENT-ROADMAP.md) - Implementation phases
- [Design Document](./storysplicer-design.md) - System architecture and concepts
- [CLAUDE.md](./CLAUDE.md) - Project guidance for AI assistants

## Architecture

### Core Concepts

**Multi-Agent Simulation**: All awake characters are processed sequentially each cycle (2-10 seconds). Three control modes operate simultaneously:
- **Narrator**: Controls story characters for plot advancement
- **Players**: Control their characters when connected
- **Minor Characters**: Live autonomous lives continuously

**Character Agents**: Each character is an autonomous agent with:
- Identity (name, species, description, backstory)
- Physical state (nutrition, hydration, tiredness, damage)
- Memory (recent actions/reactions with summarization)
- Inventory (items in hands and pockets)

**World Structure**: Worlds contain:
- Areas with descriptions, exits, items, and triggers
- Characters (story and minor classes)
- Writing style definitions
- Series/book/chapter hierarchy

### Technology Stack

- **Backend**: Node.js with minimal dependencies
- **Database**: PostgreSQL for all persistent state
- **Frontend** (Phase 4): PWA with vanilla JS/HTML/CSS
- **Communication** (Phase 2): MCP over WebSockets
- **AI Models**: Small (3B) for minor characters, larger for story characters

## Development Phases

1. ✅ **Foundation & Database Layer** - Complete
2. ✅ **MCP Server Core** - Complete
3. 🚧 **Character Agent Controller** - Next
4. **Basic Frontend (PWA)**
5. **Narrator Agent**
6. **Physical Simulation & Realism**
7. **Series Management System**
8. **Area Trigger System** - Partially complete (basic system in Phase 2)
9. **Advanced Features**
10. **Testing & Polish**

See [DEVELOPMENT-ROADMAP.md](./DEVELOPMENT-ROADMAP.md) for detailed checklists.

## Contributing

This project follows a phased development approach. Please refer to the roadmap and complete one phase before moving to the next.

## License

MIT
