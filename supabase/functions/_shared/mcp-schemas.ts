// MCP-compatible JSON schemas for request/response validation
// Based on Model Context Protocol specification

export const MCPSchemas = {
  // Base JSON-RPC 2.0 schema
  jsonRpcRequest: {
    type: 'object',
    required: ['jsonrpc', 'method'],
    properties: {
      jsonrpc: { type: 'string', const: '2.0' },
      method: { type: 'string' },
      params: { type: 'object' },
      id: { oneOf: [{ type: 'string' }, { type: 'number' }] }
    }
  },

  jsonRpcResponse: {
    type: 'object',
    required: ['jsonrpc'],
    oneOf: [
      {
        required: ['result'],
        properties: {
          jsonrpc: { type: 'string', const: '2.0' },
          result: {},
          id: { oneOf: [{ type: 'string' }, { type: 'number' }] }
        }
      },
      {
        required: ['error'],
        properties: {
          jsonrpc: { type: 'string', const: '2.0' },
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'integer' },
              message: { type: 'string' },
              data: {}
            }
          },
          id: { oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'null' }] }
        }
      }
    ]
  },

  // MCP Tool schemas
  tool: {
    type: 'object',
    required: ['name', 'description'],
    properties: {
      name: { 
        type: 'string',
        pattern: '^[a-zA-Z0-9_-]+$'
      },
      description: { type: 'string' },
      inputSchema: {
        type: 'object',
        properties: {
          type: { type: 'string', const: 'object' },
          properties: { type: 'object' },
          required: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  },

  toolCall: {
    type: 'object',
    required: ['name', 'arguments'],
    properties: {
      name: { type: 'string' },
      arguments: { type: 'object' }
    }
  },

  toolResult: {
    type: 'object',
    required: ['content'],
    properties: {
      content: {
        type: 'array',
        items: {
          type: 'object',
          required: ['type'],
          oneOf: [
            {
              properties: {
                type: { type: 'string', const: 'text' },
                text: { type: 'string' }
              },
              required: ['text']
            },
            {
              properties: {
                type: { type: 'string', const: 'image' },
                data: { type: 'string' },
                mimeType: { type: 'string' }
              },
              required: ['data', 'mimeType']
            }
          ]
        }
      },
      isError: { type: 'boolean' }
    }
  },

  // MCP Resource schemas
  resource: {
    type: 'object',
    required: ['uri', 'name'],
    properties: {
      uri: { 
        type: 'string',
        format: 'uri'
      },
      name: { type: 'string' },
      description: { type: 'string' },
      mimeType: { type: 'string' }
    }
  },

  resourceContents: {
    type: 'object',
    required: ['uri', 'contents'],
    properties: {
      uri: { type: 'string', format: 'uri' },
      mimeType: { type: 'string' },
      contents: {
        type: 'array',
        items: {
          oneOf: [
            {
              type: 'object',
              properties: {
                type: { type: 'string', const: 'text' },
                text: { type: 'string' }
              },
              required: ['type', 'text']
            },
            {
              type: 'object',
              properties: {
                type: { type: 'string', const: 'blob' },
                blob: { type: 'string' }
              },
              required: ['type', 'blob']
            }
          ]
        }
      }
    }
  },

  // MCP Prompt schemas
  prompt: {
    type: 'object',
    required: ['name', 'description'],
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
      arguments: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name', 'description'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            required: { type: 'boolean' }
          }
        }
      }
    }
  },

  promptMessage: {
    type: 'object',
    required: ['role', 'content'],
    properties: {
      role: { 
        type: 'string',
        enum: ['user', 'assistant', 'system']
      },
      content: {
        oneOf: [
          { type: 'string' },
          {
            type: 'array',
            items: {
              type: 'object',
              required: ['type'],
              oneOf: [
                {
                  properties: {
                    type: { type: 'string', const: 'text' },
                    text: { type: 'string' }
                  },
                  required: ['text']
                },
                {
                  properties: {
                    type: { type: 'string', const: 'image' },
                    data: { type: 'string' },
                    mimeType: { type: 'string' }
                  },
                  required: ['data', 'mimeType']
                },
                {
                  properties: {
                    type: { type: 'string', const: 'resource' },
                    resource: {
                      type: 'object',
                      required: ['uri'],
                      properties: {
                        uri: { type: 'string', format: 'uri' },
                        text: { type: 'string' },
                        mimeType: { type: 'string' }
                      }
                    }
                  },
                  required: ['resource']
                }
              ]
            }
          }
        ]
      }
    }
  },

  // MCP Server Info
  serverInfo: {
    type: 'object',
    required: ['name', 'version'],
    properties: {
      name: { type: 'string' },
      version: { type: 'string' },
      protocolVersion: { type: 'string' },
      capabilities: {
        type: 'object',
        properties: {
          tools: { type: 'object' },
          resources: { type: 'object' },
          prompts: { type: 'object' },
          logging: { type: 'object' }
        }
      }
    }
  },

  // MCP Client Info
  clientInfo: {
    type: 'object',
    required: ['name', 'version'],
    properties: {
      name: { type: 'string' },
      version: { type: 'string' }
    }
  },

  // Error codes
  errorCodes: {
    ParseError: -32700,
    InvalidRequest: -32600,
    MethodNotFound: -32601,
    InvalidParams: -32602,
    InternalError: -32603
  }
}

// Validation helper
export function validateSchema(data: any, schema: any): { valid: boolean; errors?: any[] } {
  // In production, use a JSON Schema validator like Ajv
  // For now, basic validation
  try {
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data)) {
          return { 
            valid: false, 
            errors: [{ message: `Missing required field: ${field}` }] 
          }
        }
      }
    }
    return { valid: true }
  } catch (error) {
    return { 
      valid: false, 
      errors: [{ message: error instanceof Error ? error.message : 'Validation error' }] 
    }
  }
}