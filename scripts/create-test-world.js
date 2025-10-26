#!/usr/bin/env node

/**
 * Create Test World
 * Sets up a simple test world for frontend testing
 */

import { World } from '../src/db/models/World.js';
import { Area } from '../src/db/models/Area.js';
import { Character } from '../src/db/models/Character.js';
import { Item } from '../src/db/models/Item.js';
import { WritingStyle } from '../src/db/models/WritingStyle.js';

async function createTestWorld() {
  console.log('Creating test world...\n');

  try {
    // Create world first (without writing style)
    console.log('Creating world...');
    const world = await World.create({
      name: 'Test World',
      description: 'A simple test world for development and testing.'
    });
    const worldId = world.id;
    console.log(`✓ World created (ID: ${worldId})`);

    // Create writing style
    console.log('Creating writing style...');
    const style = await WritingStyle.create({
      world_id: worldId,
      name: 'Test Style',
      tone: 'casual',
      narrative_voice: 'third_person',
      tense: 'past',
      pov: 'omniscient',
      sentence_complexity: 'medium',
      dialogue_style: 'realistic',
      theme_keywords: ['adventure', 'exploration'],
      conflict_density: 50,
      pacing_model: 'balanced',
      descriptive_depth: 60,
      emotional_realism: 70,
      moral_ambiguity: 40,
      language_register: 'standard',
      prose_format_rules: ['Standard formatting with clear paragraphs', 'Use active voice', 'Show don\'t tell']
    });
    const styleId = style.id;
    console.log(`✓ Writing style created (ID: ${styleId})\n`);

    // Create areas
    console.log('Creating areas...');
    const townSquare = await Area.create({
      world_id: worldId,
      name: 'Town Square',
      description: 'A bustling town square with cobblestone streets. A fountain sits in the center, and merchants hawk their wares from colorful stalls.',
      temperature: 22.5,
      exits: JSON.stringify({
        north: 'tavern',
        east: 'market',
        south: 'gate'
      }),
      triggers: JSON.stringify([])
    });
    const townSquareId = townSquare.id;
    console.log(`✓ Town Square created (ID: ${townSquareId})`);

    const tavern = await Area.create({
      world_id: worldId,
      name: 'The Rusty Tankard',
      description: 'A warm, dimly lit tavern filled with the smell of ale and roasting meat. Wooden tables are scattered throughout, and a fire crackles in the hearth.',
      temperature: 24.0,
      exits: JSON.stringify({
        south: 'town_square'
      }),
      triggers: JSON.stringify([])
    });
    const tavernId = tavern.id;
    console.log(`✓ Tavern created (ID: ${tavernId})`);

    const market = await Area.create({
      world_id: worldId,
      name: 'Market Street',
      description: 'A narrow street lined with merchant stalls selling everything from fresh produce to exotic spices. The air is filled with the chatter of haggling customers.',
      temperature: 23.0,
      exits: JSON.stringify({
        west: 'town_square'
      }),
      triggers: JSON.stringify([])
    });
    const marketId = market.id;
    console.log(`✓ Market created (ID: ${marketId})`);

    const gate = await Area.create({
      world_id: worldId,
      name: 'Town Gate',
      description: 'The southern entrance to town, guarded by two stone pillars. Beyond lies a dirt road leading into the countryside.',
      temperature: 21.0,
      exits: JSON.stringify({
        north: 'town_square'
      }),
      triggers: JSON.stringify([])
    });
    const gateId = gate.id;
    console.log(`✓ Gate created (ID: ${gateId})\n`);

    // Create test characters
    console.log('Creating characters...');
    const player = await Character.create({
      world_id: worldId,
      name: 'TestPlayer',
      age: 25,
      gender: 'non-binary',
      species: 'human',
      description: 'A curious adventurer new to this world.',
      backstory: 'You have just arrived in town, seeking adventure and opportunity.',
      current_area_id: townSquareId,
      character_class: 'story',
      nutrition: 75.0,
      hydration: 80.0,
      tiredness: 30.0,
      alertness: 90.0,
      damage: JSON.stringify([]),
      inventory: JSON.stringify({ hands: [], pockets: [] }),
      memory: JSON.stringify([]),
      owner: null
    });
    const playerId = player.id;
    console.log(`✓ TestPlayer created (ID: ${playerId})`);

    const merchant = await Character.create({
      world_id: worldId,
      name: 'Merchant Tom',
      age: 45,
      gender: 'male',
      species: 'human',
      description: 'A rotund merchant with a cheerful smile and twinkling eyes.',
      backstory: 'Tom has run his stall in the market for twenty years.',
      current_area_id: marketId,
      character_class: 'minor',
      nutrition: 85.0,
      hydration: 70.0,
      tiredness: 20.0,
      alertness: 95.0,
      damage: JSON.stringify([]),
      inventory: JSON.stringify({ hands: [], pockets: ['coins'] }),
      memory: JSON.stringify([]),
      owner: null
    });
    const merchantId = merchant.id;
    console.log(`✓ Merchant Tom created (ID: ${merchantId})`);

    const innkeeper = await Character.create({
      world_id: worldId,
      name: 'Innkeeper Greta',
      age: 50,
      gender: 'female',
      species: 'human',
      description: 'A sturdy woman with graying hair tied back in a bun.',
      backstory: 'Greta inherited the tavern from her father and runs it with pride.',
      current_area_id: tavernId,
      character_class: 'minor',
      nutrition: 80.0,
      hydration: 75.0,
      tiredness: 40.0,
      alertness: 85.0,
      damage: JSON.stringify([]),
      inventory: JSON.stringify({ hands: [], pockets: ['rag'] }),
      memory: JSON.stringify([]),
      owner: null
    });
    const innkeeperId = innkeeper.id;
    console.log(`✓ Innkeeper Greta created (ID: ${innkeeperId})\n`);

    // Create items
    console.log('Creating items...');
    const apple = await Item.create({
      world_id: worldId,
      name: 'apple',
      description: 'A crisp, red apple.',
      location_type: 'area',
      location_id: townSquareId,
      properties: JSON.stringify({ edible: true, nutrition_value: 10 })
    });
    const appleId = apple.id;
    console.log(`✓ Apple created in Town Square (ID: ${appleId})`);

    const bread = await Item.create({
      world_id: worldId,
      name: 'loaf of bread',
      description: 'A fresh loaf of crusty bread.',
      location_type: 'area',
      location_id: marketId,
      properties: JSON.stringify({ edible: true, nutrition_value: 20 })
    });
    const breadId = bread.id;
    console.log(`✓ Bread created in Market (ID: ${breadId})`);

    const mug = await Item.create({
      world_id: worldId,
      name: 'wooden mug',
      description: 'A sturdy wooden drinking mug.',
      location_type: 'area',
      location_id: tavernId,
      properties: JSON.stringify({ container: true, capacity: 500 })
    });
    const mugId = mug.id;
    console.log(`✓ Mug created in Tavern (ID: ${mugId})`);

    console.log('\n' + '='.repeat(60));
    console.log('✓ Test world created successfully!');
    console.log('='.repeat(60));
    console.log('\nYou can now:');
    console.log('1. Start MCP server: npm run mcp');
    console.log('2. Start web server: npm run web');
    console.log('3. Open http://localhost:8080');
    console.log('4. Login with:');
    console.log(`   - Character: TestPlayer`);
    console.log(`   - World ID: ${worldId}`);
    console.log('\nOther characters in world:');
    console.log('   - Merchant Tom (in Market Street)');
    console.log('   - Innkeeper Greta (in The Rusty Tankard)');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error creating test world:', error);
    process.exit(1);
  }

  process.exit(0);
}

createTestWorld();
