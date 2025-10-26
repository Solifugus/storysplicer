# StorySplicer MCP API Documentation

This document describes the Model Context Protocol (MCP) API for controlling the StorySplicer world simulation.

## Overview

The MCP server provides tools for:
- **World Management**: Create and query worlds
- **Area Operations**: Navigate and manipulate locations
- **Character Control**: Move, speak, and manage character state
- **Item Manipulation**: Pick up, drop, and create items
- **Trigger System**: Dynamic area reactions to events

## Transport Modes

The MCP server supports two transport modes:

### 1. stdio (for AI Agents)
```bash
MCP_TRANSPORT=stdio npm run mcp
```
Uses stdin/stdout for communication. Ideal for LLM integrations.

### 2. WebSocket (for Players)
```bash
npm run mcp
```
WebSocket server on port 3000 (configurable via `MCP_PORT` env var).

## Connection

### WebSocket Connection

```javascript
const ws = new WebSocket('ws://localhost:3000');

// Initialize
ws.send(JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {}
}));

// List available tools
ws.send(JSON.stringify({
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/list',
  params: {}
}));

// Call a tool
ws.send(JSON.stringify({
  jsonrpc: '2.0',
  id: 3,
  method: 'tools/call',
  params: {
    name: 'world_list',
    arguments: {}
  }
}));
```

## MCP Tools Reference

### World Tools

#### `world_list`
List all available worlds.

**Parameters**: None

**Returns**:
```json
[
  {
    "id": 1,
    "name": "Fantasy Realm",
    "description": "A magical world...",
    "created_at": "2025-10-26T..."
  }
]
```

#### `world_get`
Get details of a specific world.

**Parameters**:
- `world_id` (number) - World ID

**Returns**: World object with all attributes

#### `world_create`
Create a new world.

**Parameters**:
- `name` (string) - World name
- `description` (string) - World description, rules, logic, species, empires

**Returns**: Confirmation message with new world ID

#### `world_get_writing_style`
Get the writing style configuration for a world.

**Parameters**:
- `world_id` (number) - World ID

**Returns**: Writing style object with tone, narrative voice, pacing, etc.

---

### Area Tools

#### `area_list`
List all areas in a world.

**Parameters**:
- `world_id` (number) - World ID

**Returns**: Array of area objects

#### `area_get`
Get complete details of an area including characters and items present.

**Parameters**:
- `area_id` (number) - Area ID

**Returns**:
```json
{
  "id": 1,
  "name": "Town Square",
  "description": "A bustling marketplace",
  "temperature": 22.5,
  "exits": {
    "north": 2,
    "east": 3
  },
  "characters": [
    {"id": 1, "name": "Merchant", "species": "human"}
  ],
  "items": [
    {"id": 1, "name": "Apple", "description": "A red apple"}
  ]
}
```

#### `area_get_characters`
Get all characters currently in an area.

**Parameters**:
- `area_id` (number) - Area ID

**Returns**: Array of character objects

#### `area_get_items`
Get all items currently in an area.

**Parameters**:
- `area_id` (number) - Area ID

**Returns**: Array of item objects

#### `area_create`
Create a new area in the world.

**Parameters**:
- `world_id` (number) - World ID
- `name` (string) - Area name
- `description` (string) - Area description
- `temperature` (number, optional) - Temperature in Celsius (default: 20.0)
- `exits` (object, optional) - Direction-to-area_id mappings

**Example**:
```json
{
  "world_id": 1,
  "name": "Dark Forest",
  "description": "A foreboding woodland",
  "temperature": 15.0,
  "exits": {
    "south": 1,
    "east": 3
  }
}
```

---

### Character Tools

#### `character_get`
Get full character details including physical state, inventory, and memory.

**Parameters**:
- `character_id` (number) - Character ID

**Returns**: Complete character object with all attributes

#### `character_list_awake`
List all awake characters (alertness >= 20%) in a world.

**Parameters**:
- `world_id` (number) - World ID

**Returns**: Array of awake characters

#### `character_move`
Move a character to a different area.

**Parameters**:
- `character_id` (number) - Character ID
- `area_id` (number) - Destination area ID

**Returns**: Confirmation message

**Side Effects**:
- Triggers area `character_enters` event
- May trigger reactions in destination area

#### `character_speak`
Have a character speak or perform an action.

