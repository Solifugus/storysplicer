/**
 * MCP tool integration tests
 *
 * Run with: npm test
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { end } from '../db/index.js';
import { World, Area, Character, Item, WritingStyle } from '../db/models/index.js';
import { handleWorldTool } from '../mcp/tools/world.js';
import { handleAreaTool } from '../mcp/tools/area.js';
import { handleCharacterTool } from '../mcp/tools/character.js';
import { handleItemTool } from '../mcp/tools/item.js';
import { executeTriggers, createTrigger } from '../mcp/handlers/triggers.js';
import { claimCharacter, canControlCharacter, releaseCharacter } from '../mcp/handlers/auth.js';

// Test world tool handlers
test('World tools', async (t) => {
  await t.test('world_create', async () => {
    const result = await handleWorldTool('world_create', {
      name: 'Test MCP World',
      description: 'A world for testing MCP tools',
    });

    assert.ok(result.content[0].text.includes('Test MCP World'));
  });

  await t.test('world_list', async () => {
    const result = await handleWorldTool('world_list', {});
    const worlds = JSON.parse(result.content[0].text);

    assert.ok(Array.isArray(worlds));
    assert.ok(worlds.length > 0);
  });
});

// Test area tool handlers
test('Area tools', async (t) => {
  let worldId, areaId;

  await t.test('setup', async () => {
    const world = await World.create({
      name: 'Area Test World',
      description: 'Testing areas',
    });
    worldId = world.id;
  });

  await t.test('area_create', async () => {
    const result = await handleAreaTool('area_create', {
      world_id: worldId,
      name: 'Test Room',
      description: 'A simple test room',
      temperature: 20.0,
      exits: { north: 2 },
    });

    assert.ok(result.content[0].text.includes('Test Room'));

    // Get the created area ID for other tests
    const areas = await Area.findByWorldId(worldId);
    areaId = areas[0].id;
  });

  await t.test('area_get', async () => {
    const result = await handleAreaTool('area_get', { area_id: areaId });
    const area = JSON.parse(result.content[0].text);

    assert.strictEqual(area.name, 'Test Room');
    assert.ok(Array.isArray(area.characters));
    assert.ok(Array.isArray(area.items));
  });

  await t.test('cleanup', async () => {
    await World.delete(worldId);
  });
});

// Test character tool handlers
test('Character tools', async (t) => {
  let worldId, areaId, characterId;

  await t.test('setup', async () => {
    const world = await World.create({
      name: 'Character Test World',
      description: 'Testing characters',
    });
    worldId = world.id;

    const area = await Area.create({
      world_id: worldId,
      name: 'Starting Area',
      description: 'Where it begins',
    });
    areaId = area.id;

    const character = await Character.create({
      world_id: worldId,
      name: 'Test Hero',
      species: 'human',
      current_area_id: areaId,
      character_class: 'story',
    });
    characterId = character.id;
  });

  await t.test('character_get', async () => {
    const result = await handleCharacterTool('character_get', {
      character_id: characterId,
    });
    const character = JSON.parse(result.content[0].text);

    assert.strictEqual(character.name, 'Test Hero');
    assert.ok(Array.isArray(character.inventory));
  });

  await t.test('character_speak', async () => {
    const result = await handleCharacterTool('character_speak', {
      character_id: characterId,
      text: 'Hello, world!',
      action_type: 'speech',
    });

    assert.ok(result.content[0].text.includes('Hello, world!'));
  });

  await t.test('character_update_state', async () => {
    const result = await handleCharacterTool('character_update_state', {
      character_id: characterId,
      nutrition: 80.0,
      tiredness: 25.0,
    });

    assert.ok(result.content[0].text.includes('Updated'));

    const character = await Character.findById(characterId);
    assert.strictEqual(parseFloat(character.nutrition), 80);
    assert.strictEqual(parseFloat(character.tiredness), 25);
  });

  await t.test('character_add_memory', async () => {
    const result = await handleCharacterTool('character_add_memory', {
      character_id: characterId,
      action: 'explored the room',
      result: 'found nothing',
    });

    assert.ok(result.content[0].text.includes('Added memory'));

    const character = await Character.findById(characterId);
    assert.ok(character.memory.length > 0);
  });

  await t.test('cleanup', async () => {
    await World.delete(worldId);
  });
});

// Test item tool handlers
test('Item tools', async (t) => {
  let worldId, areaId, characterId, itemId;

  await t.test('setup', async () => {
    const world = await World.create({
      name: 'Item Test World',
      description: 'Testing items',
    });
    worldId = world.id;

    const area = await Area.create({
      world_id: worldId,
      name: 'Test Area',
      description: 'An area with items',
    });
    areaId = area.id;

    const character = await Character.create({
      world_id: worldId,
      name: 'Item Tester',
      species: 'human',
      current_area_id: areaId,
    });
    characterId = character.id;
  });

  await t.test('item_create', async () => {
    const result = await handleItemTool('item_create', {
      world_id: worldId,
      name: 'Magic Sword',
      description: 'A glowing blade',
      properties: { damage: 15 },
      area_id: areaId,
    });

    assert.ok(result.content[0].text.includes('Magic Sword'));

    const items = await Item.findByAreaId(areaId);
    itemId = items[0].id;
  });

  await t.test('item_pickup', async () => {
    const result = await handleItemTool('item_pickup', {
      character_id: characterId,
      item_id: itemId,
      location: 'right hand',
    });

    assert.ok(result.content[0].text.includes('picked up'));

    const item = await Item.findById(itemId);
    assert.strictEqual(item.held_by_character_id, characterId);
    assert.strictEqual(item.held_location, 'right hand');
  });

  await t.test('item_drop', async () => {
    const result = await handleItemTool('item_drop', {
      character_id: characterId,
      item_id: itemId,
    });

    assert.ok(result.content[0].text.includes('dropped'));

    const item = await Item.findById(itemId);
    assert.strictEqual(item.held_by_character_id, null);
    assert.strictEqual(item.current_area_id, areaId);
  });

  await t.test('cleanup', async () => {
    await World.delete(worldId);
  });
});

// Test trigger system
test('Area triggers', async (t) => {
  let worldId, areaId, characterId;

  await t.test('setup', async () => {
    const world = await World.create({
      name: 'Trigger Test World',
      description: 'Testing triggers',
    });
    worldId = world.id;

    const area = await Area.create({
      world_id: worldId,
      name: 'Trigger Room',
      description: 'A room with triggers',
      triggers: [
        createTrigger(
          'character_enters',
          [
            {
              type: 'modify_description',
              append_description: ' You feel a presence.',
            },
          ],
          true
        ),
      ],
    });
    areaId = area.id;

    const character = await Character.create({
      world_id: worldId,
      name: 'Trigger Tester',
      species: 'human',
      current_area_id: null,
    });
    characterId = character.id;
  });

  await t.test('trigger fires on character enter', async () => {
    // Move character to area (should trigger)
    await handleCharacterTool('character_move', {
      character_id: characterId,
      area_id: areaId,
    });

    // Check that description was modified
    const area = await Area.findById(areaId);
    assert.ok(area.description.includes('You feel a presence'));

    // Trigger should be removed (one-time)
    assert.strictEqual(area.triggers.length, 0);
  });

  await t.test('cleanup', async () => {
    await World.delete(worldId);
  });
});

// Test authentication
test('Authentication', async (t) => {
  let worldId, characterId;

  await t.test('setup', async () => {
    const world = await World.create({
      name: 'Auth Test World',
      description: 'Testing auth',
    });
    worldId = world.id;

    const character = await Character.create({
      world_id: worldId,
      name: 'Player Character',
      species: 'human',
    });
    characterId = character.id;
  });

  await t.test('claim character', async () => {
    const token = await claimCharacter('player1', characterId);
    assert.ok(token);

    const canControl = await canControlCharacter('player1', characterId);
    assert.strictEqual(canControl, true);

    const cannotControl = await canControlCharacter('player2', characterId);
    assert.strictEqual(cannotControl, false);
  });

  await t.test('release character', async () => {
    await releaseCharacter(characterId);

    const character = await Character.findById(characterId);
    assert.strictEqual(character.owner_id, null);
  });

  await t.test('cleanup', async () => {
    await World.delete(worldId);
  });
});

// Close database connection after all tests
test.after(async () => {
  await end();
});
