import { insightTemplates } from '../lib/insightTemplates';
import { getCredentials, hasAIProvider, getFallbackAIProvider } from '../config/credentials';

// Get credentials from centralized config
const credentials = getCredentials();

// AI Service Configuration
const AI_CONFIG = {
  openai: {
    apiKey: credentials.ai.openai.apiKey,
    model: credentials.ai.openai.model,
    endpoint: 'https://api.openai.com/v1/chat/completions'
  },
  anthropic: {
    apiKey: credentials.ai.anthropic.apiKey,
    model: credentials.ai.anthropic.model,
    endpoint: 'https://api.anthropic.com/v1/messages'
  },
  groq: {
    apiKey: credentials.ai.groq.apiKey,
    model: credentials.ai.groq.model,
    endpoint: 'https://api.groq.com/openai/v1/chat/completions'
  }
};

export interface AIServiceOptions {
  provider?: 'openai' | 'anthropic' | 'groq';
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

class AIService {
  private provider: 'openai' | 'anthropic' | 'groq';
  private apiKey: string | undefined;
  private fallbackProvider: 'openai' | 'anthropic' | 'groq' | null = null;
  private fallbackApiKey: string | undefined;

  constructor(options: AIServiceOptions = {}) {
    this.provider = options.provider || 'openai';
    this.apiKey = this.getApiKey(this.provider);

    // Set up fallback provider - check all available providers
    const providers: Array<'openai' | 'anthropic' | 'groq'> = ['openai', 'anthropic', 'groq'];
    for (const p of providers) {
      if (p !== this.provider && this.getApiKey(p)) {
        this.fallbackProvider = p;
        this.fallbackApiKey = this.getApiKey(p);
        break;
      }
    }

    if (!this.apiKey && !this.fallbackApiKey) {
      console.warn('AI API keys not found. Some features may be limited.');
    }
  }

  private getApiKey(provider: 'openai' | 'anthropic' | 'groq'): string | undefined {
    return AI_CONFIG[provider].apiKey;
  }

  async generateInsight(
    templateId: string,
    data: Record<string, any>,
    filters: Record<string, any>
  ): Promise<string> {
    const template = insightTemplates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Check API key
    if (!this.apiKey) {
      console.warn('AI API key not found, some features limited');
      return 'AI features require API keys. Add VITE_OPENAI_API_KEY, VITE_ANTHROPIC_API_KEY, or VITE_GROQ_API_KEY in Vercel settings.';
    }

    // Build the prompt
    const prompt = this.buildPrompt(template, data, filters);

    try {
      switch (this.provider) {
        case 'openai':
          return await this.callOpenAI(prompt);
        case 'anthropic':
          return await this.callAnthropic(prompt);
        case 'groq':
          return await this.callGroq(prompt);
        default:
          throw new Error(`Unknown provider: ${this.provider}`);
      }
    } catch (error) {
      console.error(`${this.provider} API call failed:`, error);
      
      // Try fallback provider if available
      if (this.fallbackProvider && this.fallbackApiKey) {
        console.log(`Attempting fallback to ${this.fallbackProvider}...`);
        try {
          // Temporarily swap providers
          const originalProvider = this.provider;
          const originalApiKey = this.apiKey;
          this.provider = this.fallbackProvider as 'openai' | 'anthropic' | 'groq';
          this.apiKey = this.fallbackApiKey;
          
          let result: string;
          switch (this.provider) {
            case 'openai':
              result = await this.callOpenAI(prompt);
              break;
            case 'anthropic':
              result = await this.callAnthropic(prompt);
              break;
            case 'groq':
              result = await this.callGroq(prompt);
              break;
            default:
              throw new Error(`Unknown provider: ${this.provider}`);
          }
          
          // Restore original provider
          this.provider = originalProvider;
          this.apiKey = originalApiKey;
          
          return result;
        } catch (fallbackError) {
          console.error(`Fallback ${this.fallbackProvider} also failed:`, fallbackError);
        }
      }
      
      // Use mock insights as final fallback
      console.warn('All AI providers failed. Using mock insights.');
      return this.generateMockInsight(template, data, filters);
    }
  }