**Parameters**:
- `character_id` (number) - Character ID
- `text` (string) - What the character says or does
- `action_type` (string) - One of: `"speech"`, `"action"`, `"thought"`

**Returns**: Formatted output of character's speech/action

**Side Effects**:
- Adds entry to character memory
- May trigger speech-based area triggers

#### `character_update_state`
Update character's physical or mental state.

**Parameters**:
- `character_id` (number) - Character ID
- `nutrition` (number, optional) - Nutrition percentage (0-100)
- `hydration` (number, optional) - Hydration percentage (0-100)
- `tiredness` (number, optional) - Tiredness percentage (0-100, 100 forces sleep)
- `alertness` (number, optional) - Alertness percentage (0-100, <20 is sleep)
- `damage` (array, optional) - Array of `{part, type, severity}` objects

**Example**:
```json
{
  "character_id": 1,
  "nutrition": 75.0,
  "tiredness": 30.0,
  "damage": [
    {
      "part": "left arm",
      "type": "cut",
      "severity": 15
    }
  ]
}
```

#### `character_get_inventory`
Get all items held by a character.

**Parameters**:
- `character_id` (number) - Character ID

**Returns**: Array of items with `held_location` field

#### `character_add_memory`
Add a memory entry to a character.

**Parameters**:
- `character_id` (number) - Character ID
- `action` (string) - What the character did
- `result` (string) - What happened as a result

**Returns**: Confirmation message

**Note**: Memory is automatically limited to last 3 items (minor characters) or 5 items (story characters)

---

### Item Tools

#### `item_get`
Get details of an item.

**Parameters**:
- `item_id` (number) - Item ID

**Returns**: Complete item object

#### `item_create`
Create a new item in the world.

**Parameters**:
- `world_id` (number) - World ID
- `name` (string) - Item name
- `description` (string, optional) - Item description
- `properties` (object, optional) - Item properties (weight, damage, consumable, etc.)
- `area_id` (number, optional) - Initial area ID

**Example**:
```json
{
  "world_id": 1,
  "name": "Health Potion",
  "description": "A red vial of healing liquid",
  "properties": {
    "weight": 0.5,
    "consumable": true,
    "healing": 50
  },
  "area_id": 3
}
```

#### `item_pickup`
Have a character pick up an item from their current area.

**Parameters**:
- `character_id` (number) - Character ID
- `item_id` (number) - Item ID
- `location` (string) - Where to hold: `"right hand"`, `"left hand"`, `"right pocket"`, etc.

**Returns**: Confirmation message

**Side Effects**:
- Item removed from area
- Item added to character inventory
- May trigger `item_picked_up` area event
- Adds entry to character memory

**Errors**:
- Item not in character's current area

#### `item_drop`
Have a character drop an item in their current area.

**Parameters**:
- `character_id` (number) - Character ID
- `item_id` (number) - Item ID

**Returns**: Confirmation message

**Side Effects**:
- Item removed from character inventory
- Item added to current area
- May trigger `item_dropped` area event
- Adds entry to character memory

**Errors**:
- Character not holding the item
- Character not in any area

---

## Area Trigger System

Areas can have triggers that react to events. Triggers are stored in the `triggers` JSONB field.

### Trigger Structure

```json
{
  "condition": "event_type_or_object",
  "reactions": [
    {"type": "reaction_type", ...}
  ],
  "one_time": true
}
```

### Event Types

- `character_enters` - Character enters the area
- `character_speech` - Character speaks in the area
- `item_picked_up` - Item picked up in the area
- `item_dropped` - Item dropped in the area

### Complex Conditions

```json
{
  "type": "character_speech",
  "keywords": ["open sesame", "reveal"],
  "character_id": 5  // Optional: specific character
}
```

### Reaction Types

#### `add_item`
Create a new item in the area.

```json
{
  "type": "add_item",
  "item": {
    "name": "Treasure Chest",
    "description": "A locked chest",
    "properties": {"weight": 50}
  }
}
```

#### `remove_item`
Delete an item.

```json
{
  "type": "remove_item",
  "item_id": 42
}
```

#### `add_exit`
Add a new exit direction.

```json
{
  "type": "add_exit",
  "direction": "secret",
  "target_area_id": 99
}
```

#### `remove_exit`
Remove an exit direction.

