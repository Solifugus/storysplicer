/**
 * MCP tools for item operations
 */

import { Item, Character } from '../../db/models/index.js';
import { executeTriggers } from '../handlers/triggers.js';

export const itemTools = [
  {
    name: 'item_get',
    description: 'Get details of an item',
    inputSchema: {
      type: 'object',
      properties: {
        item_id: {
          type: 'number',
          description: 'Item ID',
        },
      },
      required: ['item_id'],
    },
  },
  {
    name: 'item_pickup',
    description: 'Have a character pick up an item from their current area',
    inputSchema: {
      type: 'object',
      properties: {
        character_id: {
          type: 'number',
          description: 'Character ID',
        },
        item_id: {
          type: 'number',
          description: 'Item ID',
        },
        location: {
          type: 'string',
          description: 'Where to hold the item (e.g., "right hand", "left hand", "right pocket")',
        },
      },
      required: ['character_id', 'item_id', 'location'],
    },
  },
  {
    name: 'item_drop',
    description: 'Have a character drop an item in their current area',
    inputSchema: {
      type: 'object',
      properties: {
        character_id: {
          type: 'number',
          description: 'Character ID',
        },
        item_id: {
          type: 'number',
          description: 'Item ID',
        },
      },
      required: ['character_id', 'item_id'],
    },
  },
  {
    name: 'item_create',
    description: 'Create a new item in the world',
    inputSchema: {
      type: 'object',
      properties: {
        world_id: {
          type: 'number',
          description: 'World ID',
        },
        name: {
          type: 'string',
          description: 'Item name',
        },
        description: {
          type: 'string',
          description: 'Item description',
        },
        properties: {
          type: 'object',
          description: 'Item properties (weight, damage, consumable, etc.)',
        },
        area_id: {
          type: 'number',
          description: 'Initial area ID (optional)',
        },
      },
      required: ['world_id', 'name'],
    },
  },
];

export async function handleItemTool(name, args) {
  switch (name) {
    case 'item_get': {
      const item = await Item.findById(args.item_id);
      if (!item) {
        throw new Error(`Item not found: ${args.item_id}`);
      }
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(item, null, 2),
          },
        ],
      };
    }

    case 'item_pickup': {
      const character = await Character.findById(args.character_id);
      if (!character) {
        throw new Error(`Character not found: ${args.character_id}`);
      }

      const item = await Item.findById(args.item_id);
      if (!item) {
        throw new Error(`Item not found: ${args.item_id}`);
      }

      // Check if item is in the character's current area
      if (item.current_area_id !== character.current_area_id) {
        throw new Error(`Item is not in character's current area`);
      }

      // Pick up the item
      await Item.giveToCharacter(args.item_id, args.character_id, args.location);

      // Execute pickup triggers
      if (character.current_area_id) {
        await executeTriggers(character.current_area_id, 'item_picked_up', {
          character_id: args.character_id,
          item_id: args.item_id,
        });
      }

      // Add to character memory
      await Character.addMemory(
        args.character_id,
        {
          action: `picked up ${item.name}`,
          result: `now holding in ${args.location}`,
        },
        character.character_class === 'story' ? 5 : 3
      );

      return {
        content: [
          {
            type: 'text',
            text: `${character.name} picked up ${item.name} in ${args.location}`,
          },
        ],
      };
    }

    case 'item_drop': {
      const character = await Character.findById(args.character_id);
      if (!character) {
        throw new Error(`Character not found: ${args.character_id}`);
      }

      const item = await Item.findById(args.item_id);
      if (!item) {
        throw new Error(`Item not found: ${args.item_id}`);
      }

      // Check if character is holding the item
      if (item.held_by_character_id !== args.character_id) {
        throw new Error(`Character is not holding this item`);
      }

      if (!character.current_area_id) {
        throw new Error(`Character is not in any area`);
      }

      // Drop the item
      await Item.moveToArea(args.item_id, character.current_area_id);

      // Execute drop triggers
      await executeTriggers(character.current_area_id, 'item_dropped', {
        character_id: args.character_id,
        item_id: args.item_id,
      });

      // Add to character memory
      await Character.addMemory(
        args.character_id,
        {
          action: `dropped ${item.name}`,
          result: 'item left in area',
        },
        character.character_class === 'story' ? 5 : 3
      );

      return {
        content: [
          {
            type: 'text',
            text: `${character.name} dropped ${item.name}`,
          },
        ],
      };
    }

    case 'item_create': {
      const item = await Item.create({
        world_id: args.world_id,
        name: args.name,
        description: args.description || '',
        properties: args.properties || {},
        current_area_id: args.area_id || null,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Created item: ${item.name} (ID: ${item.id})`,
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown item tool: ${name}`);
  }
}
