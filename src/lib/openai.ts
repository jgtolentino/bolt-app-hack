// Mock OpenAI client for AI validation
// In production, replace with actual OpenAI configuration

export const openai = {
  chat: {
    completions: {
      create: async (params: any) => {
        // Mock response for development
        return {
          choices: [{
            message: {
              content: JSON.stringify({
                insights: ['Mock AI insight'],
                recommendations: ['Mock AI recommendation'],
                score: 85
              })
            }
          }]
        };
      }
    }
  }
};