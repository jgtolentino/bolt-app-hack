import { CallToolRequest, McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { ExampleToolSchema } from '../schemas/tools.js';
import { logDebug, logError } from '../utils/logger.js';

export async function handleToolCall(request: CallToolRequest) {
  const { name, arguments: args } = request.params;
  
  logDebug('Tool call received', { tool: name, args });

  try {
    switch (name) {
      case 'example_tool': {
        const validatedArgs = ExampleToolSchema.parse(args);
        // TODO: Implement your tool logic here
        const result = { message: `Processed: ${validatedArgs.input}` };
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2),
          }],
        };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    logError('Tool execution failed', {
      tool: name,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    if (error instanceof McpError) {
      throw error;
    }

    throw new McpError(
      ErrorCode.InternalError,
      error instanceof Error ? error.message : 'Internal server error'
    );
  }
}
