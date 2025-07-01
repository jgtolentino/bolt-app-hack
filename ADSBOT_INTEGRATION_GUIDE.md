# AdsBot Integration Guide

## Overview

AdsBot is a centralized AI orchestrator that handles all retail analytics operations with intelligent routing between Claude and GPT models. It replaces individual specialized agents with a unified, multi-capable system.

## Quick Start

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Add your API keys to .env
VITE_OPENAI_API_KEY=sk-...
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Using AdsBot in Your Code

#### React Hook Integration

```typescript
import { useAdsBot } from './hooks/useAdsBot';

function MyComponent() {
  const { query, isLoading, response } = useAdsBot();
  
  const handleAnalysis = async () => {
    const result = await query({
      type: 'insight',
      templateId: 'priceSensitivity',
      data: { avgPrice: 50, category: 'beverages' },
      filters: { region: 'NCR' }
    });
  };
  
  return (
    <button onClick={handleAnalysis}>
      Analyze Price Sensitivity
    </button>
  );
}
```

#### Direct Service Integration

```typescript
import { adsBot } from './services/adsbot-runtime';

// Simple query
const response = await adsBot.processQuery({
  type: 'chat',
  text: 'What are the top selling products today?',
  context: { timeframe: 'today' }
});

// Template-based insight
const insight = await adsBot.processQuery({
  type: 'insight',
  templateId: 'substitutionMap',
  data: { 
    topSubstitution: { from: 'Coke', to: 'Pepsi', rate: 15 }
  },
  filters: { region: 'NCR', store: 'Store-001' }
});
```

### 3. Pulser CLI Usage

```bash
# Install Pulser CLI globally
npm install -g @pulser/cli

# Basic queries
pulser ai query "What products are trending?"
pulser ai insight price --category beverages
pulser ai forecast demand --sku COKE-1.5L

# Advanced usage
pulser adsbot analyze trend --metric revenue --period 30d --json
pulser adsbot agent subswitch --from Coke --to Pepsi
pulser adsbot chat --context ./context.json

# Monitoring
pulser adsbot status health
pulser adsbot status metrics --period 1h
pulser adsbot cache stats
```

## Query Types

### 1. Insight Queries
Generate insights using predefined templates:

```typescript
{
  type: 'insight',
  templateId: 'priceSensitivity',
  data: { /* relevant data */ },
  filters: { /* applied filters */ }
}
```

### 2. Chat Queries
Conversational interface for natural language:

```typescript
{
  type: 'chat',
  text: 'Show me sales trends for last week',
  context: { /* additional context */ }
}
```

### 3. Analysis Queries
Deep analytical processing:

```typescript
{
  type: 'analysis',
  text: 'Analyze customer behavior patterns',
  complexity: 'high',
  data: { /* dataset */ }
}
```

### 4. Forecast Queries
Predictive analytics:

```typescript
{
  type: 'forecast',
  templateId: 'demandForecast',
  data: { historicalSales: [...] },
  filters: { sku: 'COKE-1.5L' }
}
```

## Provider Routing

AdsBot automatically routes queries to the optimal AI provider:

| Query Type | Primary Provider | Fallback | Cache TTL |
|------------|-----------------|----------|-----------|
| Complex Analysis | Claude Opus | GPT-4 | 24 hours |
| Substitution/Demographics | Claude Opus | GPT-4 | 12 hours |
| Real-time/Chat | GPT-4 | Claude Sonnet | No cache |
| Alerts/Urgent | GPT-4 | Claude Sonnet | No cache |
| General Insights | Claude Sonnet | GPT-4 | 1 hour |

## Templates

Available insight templates:

1. **priceSensitivity** - Price elasticity analysis
2. **substitutionMap** - Brand switching patterns
3. **basketComposition** - Purchase patterns
4. **peakHourAnalysis** - Traffic patterns
5. **genderPreference** - Demographic insights
6. **demandForecast** - 7-day predictions
7. **stockoutPrediction** - Inventory alerts
8. **churnRiskAnalysis** - Customer retention
9. **promotionEffectiveness** - Campaign ROI
10. **crossSellOpportunities** - Bundle suggestions

## Response Format

```typescript
interface AIResponse {
  id: string;
  content: string;
  confidence: number;
  template?: string;
  provider: {
    name: 'anthropic' | 'openai';
    model: string;
  };
  suggestions?: string[];
  visualizations?: any[];
  actions?: AIAction[];
  timing: {
    duration: number;
  };
  cached: boolean;
}
```

## Error Handling

AdsBot includes automatic fallback:

1. **Primary provider fails** → Try fallback provider
2. **Fallback fails** → Use cached response
3. **No cache** → Return mock data with explanation

## Performance Optimization

### Caching Strategy

- High-complexity queries: 24-hour cache
- Medium complexity: 6-12 hour cache  
- Real-time queries: No cache
- LRU eviction when cache full

### Cost Optimization

```typescript
// Force specific provider for cost control
const response = await adsBot.processQuery({
  type: 'insight',
  // ... query details
}, { 
  provider: 'openai',  // Force GPT-4 for lower cost
  model: 'gpt-3.5-turbo'  // Use cheaper model
});
```

## Monitoring

### Telemetry Access

```typescript
// Get all telemetry
const allMetrics = adsBot.getTelemetry();

// Get specific metrics
const cacheHits = adsBot.getTelemetry('cache_hit', '2024-05-11');
const queryMetrics = adsBot.getTelemetry('query_success');
```

### Key Metrics

- Query volume by type
- Provider usage distribution
- Cache hit rate
- Average response time
- Error rate by provider
- Cost per query

## Creating Custom Hooks

```typescript
import { adsBot } from '../services/adsbot-runtime';
import { useState, useCallback } from 'react';

export function useAdsBot() {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const query = useCallback(async (queryParams) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await adsBot.processQuery({
        id: `q_${Date.now()}`,
        timestamp: new Date().toISOString(),
        ...queryParams
      });
      
      setResponse(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { query, isLoading, response, error };
}
```

## Best Practices

1. **Use Templates When Possible**
   - Templates provide consistent, optimized prompts
   - Better caching and performance

2. **Specify Complexity**
   - Helps route to appropriate provider
   - Improves response time and cost

3. **Provide Rich Context**
   - More context = better insights
   - Include filters, data summaries, timeframes

4. **Monitor Cache Performance**
   - Regular cache stats review
   - Adjust TTLs based on usage patterns

5. **Handle Errors Gracefully**
   - Always provide fallback UI
   - Show cached/mock data when available

## Troubleshooting

### Common Issues

1. **"No API keys configured"**
   - Ensure .env file exists with keys
   - Restart dev server after adding keys

2. **"Rate limit exceeded"**
   - AdsBot automatically falls back
   - Consider increasing cache TTLs

3. **"Template not found"**
   - Check template ID spelling
   - Use `insightTemplates` array for valid IDs

4. **Slow responses**
   - Check if using appropriate provider
   - Consider caching for repeated queries

## Next Steps

1. Integrate AdsBot into your components
2. Configure Pulser CLI aliases
3. Monitor usage and optimize routing rules
4. Extend with custom templates as needed

For questions or support, consult the inline documentation or raise an issue in the repository.