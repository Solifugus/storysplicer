/**
 * Initial database schema migration
 * Creates all core tables for StorySplicer
 */

export async function up(client) {
  // Create worlds table
  await client.query(`
    CREATE TABLE IF NOT EXISTS worlds (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // Create writing_styles table
  await client.query(`
    CREATE TABLE IF NOT EXISTS writing_styles (
      id SERIAL PRIMARY KEY,
      world_id INTEGER NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
      tone VARCHAR(100) DEFAULT 'reflective',
      narrative_voice VARCHAR(100) DEFAULT 'third-person limited',
      tense VARCHAR(50) DEFAULT 'past',
      sentence_complexity VARCHAR(50) DEFAULT 'medium',
      dialogue_style VARCHAR(50) DEFAULT 'naturalistic',
      theme_keywords TEXT[], -- Array of keywords
      conflict_density VARCHAR(50) DEFAULT 'moderate',
      pacing_model VARCHAR(50) DEFAULT 'rising',
      moral_ambiguity VARCHAR(50) DEFAULT 'balanced',
      descriptive_depth VARCHAR(50) DEFAULT 'moderate',
      emotional_realism VARCHAR(50) DEFAULT 'high',
      language_register VARCHAR(100) DEFAULT 'neutral-to-technical',
      prose_format_rules TEXT[], -- Array of rules
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // Create areas table
  await client.query(`
    CREATE TABLE IF NOT EXISTS areas (
      id SERIAL PRIMARY KEY,
      world_id INTEGER NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      temperature NUMERIC(5,2) DEFAULT 20.0, -- In Celsius
      exits JSONB DEFAULT '{}', -- {direction: area_id} mappings
      triggers JSONB DEFAULT '[]', -- Array of trigger objects
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // Create items table
  await client.query(`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      world_id INTEGER NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      properties JSONB DEFAULT '{}', -- Flexible properties (weight, consumable, etc.)
      current_area_id INTEGER REFERENCES areas(id) ON DELETE SET NULL,
      held_by_character_id INTEGER, -- Will reference characters(id) after that table is created
      held_location VARCHAR(50), -- 'right hand', 'left hand', 'right pocket', etc.
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // Create characters table
  await client.query(`
    CREATE TABLE IF NOT EXISTS characters (
      id SERIAL PRIMARY KEY,
      world_id INTEGER NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,

      -- Identity
      name VARCHAR(255) NOT NULL,
      description TEXT,
      species VARCHAR(100) NOT NULL,
      gender VARCHAR(50),
      age INTEGER,
      backstory TEXT,

      -- Psychological
      memory JSONB DEFAULT '[]', -- Array of recent events
      likes TEXT[],
      dislikes TEXT[],
      interests TEXT[],
      internal_conflict TEXT,
      beliefs TEXT[],

      -- Physical Condition
      nutrition NUMERIC(5,2) DEFAULT 100.0 CHECK (nutrition >= 0 AND nutrition <= 100),
      hydration NUMERIC(5,2) DEFAULT 100.0 CHECK (hydration >= 0 AND hydration <= 100),
      damage JSONB DEFAULT '[]', -- Array of {part, type, severity}

      -- Rest Cycle
      tiredness NUMERIC(5,2) DEFAULT 0.0 CHECK (tiredness >= 0 AND tiredness <= 100),
      alertness NUMERIC(5,2) DEFAULT 100.0 CHECK (alertness >= 0 AND alertness <= 100),

      -- Location
      current_area_id INTEGER REFERENCES areas(id) ON DELETE SET NULL,

      -- Controllability
      owner_id VARCHAR(255), -- Player ID if player-controlled
      character_class VARCHAR(10) NOT NULL DEFAULT 'minor' CHECK (character_class IN ('story', 'minor')),

      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // Add foreign key constraint to items.held_by_character_id now that characters table exists
  await client.query(`
    ALTER TABLE items
    ADD CONSTRAINT fk_items_character
    FOREIGN KEY (held_by_character_id)
    REFERENCES characters(id)
    ON DELETE SET NULL
  `);

  // Create series table for managing book series
  await client.query(`
    CREATE TABLE IF NOT EXISTS series (
      id SERIAL PRIMARY KEY,
      world_id INTEGER NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      design_file_path TEXT, -- Path to ~/series-design/*.md file
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // Create books table
  await client.query(`
    CREATE TABLE IF NOT EXISTS books (
      id SERIAL PRIMARY KEY,
      series_id INTEGER NOT NULL REFERENCES series(id) ON DELETE CASCADE,
      book_number INTEGER NOT NULL,
      title VARCHAR(255) NOT NULL,
      isbn VARCHAR(20),
      status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'writing', 'completed', 'published')),
      output_file_path TEXT, -- Path to generated markdown file
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // Create chapters table
  await client.query(`
    CREATE TABLE IF NOT EXISTS chapters (
      id SERIAL PRIMARY KEY,
      book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      chapter_number INTEGER NOT NULL,
      title VARCHAR(255),
      content TEXT, -- Final narrated content
      status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed', 'revised')),
      raw_events JSONB DEFAULT '[]', -- All collected events before revision
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // Create indexes for performance
  await client.query('CREATE INDEX idx_areas_world_id ON areas(world_id)');
  await client.query('CREATE INDEX idx_characters_world_id ON characters(world_id)');
  await client.query('CREATE INDEX idx_characters_area_id ON characters(current_area_id)');
  await client.query('CREATE INDEX idx_characters_owner_id ON characters(owner_id)');
  await client.query('CREATE INDEX idx_characters_class ON characters(character_class)');
  await client.query('CREATE INDEX idx_items_world_id ON items(world_id)');
  await client.query('CREATE INDEX idx_items_area_id ON items(current_area_id)');
  await client.query('CREATE INDEX idx_items_character_id ON items(held_by_character_id)');
  await client.query('CREATE INDEX idx_writing_styles_world_id ON writing_styles(world_id)');
  await client.query('CREATE INDEX idx_series_world_id ON series(world_id)');
  await client.query('CREATE INDEX idx_books_series_id ON books(series_id)');
  await client.query('CREATE INDEX idx_chapters_book_id ON chapters(book_id)');

  console.log('✓ Created all tables and indexes');
}

export async function down(client) {
  // Drop tables in reverse order to handle foreign key constraints
  await client.query('DROP TABLE IF EXISTS chapters CASCADE');
  await client.query('DROP TABLE IF EXISTS books CASCADE');
  await client.query('DROP TABLE IF EXISTS series CASCADE');
  await client.query('DROP TABLE IF EXISTS items CASCADE');
  await client.query('DROP TABLE IF EXISTS characters CASCADE');
  await client.query('DROP TABLE IF EXISTS areas CASCADE');
  await client.query('DROP TABLE IF EXISTS writing_styles CASCADE');
  await client.query('DROP TABLE IF EXISTS worlds CASCADE');

  console.log('✓ Dropped all tables');
}
