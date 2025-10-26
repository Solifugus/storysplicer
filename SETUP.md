# StorySplicer Setup Guide

## Phase 1 Complete! ✅

The foundation and database layer is complete. Here's what has been implemented:

### Completed Components

✅ Node.js project structure with package.json
✅ PostgreSQL connection pooling with error handling
✅ Database migration system
✅ Complete database schema for all entities:
  - Worlds
  - Areas (with triggers support)
  - Characters (with all attributes)
  - Items
  - Writing Styles
  - Series/Books/Chapters
✅ CRUD model classes for all entities
✅ Unit tests for database layer
✅ Comprehensive documentation

### Quick Setup

1. **Install PostgreSQL** (if not already installed):
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql
```

2. **Create Database**:
```bash
# Login to PostgreSQL
sudo -u postgres psql

# Run these commands in psql:
CREATE DATABASE storysplicer;
CREATE USER storysplicer WITH PASSWORD 'storysplicer';
GRANT ALL PRIVILEGES ON DATABASE storysplicer TO storysplicer;

# For PostgreSQL 15+, also grant schema privileges:
\c storysplicer
GRANT ALL ON SCHEMA public TO storysplicer;
\q
```

3. **Configure Environment** (optional if using defaults):
```bash
cp .env.example .env
# Edit .env if you need different credentials
```

4. **Dependencies are already installed**:
```bash
# Already done, but to reinstall if needed:
npm install
```

5. **Run Database Migrations**:
```bash
npm run migrate
```

Expected output:
```
Running migration: 001_initial_schema.js
✓ Created all tables and indexes
✓ Completed: 001_initial_schema.js
All migrations completed successfully
```

6. **Run Tests**:
```bash
npm test
```

This will test all CRUD operations on the database models.

7. **Verify Setup**:
```bash
npm start
```

You should see:
```
StorySplicer - World Simulation System
======================================

Database connection successful: [timestamp]

StorySplicer is ready!

Next steps:
  1. Run migrations: npm run migrate
  2. Run tests: npm test
```

## Troubleshooting

### Connection Errors

If you get "connection refused" errors:
1. Ensure PostgreSQL is running:
   ```bash
   sudo systemctl status postgresql  # Linux
   brew services list                # macOS
   ```

2. Start PostgreSQL if needed:
   ```bash
   sudo systemctl start postgresql   # Linux
   brew services start postgresql    # macOS
   ```

### Permission Errors

If you get "permission denied" errors:
```sql
-- Connect as postgres user
sudo -u postgres psql

-- Grant all privileges
\c storysplicer
GRANT ALL ON SCHEMA public TO storysplicer;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO storysplicer;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO storysplicer;
```

### Migration Already Run

If migrations have already been run and you want to start fresh:
```bash
# Rollback the migration
npm run migrate down

# Run it again
npm run migrate
```

## Database Schema Overview

The complete schema includes:

- **worlds**: Top-level world containers
- **writing_styles**: Narrative style definitions
- **areas**: Locations with exits and triggers
- **characters**: Autonomous agents with identity, memory, and physical state
- **items**: Objects that can be in areas or held by characters
- **series**: Book series metadata
- **books**: Individual books with ISBN support
- **chapters**: Chapter content and status

See [DATABASE.md](./DATABASE.md) for complete schema documentation.

## What's Next?

Phase 1 is complete! The next phase is **MCP Server Core** (Phase 2), which will:
- Set up MCP server architecture
- Implement WebSocket handler
- Create MCP tools for world queries and actions
- Implement area trigger system
- Add connection/authentication

See [DEVELOPMENT-ROADMAP.md](./DEVELOPMENT-ROADMAP.md) for details.

## File Structure Created

```
storysplicer/
├── src/
│   ├── db/
│   │   ├── migrations/
│   │   │   └── 001_initial_schema.js    # Initial schema
│   │   ├── models/
│   │   │   ├── World.js                 # World CRUD
│   │   │   ├── Area.js                  # Area CRUD
│   │   │   ├── Character.js             # Character CRUD
│   │   │   ├── Item.js                  # Item CRUD
│   │   │   ├── WritingStyle.js          # Writing style CRUD
│   │   │   └── index.js                 # Model exports
│   │   ├── config.js                    # DB configuration
│   │   ├── index.js                     # Connection pool
│   │   └── migrate.js                   # Migration runner
│   ├── tests/
│   │   └── db.test.js                   # Database tests
│   └── index.js                         # Main entry point
├── .env.example                         # Environment template
├── .gitignore                           # Git ignore rules
├── package.json                         # Dependencies
├── README.md                            # Project overview
├── DATABASE.md                          # Schema documentation
├── DEVELOPMENT-ROADMAP.md               # Implementation plan
├── SETUP.md                             # This file
└── CLAUDE.md                            # AI guidance
```

## Verification Checklist

- [ ] PostgreSQL is installed and running
- [ ] Database `storysplicer` exists
- [ ] User `storysplicer` has proper permissions
- [ ] `npm install` completed successfully
- [ ] `npm run migrate` ran without errors
- [ ] `npm test` passes all tests
- [ ] `npm start` connects to database

Once all items are checked, Phase 1 is fully operational!
