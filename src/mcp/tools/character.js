/**
 * MCP tools for character operations
 */

import { Character, Item } from '../../db/models/index.js';
import { executeTriggers } from '../handlers/triggers.js';

export const characterTools = [
  {
    name: 'character_get',
    description: 'Get full details of a character including all attributes, physical state, and location',
    inputSchema: {
      type: 'object',
      properties: {
        character_id: {
          type: 'number',
          description: 'Character ID',
        },
      },
      required: ['character_id'],
    },
  },
  {
    name: 'character_list_awake',
    description: 'List all awake characters (alertness >= 20%) in a world',
    inputSchema: {
      type: 'object',
      properties: {
        world_id: {
          type: 'number',
          description: 'World ID',
        },
      },
      required: ['world_id'],
    },
  },
  {
    name: 'character_move',
    description: 'Move a character to a different area',
    inputSchema: {
      type: 'object',
      properties: {
        character_id: {
          type: 'number',
          description: 'Character ID',
        },
        area_id: {
          type: 'number',
          description: 'Destination area ID',
        },
      },
      required: ['character_id', 'area_id'],
    },
  },
  {
    name: 'character_speak',
    description: 'Have a character speak or perform an action',
    inputSchema: {
      type: 'object',
      properties: {
        character_id: {
          type: 'number',
          description: 'Character ID',
        },
        text: {
          type: 'string',
          description: 'What the character says or does',
        },
        action_type: {
          type: 'string',
          description: 'Type of action: "speech", "action", or "thought"',
          enum: ['speech', 'action', 'thought'],
        },
      },
      required: ['character_id', 'text', 'action_type'],
    },
  },
  {
    name: 'character_update_state',
    description: 'Update character physical/mental state (nutrition, hydration, tiredness, alertness, damage)',
    inputSchema: {
      type: 'object',
      properties: {
        character_id: {
          type: 'number',
          description: 'Character ID',
        },
        nutrition: {
          type: 'number',
          description: 'Nutrition percentage (0-100)',
        },
        hydration: {
          type: 'number',
          description: 'Hydration percentage (0-100)',
        },
        tiredness: {
          type: 'number',
          description: 'Tiredness percentage (0-100)',
        },
        alertness: {
          type: 'number',
          description: 'Alertness percentage (0-100)',
        },
        damage: {
          type: 'array',
          description: 'Array of damage objects {part, type, severity}',
        },
      },
      required: ['character_id'],
    },
  },
  {
    name: 'character_get_inventory',
    description: 'Get all items held by a character',
    inputSchema: {
      type: 'object',
      properties: {
        character_id: {
          type: 'number',
          description: 'Character ID',
        },
      },
      required: ['character_id'],
    },
  },
  {
    name: 'character_add_memory',
    description: 'Add a memory entry to character (recent action/reaction)',
    inputSchema: {
      type: 'object',
      properties: {
        character_id: {
          type: 'number',
          description: 'Character ID',
        },
        action: {
          type: 'string',
          description: 'What the character did',
        },
        result: {
          type: 'string',
          description: 'What happened as a result',
        },
      },
      required: ['character_id', 'action', 'result'],
    },
  },
];

export async function handleCharacterTool(name, args) {
  switch (name) {
    case 'character_get': {
      const character = await Character.findById(args.character_id);
      if (!character) {
        throw new Error(`Character not found: ${args.character_id}`);
      }

      // Get inventory
      const inventory = await Character.getInventory(args.character_id);

      const result = {
        ...character,
        inventory: inventory.map(i => ({
          id: i.id,
          name: i.name,
          held_location: i.held_location,
        })),
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    case 'character_list_awake': {
      const characters = await Character.findAwake(args.world_id);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(characters, null, 2),
          },
        ],
      };
    }

    case 'character_move': {
      const character = await Character.findById(args.character_id);
      if (!character) {
        throw new Error(`Character not found: ${args.character_id}`);
      }

      const oldAreaId = character.current_area_id;

      // Update character location
      await Character.update(args.character_id, {
        current_area_id: args.area_id,
      });

      // Execute area triggers for character entering
      await executeTriggers(args.area_id, 'character_enters', {
        character_id: args.character_id,
      });

      return {
        content: [
          {
            type: 'text',
            text: `${character.name} moved from area ${oldAreaId} to area ${args.area_id}`,
          },
        ],
      };
    }

    case 'character_speak': {
      const character = await Character.findById(args.character_id);
      if (!character) {
        throw new Error(`Character not found: ${args.character_id}`);
      }

      // Add to character memory
      await Character.addMemory(
        args.character_id,
        {
          action: `${args.action_type}: ${args.text}`,
          result: 'communicated',
        },
        character.character_class === 'story' ? 5 : 3
      );

      // Check for speech-based triggers in current area
      if (args.action_type === 'speech' && character.current_area_id) {
        await executeTriggers(character.current_area_id, 'character_speech', {
          character_id: args.character_id,
          text: args.text,
        });
      }

      return {
        content: [
          {
            type: 'text',
            text: `${character.name} (${args.action_type}): ${args.text}`,
          },
        ],
      };
    }

    case 'character_update_state': {
      const updates = {};
      if (args.nutrition !== undefined) updates.nutrition = args.nutrition;
      if (args.hydration !== undefined) updates.hydration = args.hydration;
      if (args.tiredness !== undefined) updates.tiredness = args.tiredness;
      if (args.alertness !== undefined) updates.alertness = args.alertness;
      if (args.damage !== undefined) updates.damage = args.damage;

      const character = await Character.update(args.character_id, updates);
      if (!character) {
        throw new Error(`Character not found: ${args.character_id}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: `Updated ${character.name}'s state`,
          },
        ],
      };
    }

    case 'character_get_inventory': {
      const inventory = await Character.getInventory(args.character_id);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(inventory, null, 2),
          },
        ],
      };
    }

    case 'character_add_memory': {
      const character = await Character.findById(args.character_id);
      if (!character) {
        throw new Error(`Character not found: ${args.character_id}`);
      }

      await Character.addMemory(
        args.character_id,
        {
          action: args.action,
          result: args.result,
        },
        character.character_class === 'story' ? 5 : 3
      );

      return {
        content: [
          {
            type: 'text',
            text: `Added memory to ${character.name}`,
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown character tool: ${name}`);
  }
}
