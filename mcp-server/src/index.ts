#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { handleToolCall } from './handlers/index.js';
import { TOOLS } from './schemas/tools.js';
import { logInfo, logError } from './utils/logger.js';

const server = new Server(
  {
    name: process.env.MCP_SERVER_NAME || 'mcp-server',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  logInfo('Listing tools');
  return { tools: TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, handleToolCall);

async function main() {
  logInfo('Starting MCP server');
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  logInfo('Server connected via stdio transport');

  // Handle graceful shutdown
  const shutdown = async () => {
    logInfo('Shutting down gracefully');
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  logError('Fatal error', { error: error instanceof Error ? error.message : 'Unknown' });
  process.exit(1);
});
