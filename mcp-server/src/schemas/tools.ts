import { z } from 'zod';

// TODO: Define your tool schemas here
export const ExampleToolSchema = z.object({
  input: z.string().describe('Example input parameter'),
});

// TODO: Define your tools here
export const TOOLS = [
  {
    name: 'example_tool',
    description: 'Example tool description',
    inputSchema: {
      type: 'object',
      properties: {
        input: {
          type: 'string',
          description: 'Example input parameter',
        },
      },
      required: ['input'],
    },
  },
] as const;
