interface OpenAIResponse {
  message: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIService {
  private static readonly API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
  private static readonly BASE_URL = 'https://api.openai.com/v1/chat/completions';

  static async generateResponse(
    prompt: string, 
    model: 'gpt-3.5-turbo' | 'gpt-4' = 'gpt-3.5-turbo',
    context?: any
  ): Promise<OpenAIResponse> {
    if (!this.API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are a Philippine retail analytics AI specialist with deep knowledge of:

📍 PHILIPPINE MARKET CONTEXT:
- Regional dynamics: NCR (high income, very high density), Region VII (medium income), Region III (medium-high income)
- Cultural events: Christmas season (+40% sales), Holy Week (-15%), Back to School (+25%), Payday cycles (+20%)
- Sari-sari store dynamics: Avg transaction ₱47.50, Peak hours 7-9 AM & 5-7 PM
- Payment methods: Cash dominant (85%), GCash growing (12%), Credit limited (3%)

🎯 RESPONSE REQUIREMENTS:
- Use Philippine Peso (₱) formatting
- Reference local market dynamics and cultural factors
- Provide actionable insights for sari-sari store operators
- Include confidence scores for predictions
- Be concise but comprehensive

Current data context: ${JSON.stringify(context || {})}`;

    try {
      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: model === 'gpt-4' ? 1500 : 1000,
          temperature: 0.7,
          top_p: 0.9,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      return {
        message: data.choices[0]?.message?.content || 'No response generated',
        usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      };
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw error;
    }
  }

  static calculateCost(usage: { prompt_tokens: number; completion_tokens: number }, model: string): number {
    // OpenAI pricing (as of 2024)
    const pricing = {
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 }, // per 1K tokens
      'gpt-4': { input: 0.03, output: 0.06 } // per 1K tokens
    };

    const rates = pricing[model as keyof typeof pricing] || pricing['gpt-3.5-turbo'];
    
    const inputCost = (usage.prompt_tokens / 1000) * rates.input;
    const outputCost = (usage.completion_tokens / 1000) * rates.output;
    
    return inputCost + outputCost;
  }
}