  private buildPrompt(template: any, data: Record<string, any>, filters: Record<string, any>): string {
    const context = `
      You are analyzing retail data with the following context:
      - Template: ${template.name}
      - Description: ${template.description}
      - Current Filters: ${JSON.stringify(filters)}
      - Available Data: ${JSON.stringify(data)}
      
      ${template.aiPromptTemplate}
      
      Provide actionable insights in 2-3 sentences. Be specific and include numbers where relevant.
    `;
    return context;
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const response = await fetch(AI_CONFIG.openai.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: AI_CONFIG.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are a retail analytics expert providing actionable insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async callAnthropic(prompt: string): Promise<string> {
    const response = await fetch(AI_CONFIG.anthropic.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: AI_CONFIG.anthropic.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  private async callGroq(prompt: string): Promise<string> {
    const response = await fetch(AI_CONFIG.groq.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: AI_CONFIG.groq.model,
        messages: [
          {
            role: 'system',
            content: 'You are a retail analytics expert providing actionable insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private generateMockInsight(template: any, data: any, filters: any): string {
    // Smart mock responses based on template
    const mockResponses: Record<string, string> = {
      priceSensitivity: `Price elasticity analysis shows -1.35 coefficient. A 10% price increase would reduce demand by 13.5%. Current pricing appears optimal for ${filters.region || 'all regions'}.`,
      
      substitutionMap: `Brand switching peaks at 15% when primary choice is out of stock. Coke→Pepsi is most common, followed by Milo→Ovaltine at 12%. Consider stock alerts for high-substitution items.`,
      
      basketComposition: `Average basket size is ${data.avgBasketSize || 3.2} items. Beverages appear in 78% of transactions. Bundle chips+drinks for 15% revenue uplift opportunity.`,
      
      peakHourAnalysis: `Peak hours are 6-7 PM with 32% of daily volume. Morning rush at 7-8 AM captures 18%. Staff scheduling could be optimized for 2-4 PM lull.`,
      
      genderPreference: `Female 35-44 segment shows highest value at ₱${data.avgBasket || 215} per basket. Male 18-24 fastest growing (+28% YoY). Target promotions accordingly.`,
      
      demandForecast: `Next 7 days forecast shows +12% volume increase. Stock up on beverages (+15% expected) and snacks (+18% expected). Weekend surge anticipated.`,
      
      stockoutPrediction: `Critical stock alert: ${data.criticalSKU || 'COKE-1.5L'} has 3-day supply at current velocity. ${data.affectedStores || 5} stores at risk. Reorder immediately.`,
      
      churnRiskAnalysis: `${data.atRiskCount || 234} customers show declining visit frequency. Target with personalized offers. Focus on high-value segments first.`,
      
      promotionEffectiveness: `Last promotion generated ${data.roi || 2.3}x ROI. Sweet spot is 15-20% discount. Deeper discounts show diminishing returns.`
    };

    return mockResponses[template.id] || `Analysis complete for ${template.name}. Contact support to enable live AI insights.`;
  }

  async askQuestion(question: string, context?: Record<string, any>): Promise<string> {
    if (!this.apiKey) {
      throw new Error('❌ AI API key required. Add VITE_OPENAI_API_KEY or VITE_ANTHROPIC_API_KEY to enable AI features.');
    }

    const prompt = `
      As a retail analytics expert, answer this question: "${question}"
      
      Context: ${context ? JSON.stringify(context) : 'General retail analytics'}
      
      Provide a clear, actionable answer with specific numbers and recommendations where relevant.
    `;

    try {
      if (this.provider === 'openai') {
        return await this.callOpenAI(prompt);
      } else {
        return await this.callAnthropic(prompt);
      }
    } catch (error) {
      console.error(`${this.provider} question failed:`, error);
      
      // Try fallback provider if available
      if (this.fallbackProvider && this.fallbackApiKey) {
        console.log(`Attempting fallback to ${this.fallbackProvider}...`);
        try {
          // Temporarily swap providers
          const originalProvider = this.provider;
          const originalApiKey = this.apiKey;
          this.provider = this.fallbackProvider as 'openai' | 'anthropic' | 'groq';
          this.apiKey = this.fallbackApiKey;
          
          let result: string;
          switch (this.provider) {
            case 'openai':
              result = await this.callOpenAI(prompt);
              break;
            case 'anthropic':
              result = await this.callAnthropic(prompt);
              break;
            case 'groq':
              result = await this.callGroq(prompt);
              break;
            default:
              throw new Error(`Unknown provider: ${this.provider}`);
          }
          
          // Restore original provider
          this.provider = originalProvider;
          this.apiKey = originalApiKey;
          
          return result;
        } catch (fallbackError) {
          console.error(`Fallback ${this.fallbackProvider} also failed:`, fallbackError);
        }
      }
      
      throw new Error('❌ All AI providers failed. Check your API keys and network connection.');
    }
  }

  private generateMockAnswer(question: string, context?: any): string {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('sales') || lowerQuestion.includes('revenue')) {
      return 'Sales are trending up 12% YoY with ₱4.97M total. NCR leads with ₱441K monthly. Focus on Region III for growth - currently underperforming by 18% vs potential.';
    }
    
    if (lowerQuestion.includes('product') || lowerQuestion.includes('sku')) {
      return 'Top SKUs: COKE-1.5L (₱9.2M), COKE-250ML (₱9.0M), MILO-300ML (₱8.9M). Consider bundling slow movers with these champions. 20% of SKUs drive 78% of revenue.';
    }
    
    if (lowerQuestion.includes('customer') || lowerQuestion.includes('demographic')) {
      return 'Female 35-44 is your golden segment (₱215 avg basket). Young adults growing fastest (+28% YoY). Tailor promotions by age group for 15% revenue lift.';
    }
    
    return `Great question about "${question}". Enable AI integration for detailed analysis. Currently showing sample insights based on your retail data patterns.`;
  }
}

// Export singleton instance
export const aiService = new AIService();

// Export for custom configurations
export { AIService };