```json
{
  "type": "remove_exit",
  "direction": "north"
}
```

#### `modify_description`
Change area description.

```json
{
  "type": "modify_description",
  "new_description": "The room transforms..."
}
```

Or append to existing:

```json
{
  "type": "modify_description",
  "append_description": "\nA secret door opens!"
}
```

#### `modify_temperature`
Change temperature.

```json
{
  "type": "modify_temperature",
  "temperature": 5.0  // Set to 5°C
}
```

Or relative change:

```json
{
  "type": "modify_temperature",
  "temperature_delta": -10.0  // Drop by 10°C
}
```

### Example Triggers

**Secret door opens on keyword**:
```json
{
  "condition": {
    "type": "character_speech",
    "keywords": ["open sesame"]
  },
  "reactions": [
    {
      "type": "add_exit",
      "direction": "secret",
      "target_area_id": 42
    },
    {
      "type": "append_description",
      "append_description": "\nA hidden passage appears in the wall!"
    }
  ],
  "one_time": true
}
```

**Temperature drops when item taken**:
```json
{
  "condition": "item_picked_up",
  "reactions": [
    {
      "type": "modify_temperature",
      "temperature_delta": -5.0
    }
  ],
  "one_time": false
}
```

---

## Authentication

### Claiming Characters

Players can claim characters for control:

```javascript
import { claimCharacter, canControlCharacter } from './src/mcp/handlers/auth.js';

// Claim a character
const sessionToken = await claimCharacter('player_id_123', characterId);

// Check if player can control character
const canControl = await canControlCharacter('player_id_123', characterId);

// Release character
await releaseCharacter(characterId);
```

### Session Management

- Sessions expire after 24 hours of inactivity
- One character per session
- Narrator cannot control actively player-owned characters
- Sessions are in-memory (use Redis/database for production)

---

## Error Handling

All errors return JSON-RPC error responses:

```json
{
  "jsonrpc": "2.0",
  "id": 123,
  "error": {
    "code": -32600,
    "message": "Character not found: 999"
  }
}
```

Common error codes:
- `-32700` - Parse error
- `-32600` - Invalid request
- `-32601` - Method not found
- `-32602` - Invalid params

---

## Example Workflows

### Create a World and Starting Area

```javascript
// 1. Create world
const worldResult = await callTool('world_create', {
  name: 'Fantasy Realm',
  description: 'A magical world of adventure'
});

// 2. Create starting area
const areaResult = await callTool('area_create', {
  world_id: 1,
  name: 'Village Square',
  description: 'A peaceful village center',
  temperature: 20.0
});

// 3. Create a character
const character = await Character.create({
  world_id: 1,
  name: 'Hero',
  species: 'human',
  current_area_id: 1
});
```

### Player Picks Up an Item

```javascript
// 1. Get area contents
const area = await callTool('area_get', { area_id: 1 });
// Shows items: [{id: 5, name: "Sword"}]

// 2. Pick up item
await callTool('item_pickup', {
  character_id: 10,
  item_id: 5,
  location: 'right hand'
});

// 3. Verify inventory
const inventory = await callTool('character_get_inventory', {
  character_id: 10
});
```

### Character Explores New Area

```javascript
// 1. Get current area
const area = await callTool('area_get', { area_id: 1 });
// Check exits: {"north": 2, "east": 3}

// 2. Move north
await callTool('character_move', {
  character_id: 10,
  area_id: 2
});
// This fires any triggers in area 2

// 3. Character reacts
await callTool('character_speak', {
  character_id: 10,
  text: 'This place gives me chills',
  action_type: 'thought'
});
```

---

## Environment Variables

- `MCP_PORT` - WebSocket port (default: 3000)
- `MCP_TRANSPORT` - Transport mode: `stdio` or `websocket` (default: websocket)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database config
- `LOG_QUERIES` - Enable query logging (default: false)

---

## Testing

Run MCP integration tests:

```bash
npm test
```

This tests all MCP tools, triggers, and authentication.

---

## Next Steps

- **Phase 3**: Character Agent Controller for autonomous behavior
- **Phase 4**: Frontend PWA for player interface
- **Phase 5**: Narrator Agent for story generation

See [DEVELOPMENT-ROADMAP.md](./DEVELOPMENT-ROADMAP.md) for details.
