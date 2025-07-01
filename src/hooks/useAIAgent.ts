import { useState, useCallback } from 'react';
import { insightTemplates, getTemplateById } from '../lib/insightTemplates';
import { adsbotService } from '../services/adsbotService';

interface AIResponse {
  content: string;
  template?: string;
  confidence: number;
  data?: any;
  suggestions?: string[];
}

interface UseAIAgentOptions {
  endpoint?: string;
  apiKey?: string;
  model?: 'claude' | 'gpt4' | 'pulser';
}

export const useAIAgent = (options: UseAIAgentOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AIResponse | null>(null);

  const processWithTemplate = useCallback(async (
    templateId: string,
    data: Record<string, any>,
    filters: Record<string, any>
  ): Promise<AIResponse> => {
    const template = getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Build context from data and filters
    const context = {
      template: template.name,
      description: template.description,
      filters: filters,
      data: data,
      timestamp: new Date().toISOString()
    };

    // Use AdsBot service to generate real insights
    const response = await adsbotService.query({
      type: 'insight',
      templateId,
      data,
      filters,
      context: {
        template: template.name,
        description: template.description,
        timestamp: new Date().toISOString()
      }
    });
    
    return {
      content: response.content,
      template: template.name,
      confidence: response.confidence,
      suggestions: response.suggestions || [`Explore ${template.category} insights`, 'View detailed analysis', 'Compare time periods']
    };
  }, []);

  const askQuestion = useCallback(async (
    question: string,
    context?: Record<string, any>
  ): Promise<AIResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      // Use AdsBot for question answering
      const response = await adsbotService.query({
        type: 'chat',
        text: question,
        context: context || {},
        realtime: true
      });
      
      const aiResponse: AIResponse = {
        content: response.content,
        confidence: response.confidence,
        template: response.template,
        suggestions: response.suggestions
      };
      
      setResponse(aiResponse);
      return aiResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI processing failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateInsight = useCallback(async (
    data: Record<string, any>,
    filters: Record<string, any>,
    templateId?: string
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      if (templateId) {
        const result = await processWithTemplate(templateId, data, filters);
        return result.content;
      } else {
        // Auto-detect best template based on data
        const bestTemplate = detectBestTemplate(data);
        if (bestTemplate) {
          const result = await processWithTemplate(bestTemplate.id, data, filters);
          return result.content;
        }
      }
      
      return 'Unable to generate insight for the provided data.';
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Insight generation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [processWithTemplate]);

  return {
    isLoading,
    error,
    response,
    askQuestion,
    generateInsight,
    processWithTemplate
  };
};

// Helper functions for simulation
const simulateAIResponse = async (template: any, context: any): Promise<AIResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const responses: Record<string, () => AIResponse> = {
    priceSensitivity: () => ({
      content: `Price elasticity analysis reveals a coefficient of -1.35 for the filtered products. A 10% price increase would likely reduce demand by 13.5%. Current average price of ₱${context.data.avgPrice || 50} appears optimal for the market.`,
      confidence: 0.87,
      suggestions: [
        'Consider regional price variations',
        'Test promotional pricing on low-elasticity items',
        'Monitor competitor pricing weekly'
      ]
    }),
    substitutionMap: () => ({
      content: `Brand switching analysis shows ${context.data.topSubstitution?.from || 'Coke'} → ${context.data.topSubstitution?.to || 'Pepsi'} occurs in ${context.data.topSubstitution?.rate || 15}% of stockouts. ${context.filters.region ? `Pattern is stronger in ${context.filters.region}` : 'Pattern consistent across regions'}.`,
      confidence: 0.92,
      data: {
        topFlows: [
          { from: 'Coke', to: 'Pepsi', rate: 15 },
          { from: 'Milo', to: 'Ovaltine', rate: 12 },
          { from: 'Tide', to: 'Ariel', rate: 8 }
        ]
      }
    }),
    basketComposition: () => ({
      content: `Average basket contains ${context.data.avgBasketSize || 3.2} items. ${context.data.topCategory || 'Beverages'} appears in 78% of transactions. Cross-sell opportunity identified: chips with drinks show ${context.data.crossSellRate || 45}% attachment rate.`,
      confidence: 0.89,
      suggestions: [
        'Create beverage + snack bundles',
        'Position chips near beverage coolers',
        'Offer combo discounts during peak hours'
      ]
    })
  };

  const generator = responses[template.id] || (() => ({
    content: `Analysis complete for ${template.name}. Processing ${Object.keys(context.data).length} data points.`,
    confidence: 0.75
  }));

  return generator();
};

const simulateQuestionResponse = async (question: string, context?: any): Promise<AIResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1200));

  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('sales') || lowerQuestion.includes('revenue')) {
    return {
      content: 'Sales analysis shows positive trends with 12% YoY growth. Top performing categories are Beverages (+15%) and Snacks (+18%). Regional variations exist with NCR leading at ₱441K monthly revenue.',
      confidence: 0.88,
      template: 'priceSensitivity'
    };
  }
  
  if (lowerQuestion.includes('customer') || lowerQuestion.includes('demographic')) {
    return {
      content: 'Customer analysis reveals Female 35-44 as highest value segment (₱215 avg basket). Young adults (18-24) showing fastest growth at +28% YoY. Payment preferences shifting towards digital with GCash adoption at 12.8%.',
      confidence: 0.85,
      template: 'genderPreference'
    };
  }

  return {
    content: `I understand you're asking about "${question}". Based on available data, I can provide insights on sales trends, customer behavior, product performance, and operational patterns. Please specify which area you'd like to explore.`,
    confidence: 0.70
  };
};

const detectBestTemplate = (data: Record<string, any>) => {
  // Simple heuristic to detect best template based on data keys
  const dataKeys = Object.keys(data);
  
  if (dataKeys.includes('unit_price') || dataKeys.includes('price')) {
    return insightTemplates.find(t => t.id === 'priceSensitivity');
  }
  
  if (dataKeys.includes('gender') || dataKeys.includes('age_group')) {
    return insightTemplates.find(t => t.id === 'genderPreference');
  }
  
  if (dataKeys.includes('basket') || dataKeys.includes('products')) {
    return insightTemplates.find(t => t.id === 'basketComposition');
  }
  
  return insightTemplates[0]; // Default to first template
};