/**
 * MCP tools for area operations
 */

import { Area } from '../../db/models/index.js';
import { executeTriggers } from '../handlers/triggers.js';

export const areaTools = [
  {
    name: 'area_get',
    description: 'Get details of an area including description, temperature, exits, items, and characters',
    inputSchema: {
      type: 'object',
      properties: {
        area_id: {
          type: 'number',
          description: 'Area ID',
        },
      },
      required: ['area_id'],
    },
  },
  {
    name: 'area_list',
    description: 'List all areas in a world',
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
    name: 'area_get_characters',
    description: 'Get all characters currently in an area',
    inputSchema: {
      type: 'object',
      properties: {
        area_id: {
          type: 'number',
          description: 'Area ID',
        },
      },
      required: ['area_id'],
    },
  },
  {
    name: 'area_get_items',
    description: 'Get all items currently in an area',
    inputSchema: {
      type: 'object',
      properties: {
        area_id: {
          type: 'number',
          description: 'Area ID',
        },
      },
      required: ['area_id'],
    },
  },
  {
    name: 'area_create',
    description: 'Create a new area in the world',
    inputSchema: {
      type: 'object',
      properties: {
        world_id: {
          type: 'number',
          description: 'World ID',
        },
        name: {
          type: 'string',
          description: 'Area name',
        },
        description: {
          type: 'string',
          description: 'Area description',
        },
        temperature: {
          type: 'number',
          description: 'Temperature in Celsius (default: 20.0)',
        },
        exits: {
          type: 'object',
          description: 'Direction-to-area_id mappings (e.g., {"north": 2, "south": 3})',
        },
      },
      required: ['world_id', 'name', 'description'],
    },
  },
];

export async function handleAreaTool(name, args) {
  switch (name) {
    case 'area_get': {
      const area = await Area.findById(args.area_id);
      if (!area) {
        throw new Error(`Area not found: ${args.area_id}`);
      }

      // Get characters and items in the area
      const characters = await Area.getCharacters(args.area_id);
      const items = await Area.getItems(args.area_id);

      const result = {
        ...area,
        characters: characters.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description,
          species: c.species,
        })),
        items: items.map(i => ({
          id: i.id,
          name: i.name,
          description: i.description,
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

    case 'area_list': {
      const areas = await Area.findByWorldId(args.world_id);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(areas, null, 2),
          },
        ],
      };
    }

    case 'area_get_characters': {
      const characters = await Area.getCharacters(args.area_id);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(characters, null, 2),
          },
        ],
      };
    }

    case 'area_get_items': {
      const items = await Area.getItems(args.area_id);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(items, null, 2),
          },
        ],
      };
    }

    case 'area_create': {
      const area = await Area.create({
        world_id: args.world_id,
        name: args.name,
        description: args.description,
        temperature: args.temperature,
        exits: args.exits || {},
      });
      return {
        content: [
          {
            type: 'text',
            text: `Created area: ${area.name} (ID: ${area.id})`,
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown area tool: ${name}`);
  }
}
