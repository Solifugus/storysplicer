# StorySplicer Database Schema

This document describes the database schema and relationships for the StorySplicer system.

## Overview

StorySplicer uses PostgreSQL to store all world simulation data. The schema is designed to support:
- Multiple independent worlds
- Character-driven autonomous simulation
- Dynamic area triggers and state
- Book series management with chapters
- Flexible writing style definitions

## Entity Relationship Diagram

```
worlds (1) ──→ (N) writing_styles
  │
  ├──→ (N) areas
  │      │
  │      └──→ (N) characters (via current_area_id)
  │      └──→ (N) items (via current_area_id)
  │
  ├──→ (N) characters
  │      │
  │      └──→ (N) items (via held_by_character_id)
  │
  ├──→ (N) items
  │
  └──→ (N) series
         │
         └──→ (N) books
                │
                └──→ (N) chapters
```

## Tables

### worlds
The top-level container for a world simulation.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | VARCHAR(255) | World name |
| description | TEXT | World description, rules, logic, species, empires |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### writing_styles
Defines narrative style for a world/series.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| world_id | INTEGER | Foreign key to worlds |
| tone | VARCHAR(100) | Emotional flavor (e.g., 'reflective', 'heroic') |
| narrative_voice | VARCHAR(100) | Point of view (e.g., 'third-person limited') |
| tense | VARCHAR(50) | Verb tense (e.g., 'past') |
| sentence_complexity | VARCHAR(50) | Linguistic sophistication (e.g., 'medium') |
| dialogue_style | VARCHAR(50) | Speech realism (e.g., 'naturalistic') |
| theme_keywords | TEXT[] | Array of recurring motifs |
| conflict_density | VARCHAR(50) | Frequency of conflict (e.g., 'moderate') |
| pacing_model | VARCHAR(50) | Event rate (e.g., 'rising', 'episodic') |
| moral_ambiguity | VARCHAR(50) | Ethical clarity (e.g., 'balanced') |
| descriptive_depth | VARCHAR(50) | Environmental detail level (e.g., 'moderate') |
| emotional_realism | VARCHAR(50) | Psychological portrayal strength (e.g., 'high') |
| language_register | VARCHAR(100) | Formality level (e.g., 'neutral-to-technical') |
| prose_format_rules | TEXT[] | Array of structural/stylistic constraints |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### areas
Locations within the world.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| world_id | INTEGER | Foreign key to worlds |
| name | VARCHAR(255) | Area name |
| description | TEXT | Area description |
| temperature | NUMERIC(5,2) | Temperature in Celsius (default: 20.0) |
| exits | JSONB | Direction-to-area_id mappings (e.g., `{"north": 2}`) |
| triggers | JSONB | Array of trigger objects with conditions and reactions |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Trigger Structure**:
```json
[
  {
    "condition": "character_enters",
    "reactions": [
      {"type": "add_item", "item_id": 123},
      {"type": "modify_description", "new_text": "..."}
    ]
  }
]
```

### characters
Autonomous agents in the world.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| world_id | INTEGER | Foreign key to worlds |
| **Identity** |
| name | VARCHAR(255) | Character name |
| description | TEXT | Character description |
| species | VARCHAR(100) | Species (e.g., 'human', 'alien') |
| gender | VARCHAR(50) | Gender |
| age | INTEGER | Age |
| backstory | TEXT | Character backstory |
| **Psychological** |
| memory | JSONB | Array of recent events/actions |
| likes | TEXT[] | Array of things character likes |
| dislikes | TEXT[] | Array of things character dislikes |
| interests | TEXT[] | Array of interests/missions/jobs |
| internal_conflict | TEXT | Internal conflicts |
| beliefs | TEXT[] | Beliefs and misbeliefs |
| **Physical Condition** |
| nutrition | NUMERIC(5,2) | Nutrition percentage (0-100, default: 100) |
| hydration | NUMERIC(5,2) | Hydration percentage (0-100, default: 100) |
| damage | JSONB | Array of `{part, type, severity}` objects |
| **Rest Cycle** |
| tiredness | NUMERIC(5,2) | Tiredness percentage (0-100, 100 forces sleep) |
| alertness | NUMERIC(5,2) | Alertness percentage (0-100, <20 is sleep) |
| **Location** |
| current_area_id | INTEGER | Foreign key to areas (nullable) |
| **Controllability** |
| owner_id | VARCHAR(255) | Player ID if player-controlled (nullable) |
| character_class | VARCHAR(10) | 'story' or 'minor' (determines LLM size) |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Memory Structure**:
```json
[
  {
    "action": "walked north",
    "result": "entered tavern",
    "timestamp": "2025-10-26T12:34:56Z"
  }
]
```

