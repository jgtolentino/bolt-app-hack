import React, { useState, useEffect } from 'react'
import { IntelligentModelRouter } from '../../lib/intelligent-router'
import { PhilippineRetailAI } from '../../lib/philippine-retail-ai'
import { AIFeatures } from '../../lib/ai-features'
import { OpenAIService } from '../../lib/openai-service'
import { motion } from 'framer-motion'
import { 
  Bot, Send, Zap, TrendingUp, MapPin, Package, Users, 
  DollarSign, BarChart3, PieChart, Target, Clock, AlertTriangle,
  CreditCard, Wifi, WifiOff
} from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'

interface AIResponse {
  message: string
  confidence: number
  model_used: string
  processing_time: number
  insights?: string[]
  recommendations?: string[]
  cost_estimate: number
  tokens_used?: number
}

interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  confidence?: number
  model?: string
  processingTime?: number
  insights?: string[]
  recommendations?: string[]
  costEstimate?: number
  tokensUsed?: number
}

export const ProductionAIChat: React.FC = () => {
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [dailyUsage, setDailyUsage] = useState({ queries: 0, cost: 0, tokens: 0 })
  const [isLive, setIsLive] = useState(false)
  
  // Check if API key is configured
  useEffect(() => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    setIsLive(!!apiKey && apiKey.startsWith('sk-'))
  }, [])

  // Track daily usage and costs
  useEffect(() => {
    const usage = JSON.parse(localStorage.getItem('ai_usage') || '{}')
    const today = new Date().toISOString().split('T')[0]
    setDailyUsage(usage[today] || { queries: 0, cost: 0, tokens: 0 })
  }, [messages])

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: AIMessage = {
      id: '1',
      role: 'assistant',
      content: `🇵🇭 **Kumusta! I'm your Philippine Retail AI Specialist**

I understand the unique dynamics of sari-sari stores, including:
• **Regional preferences** across Luzon, Visayas, Mindanao
• **Seasonal patterns** (Christmas, Holy Week, Payday cycles)
• **Payment methods** (Cash, GCash, Credit)
• **Cultural events** and their impact on sales

**Status:** ${isLive ? '🟢 LIVE with OpenAI GPT-3.5/GPT-4' : '🟡 Demo mode - Connect API for live responses'}

What would you like to analyze about your retail performance?`,
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
  }, [isLive])
  
  const handleAdvancedQuery = async () => {
    if (!input.trim()) return
    
    const startTime = Date.now()
    setLoading(true)
    
    try {
      // Intelligent routing analysis
      const complexity = IntelligentModelRouter.analyzeQuery(input)
      console.log('🧠 Query Analysis:', complexity)
      
      // Get current context (mock data for demo)
      const context = {
        recent_transactions: 1247,
        total_sales: 125000,
        avg_transaction: 87.50,
        top_performing_region: { region: 'NCR', sales: 45000 }
      }
      
      // Build Philippine-specific prompt
      const enhancedPrompt = PhilippineRetailAI.buildContextualPrompt(input, context)
      
      let aiResponse: AIResponse
      
      if (isLive) {
        // LIVE: Use actual OpenAI API
        try {
          const model = complexity.recommendedModel === 'openai-advanced' ? 'gpt-4' : 'gpt-3.5-turbo'
          const openaiResponse = await OpenAIService.generateResponse(enhancedPrompt, model, context)
          
          const actualCost = OpenAIService.calculateCost(openaiResponse.usage, model)
          
          // Generate additional insights for complex queries
          let insights: string[] = []
          let recommendations: string[] = []
          
          if (complexity.score > 2) {
            const aiInsights = await AIFeatures.generateSalesInsights([
              { region: 'NCR', total_sales: 45000 },
              { region: 'Region III', total_sales: 32000 },
              { region: 'Region VII', total_sales: 28000 }
            ])
            insights = aiInsights.insights
            recommendations = aiInsights.recommendations
          }
          
          aiResponse = {
            message: openaiResponse.message,
            confidence: complexity.confidence,
            model_used: `OpenAI ${model}`,
            processing_time: Date.now() - startTime,
            insights,
            recommendations,
            cost_estimate: actualCost,
            tokens_used: openaiResponse.usage.total_tokens
          }
        } catch (error) {
          console.error('OpenAI API Error:', error)
          throw new Error(`AI service error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      } else {
        // Fallback to enhanced mock response
        aiResponse = {
          message: generateEnhancedMockResponse(input, context),
          confidence: complexity.confidence,
          model_used: 'Demo Mode (Connect API for live responses)',
          processing_time: Date.now() - startTime,
          cost_estimate: complexity.estimatedCost,
          tokens_used: complexity.estimatedTokens
        }
      }
      
      // Track usage
      IntelligentModelRouter.trackUsage(
        complexity.recommendedModel, 
        aiResponse.tokens_used || complexity.estimatedTokens, 
        aiResponse.cost_estimate
      )
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'user',
        content: input,
        timestamp: new Date()
      }, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.message,
        confidence: aiResponse.confidence,
        model: aiResponse.model_used,
        processingTime: aiResponse.processing_time,
        insights: aiResponse.insights,
        recommendations: aiResponse.recommendations,
        costEstimate: aiResponse.cost_estimate,
        tokensUsed: aiResponse.tokens_used,
        timestamp: new Date()
      }])
      
    } catch (error) {
      console.error('AI Error:', error)
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'user',
        content: input,
        timestamp: new Date()
      }, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ **Error:** ${error instanceof Error ? error.message : 'Unknown error occurred'}\n\nPlease check your API configuration or try again.`,
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
      setInput('')
    }
  }

  // Smart quick actions based on Philippine retail context
  const smartQuickActions = [
    {
      icon: '🎯',
      label: 'Performance Analysis',
      query: 'Analyze our top and bottom performing regions with actionable recommendations',
      complexity: 'high'
    },
    {
      icon: '🔮',
      label: 'Seasonal Forecast',
      query: 'Predict Christmas season sales considering Philippine shopping patterns',
      complexity: 'high'
    },
    {
      icon: '⚠️',
      label: 'Anomaly Check',
      query: 'Detect any unusual sales patterns that need investigation',
      complexity: 'medium'
    },
    {
      icon: '🏪',
      label: 'Sari-Sari Optimization',
      query: 'How can sari-sari stores optimize their product mix and operations?',
      complexity: 'medium'
    },
    {
      icon: '📊',
      label: 'Quick Stats',
      query: 'Show me current performance summary for all regions',
      complexity: 'low'
    },
    {
      icon: '💰',
      label: 'Revenue Opportunities',
      query: 'What opportunities exist to increase revenue in underperforming areas?',
      complexity: 'high'
    }
  ]

  return (
    <div className="chart-container h-full flex flex-col">
      {/* Enhanced Header with Live Status */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-green-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="w-6 h-6 text-primary-600" />
            <div>
              <h3 className="text-lg font-semibold">Philippine Retail AI Specialist</h3>
              <div className="flex items-center space-x-2">
                <div className={`px-2 py-1 rounded-full text-xs flex items-center space-x-1 ${
                  isLive ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {isLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  <span>{isLive ? 'LIVE' : 'Demo Mode'}</span>
                </div>
                <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  Intelligent Routing
                </div>
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-600 text-right">
            <div>Today: {dailyUsage.queries} queries • {formatCurrency(dailyUsage.cost * 58)}</div>
            <div className="text-xs">{dailyUsage.tokens.toLocaleString()} tokens used</div>
          </div>
        </div>
      </div>
      
      {/* Smart Quick Actions Grid */}
      <div className="p-4 border-b bg-gray-50">
        <div className="grid grid-cols-3 gap-2">
          {smartQuickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => setInput(action.query)}
              className={`flex items-center space-x-2 p-2 text-left text-sm bg-white border rounded hover:shadow-sm transition-all ${
                action.complexity === 'high' ? 'border-purple-200 hover:border-purple-300' :
                action.complexity === 'medium' ? 'border-blue-200 hover:border-blue-300' :
                'border-green-200 hover:border-green-300'
              }`}
              title={`${action.query} (${action.complexity} complexity)`}
            >
              <span>{action.icon}</span>
              <span className="truncate">{action.label}</span>
              <span className={`text-xs px-1 rounded ${
                action.complexity === 'high' ? 'bg-purple-100 text-purple-600' :
                action.complexity === 'medium' ? 'bg-blue-100 text-blue-600' :
                'bg-green-100 text-green-600'
              }`}>
                {action.complexity}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Messages with Enhanced Display */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
              <div className={`px-4 py-3 rounded-lg ${
                message.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900'
              }`}>
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                
                {/* Enhanced AI Response Details */}
                {message.role === 'assistant' && (
                  <div className="mt-3 space-y-2">
                    {message.insights && message.insights.length > 0 && (
                      <div className="p-2 bg-blue-50 rounded text-blue-800">
                        <div className="font-medium text-xs mb-1">💡 AI Insights:</div>
                        {message.insights.map((insight: string, i: number) => (
                          <div key={i} className="text-xs">• {insight}</div>
                        ))}
                      </div>
                    )}
                    
                    {message.recommendations && message.recommendations.length > 0 && (
                      <div className="p-2 bg-green-50 rounded text-green-800">
                        <div className="font-medium text-xs mb-1">🎯 Recommendations:</div>
                        {message.recommendations.map((rec: string, i: number) => (
                          <div key={i} className="text-xs">• {rec}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Message Metadata */}
              {message.role === 'assistant' && message.model && (
                <div className="flex items-center justify-between text-xs mt-1 text-gray-500">
                  <div className="flex items-center space-x-2">
                    <span>{message.model}</span>
                    <span>•</span>
                    <span>{message.processingTime}ms</span>
                    {message.confidence && (
                      <>
                        <span>•</span>
                        <span className="flex items-center">
                          <span className={`w-2 h-2 rounded-full mr-1 ${
                            (message.confidence || 0) > 0.8 ? 'bg-green-400' :
                            (message.confidence || 0) > 0.6 ? 'bg-yellow-400' : 'bg-red-400'
                          }`}></span>
                          {((message.confidence || 0) * 100).toFixed(0)}% confidence
                        </span>
                      </>
                    )}
                    {message.tokensUsed && (
                      <>
                        <span>•</span>
                        <span>{message.tokensUsed} tokens</span>
                      </>
                    )}
                  </div>
                  {message.costEstimate && (
                    <span>{formatCurrency((message.costEstimate || 0) * 58, 4)}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-sm text-gray-600">
                  {isLive ? 'AI analyzing with OpenAI...' : 'Demo AI analyzing...'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Enhanced Input with Query Analysis Preview */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleAdvancedQuery()}
            placeholder="Ask about Philippine retail performance, trends, predictions..."
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={loading}
          />
          <button
            onClick={handleAdvancedQuery}
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        {/* Real-time Query Analysis Preview */}
        {input.trim() && (
          <div className="mt-2 text-xs text-gray-600">
            {(() => {
              const analysis = IntelligentModelRouter.analyzeQuery(input)
              return (
                <div className="flex items-center space-x-4">
                  <span>Will use: <span className="font-medium">
                    {isLive ? 
                      (analysis.recommendedModel === 'openai-advanced' ? 'OpenAI GPT-4' : 'OpenAI GPT-3.5') :
                      'Demo Mode'
                    }
                  </span></span>
                  <span>Est. cost: {formatCurrency(analysis.estimatedCost * 58, 4)}</span>
                  <span>Confidence: {analysis.confidence.toFixed(0)}%</span>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}

// Enhanced mock response for demo mode
function generateEnhancedMockResponse(query: string, context: any): string {
  const lowerQuery = query.toLowerCase()
  
  if (lowerQuery.includes('performance') || lowerQuery.includes('analysis')) {
    return `📊 **Performance Analysis Results**

Based on your Philippine retail data, I've identified several key insights:

**Regional Performance:**
• NCR leads with ₱850,000 in sales (35.4% of total)
• Region VII shows highest growth at 22.1%
• Region XI (Davao) presents greatest expansion opportunity with 25.4% growth

**Product Categories:**
• Beverages category dominates with 28.5% growth rate
• Snacks category shows strong performance in Visayas regions
• Personal Care underperforming in Region III (-5.2% vs target)

**Recommendations:**
1. Expand beverage offerings in NCR (+15% potential growth)
2. Target Region XI for expansion with localized product mix
3. Implement targeted promotions during payday periods (15th/30th)

*Note: This is a demo response. Connect OpenAI API for live analysis.*`
  }
  
  if (lowerQuery.includes('forecast') || lowerQuery.includes('predict')) {
    return `🔮 **Philippine Retail Forecast**

Based on historical patterns and current trends:

**Sales Projections:**
• Overall growth: +15.2% (±2.5%)
• NCR: +18.7% (high confidence)
• Region VII: +22.1% (medium confidence)

**Seasonal Factors:**
${new Date().getMonth() >= 8 ? 
  `• Christmas season impact: +40% expected sales increase
• Peak weeks: December 15-30 (historically highest volume)` :
  `• Regular season with payday spikes (+20%) on 15th and 30th
• Weekend sales expected to be 35% higher than weekdays`
}

**Payment Method Trends:**
• Cash remains dominant: 85% of transactions
• GCash adoption increasing: projected to reach 15% by next quarter

*Note: This is a demo response. Connect OpenAI API for live forecasting.*`
  }
  
  return `📊 **Philippine Retail Analysis**

Based on your query about "${query}":

**Key Metrics:**
• Total sales: ₱${context.total_sales?.toLocaleString() || '2,450,000'}
• Recent transactions: ${context.recent_transactions || '8,547'}
• Average transaction: ₱${context.avg_transaction?.toFixed(2) || '287.00'}

**Regional Insights:**
• NCR leads with 35.4% market share
• Region VII showing strongest growth at 22.1%
• Region XI (Davao) presents expansion opportunity

**Recommendations:**
1. Focus expansion on high-growth Region XI
2. Optimize inventory for seasonal patterns
3. Implement digital payment options

*Note: This is a demo response. Connect OpenAI API for live insights with 90% confidence.*`
}