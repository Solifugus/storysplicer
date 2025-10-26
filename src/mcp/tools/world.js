/**
 * MCP tools for world-level operations
 */

import { World, WritingStyle } from '../../db/models/index.js';

export const worldTools = [
  {
    name: 'world_get',
    description: 'Get details of a world by ID',
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
    name: 'world_list',
    description: 'List all available worlds',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'world_create',
    description: 'Create a new world',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'World name',
        },
        description: {
          type: 'string',
          description: 'World description, rules, logic, species, empires',
        },
      },
      required: ['name', 'description'],
    },
  },
  {
    name: 'world_get_writing_style',
    description: 'Get the writing style for a world',
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
];

export async function handleWorldTool(name, args) {
  switch (name) {
    case 'world_get': {
      const world = await World.findById(args.world_id);
      if (!world) {
        throw new Error(`World not found: ${args.world_id}`);
      }
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(world, null, 2),
          },
        ],
      };
    }

    case 'world_list': {
      const worlds = await World.findAll();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(worlds, null, 2),
          },
        ],
      };
    }

    case 'world_create': {
      const world = await World.create({
        name: args.name,
        description: args.description,
      });
      return {
        content: [
          {
            type: 'text',
            text: `Created world: ${world.name} (ID: ${world.id})`,
          },
        ],
      };
    }

    case 'world_get_writing_style': {
      const style = await WritingStyle.findByWorldId(args.world_id);
      if (!style) {
        throw new Error(`No writing style found for world ${args.world_id}`);
      }
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(style, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown world tool: ${name}`);
  }
}