**Damage Structure**:
```json
[
  {
    "part": "left arm",
    "type": "cut",
    "severity": 30
  }
]
```

### items
Objects in the world.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| world_id | INTEGER | Foreign key to worlds |
| name | VARCHAR(255) | Item name |
| description | TEXT | Item description |
| properties | JSONB | Flexible properties (weight, consumable, etc.) |
| current_area_id | INTEGER | Foreign key to areas (nullable) |
| held_by_character_id | INTEGER | Foreign key to characters (nullable) |
| held_location | VARCHAR(50) | Where held ('right hand', 'left hand', 'right pocket', etc.) |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Properties Example**:
```json
{
  "weight": 2.5,
  "damage": 10,
  "consumable": true,
  "nutrition_value": 20
}
```

### series
Book series management.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| world_id | INTEGER | Foreign key to worlds |
| name | VARCHAR(255) | Series name |
| description | TEXT | Series description |
| design_file_path | TEXT | Path to ~/series-design/*.md file |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### books
Individual books in a series.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| series_id | INTEGER | Foreign key to series |
| book_number | INTEGER | Book number in series |
| title | VARCHAR(255) | Book title |
| isbn | VARCHAR(20) | ISBN when ready to publish (nullable) |
| status | VARCHAR(20) | 'planning', 'writing', 'completed', 'published' |
| output_file_path | TEXT | Path to generated markdown file |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### chapters
Chapters within a book.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| book_id | INTEGER | Foreign key to books |
| chapter_number | INTEGER | Chapter number in book |
| title | VARCHAR(255) | Chapter title (nullable) |
| content | TEXT | Final narrated content |
| status | VARCHAR(20) | 'planning', 'in_progress', 'completed', 'revised' |
| raw_events | JSONB | All collected events before revision |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

## Indexes

Performance indexes are created on:
- `areas.world_id`
- `characters.world_id`
- `characters.current_area_id`
- `characters.owner_id`
- `characters.character_class`
- `items.world_id`
- `items.current_area_id`
- `items.held_by_character_id`
- `writing_styles.world_id`
- `series.world_id`
- `books.series_id`
- `chapters.book_id`

## Key Relationships

### Character-Area Relationship
- Characters are located in areas via `characters.current_area_id`
- Multiple characters can be in the same area
- Items can also be in areas via `items.current_area_id`

### Character-Item Relationship
- Items can be held by characters via `items.held_by_character_id`
- `held_location` specifies where ('right hand', 'left pocket', etc.)
- An item is either in an area OR held by a character (not both)

### World Cascade
- Deleting a world cascades to:
  - All areas in that world
  - All characters in that world
  - All items in that world
  - Writing styles for that world
  - Series in that world (which cascade to books and chapters)

### Character Control
- `characters.owner_id`: If NULL, character is AI-controlled
- `characters.character_class`: 'story' uses larger LLM, 'minor' uses 3B model
- Narrator can control any character except actively player-owned ones

## Migration System

Migrations are stored in `src/db/migrations/` and run via:

```bash
npm run migrate        # Run pending migrations
npm run migrate down   # Rollback last migration
```

Each migration file exports `up()` and `down()` functions for forward and backward migrations.
