#!/usr/bin/env node

/**
 * StorySplicer MCP Server
 *
 * Provides Model Context Protocol server for controlling world state and character actions.
 * Handles both stdio (for AI agents) and WebSocket (for players) connections.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { WebSocketServer } from 'ws';
import { testConnection } from '../db/index.js';

// Import MCP tools
import { worldTools, handleWorldTool } from './tools/world.js';
import { areaTools, handleAreaTool } from './tools/area.js';
import { characterTools, handleCharacterTool } from './tools/character.js';
import { itemTools, handleItemTool } from './tools/item.js';

const MCP_PORT = parseInt(process.env.MCP_PORT || '3000', 10);
const USE_STDIO = process.env.MCP_TRANSPORT === 'stdio';

/**
 * Create and configure MCP server
 */
function createMCPServer() {
  const server = new Server(
    {
      name: 'storysplicer',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Collect all tools
  const allTools = [
    ...worldTools,
    ...areaTools,
    ...characterTools,
    ...itemTools,
  ];

  // Register list_tools handler
  server.setRequestHandler('tools/list', async () => {
    return { tools: allTools };
  });

  // Register call_tool handler
  server.setRequestHandler('tools/call', async (request) => {
    const { name, arguments: args } = request.params;

    try {
      // Route to appropriate tool handler
      if (name.startsWith('world_')) {
        return await handleWorldTool(name, args);
      } else if (name.startsWith('area_')) {
        return await handleAreaTool(name, args);
      } else if (name.startsWith('character_')) {
        return await handleCharacterTool(name, args);
      } else if (name.startsWith('item_')) {
        return await handleItemTool(name, args);
      }

      throw new Error(`Unknown tool: ${name}`);
    } catch (error) {
      console.error(`Error executing tool ${name}:`, error);
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * Start stdio transport (for AI agents)
 */
async function startStdioServer() {
  console.error('Starting MCP server with stdio transport...');

  const server = createMCPServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error('MCP server running on stdio');
}

/**
 * Start WebSocket transport (for player clients)
 */
async function startWebSocketServer() {
  console.error(`Starting MCP server with WebSocket transport on port ${MCP_PORT}...`);

  const wss = new WebSocketServer({ port: MCP_PORT });

  wss.on('connection', (ws, req) => {
    console.error(`New WebSocket connection from ${req.socket.remoteAddress}`);

    const server = createMCPServer();

    // Simple WebSocket to MCP adapter
    const transport = {
      async start() {
        ws.on('message', async (data) => {
          try {
            const message = JSON.parse(data.toString());
            console.error('Received message:', message.method);

            // Handle different MCP request types
            if (message.method === 'tools/list') {
              const response = await server.requestHandlers['tools/list'](message);
              ws.send(JSON.stringify({
                jsonrpc: '2.0',
                id: message.id,
                result: response,
              }));
            } else if (message.method === 'tools/call') {
              const response = await server.requestHandlers['tools/call'](message);
              ws.send(JSON.stringify({
                jsonrpc: '2.0',
                id: message.id,
                result: response,
              }));
            } else if (message.method === 'initialize') {
              ws.send(JSON.stringify({
                jsonrpc: '2.0',
                id: message.id,
                result: {
                  protocolVersion: '2024-11-05',
                  capabilities: {
                    tools: {},
                  },
                  serverInfo: {
                    name: 'storysplicer',
                    version: '0.1.0',
                  },
                },
              }));
            } else {
              ws.send(JSON.stringify({
                jsonrpc: '2.0',
                id: message.id,
                error: {
                  code: -32601,
                  message: `Method not found: ${message.method}`,
                },
              }));
            }
          } catch (error) {
            console.error('Error handling message:', error);
            ws.send(JSON.stringify({
              jsonrpc: '2.0',
              id: null,
              error: {
                code: -32700,
                message: 'Parse error',
              },
            }));
          }
        });

        ws.on('close', () => {
          console.error('WebSocket connection closed');
        });

        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
        });
      },

      async close() {
        ws.close();
      },
    };

    // We don't call server.connect(transport) for WebSocket
    // since we're handling messages directly
  });

  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });

  console.error(`MCP WebSocket server listening on ws://localhost:${MCP_PORT}`);
  console.error('Waiting for connections...');
}

/**
 * Main entry point
 */
async function main() {
  // Test database connection
  const connected = await testConnection();
  if (!connected) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  // Start appropriate transport
  if (USE_STDIO) {
    await startStdioServer();
  } else {
    await startWebSocketServer();
  }
}

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.error('\nShutting down MCP server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('\nShutting down MCP server...');
  process.exit(0);
});

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
