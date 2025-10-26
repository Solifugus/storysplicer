/**
 * Database layer tests
 *
 * Run with: npm test
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { testConnection, query, end } from '../db/index.js';
import { World, Area, Character, Item, WritingStyle } from '../db/models/index.js';

// Test database connection
test('Database connection', async () => {
  const connected = await testConnection();
  assert.strictEqual(connected, true, 'Should connect to database');
});

// World model tests
test('World CRUD operations', async () => {
  // Create
  const world = await World.create({
    name: 'Test World',
    description: 'A test world for unit testing'
  });
  assert.ok(world.id, 'World should have an ID');
  assert.strictEqual(world.name, 'Test World');

  // Read
  const foundWorld = await World.findById(world.id);
  assert.strictEqual(foundWorld.id, world.id);
  assert.strictEqual(foundWorld.name, 'Test World');

  // Update
  const updatedWorld = await World.update(world.id, {
    description: 'Updated description'
  });
  assert.strictEqual(updatedWorld.description, 'Updated description');

  // Delete
  const deleted = await World.delete(world.id);
  assert.strictEqual(deleted, true);

  const notFound = await World.findById(world.id);
  assert.strictEqual(notFound, null);
});

// Area model tests
test('Area CRUD operations', async () => {
  // Create a world first
  const world = await World.create({
    name: 'Area Test World',
    description: 'World for testing areas'
  });

  // Create area
  const area = await Area.create({
    world_id: world.id,
    name: 'Test Area',
    description: 'A test area',
    temperature: 22.5,
    exits: { north: 2, south: 3 },
    triggers: []
  });
  assert.ok(area.id);
  assert.strictEqual(area.name, 'Test Area');
  assert.strictEqual(parseFloat(area.temperature), 22.5);

  // Read
  const foundArea = await Area.findById(area.id);
  assert.strictEqual(foundArea.id, area.id);

  // Update
  const updatedArea = await Area.update(area.id, {
    temperature: 25.0
  });
  assert.strictEqual(parseFloat(updatedArea.temperature), 25);

  // Cleanup
  await Area.delete(area.id);
  await World.delete(world.id);
});

// Character model tests
test('Character CRUD operations', async () => {
  // Create world and area first
  const world = await World.create({
    name: 'Character Test World',
    description: 'World for testing characters'
  });

  const area = await Area.create({
    world_id: world.id,
    name: 'Starting Area',
    description: 'Where characters begin'
  });

  // Create character
  const character = await Character.create({
    world_id: world.id,
    name: 'Test Character',
    description: 'A brave test subject',
    species: 'human',
    gender: 'neutral',
    age: 30,
    current_area_id: area.id,
    character_class: 'story'
  });

  assert.ok(character.id);
  assert.strictEqual(character.name, 'Test Character');
  assert.strictEqual(character.species, 'human');
  assert.strictEqual(parseFloat(character.nutrition), 100);

  // Test finding awake characters
  const awakeCharacters = await Character.findAwake(world.id);
  assert.ok(awakeCharacters.length > 0);
  assert.strictEqual(awakeCharacters[0].id, character.id);

  // Test adding memory
  const updatedChar = await Character.addMemory(character.id, {
    action: 'walked north',
    result: 'entered new area'
  });
  assert.ok(updatedChar.memory.length > 0);

  // Cleanup
  await Character.delete(character.id);
  await Area.delete(area.id);
  await World.delete(world.id);
});

// Item model tests
test('Item CRUD operations', async () => {
  // Create world and area
  const world = await World.create({
    name: 'Item Test World',
    description: 'World for testing items'
  });

  const area = await Area.create({
    world_id: world.id,
    name: 'Test Area',
    description: 'Area with items'
  });

  // Create item
  const item = await Item.create({
    world_id: world.id,
    name: 'Test Sword',
    description: 'A sharp blade',
    properties: { weight: 2.5, damage: 10 },
    current_area_id: area.id
  });

  assert.ok(item.id);
  assert.strictEqual(item.name, 'Test Sword');
  assert.deepStrictEqual(item.properties, { weight: 2.5, damage: 10 });

  // Find items in area
  const itemsInArea = await Item.findByAreaId(area.id);
  assert.strictEqual(itemsInArea.length, 1);
  assert.strictEqual(itemsInArea[0].id, item.id);

  // Cleanup
  await Item.delete(item.id);
  await Area.delete(area.id);
  await World.delete(world.id);
});

// WritingStyle model tests
test('WritingStyle CRUD operations', async () => {
  // Create world
  const world = await World.create({
    name: 'Style Test World',
    description: 'World for testing writing styles'
  });

  // Create writing style
  const style = await WritingStyle.create({
    world_id: world.id,
    tone: 'heroic',
    theme_keywords: ['adventure', 'courage'],
    prose_format_rules: ['No passive voice']
  });

  assert.ok(style.id);
  assert.strictEqual(style.tone, 'heroic');
  assert.deepStrictEqual(style.theme_keywords, ['adventure', 'courage']);

  // Find by world
  const foundStyle = await WritingStyle.findByWorldId(world.id);
  assert.strictEqual(foundStyle.id, style.id);

  // Update
  const updatedStyle = await WritingStyle.update(style.id, {
    tone: 'dark'
  });
  assert.strictEqual(updatedStyle.tone, 'dark');

  // Cleanup
  await WritingStyle.delete(style.id);
  await World.delete(world.id);
});

// Close database connection after all tests
test.after(async () => {
  await end();
});
