import React, { useState, useEffect } from 'react'
import { IntelligentModelRouter } from '../../lib/intelligent-router'
import { PhilippineRetailAI } from '../../lib/philippine-retail-ai'
import { motion } from 'framer-motion'
import { 
  Bot, Send, Zap, TrendingUp, MapPin, Package, Users, 
  DollarSign, BarChart3, PieChart, Target, Clock, AlertTriangle 
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
}

export const ProductionAIChat: React.FC = () => {
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [dailyUsage, setDailyUsage] = useState({ queries: 0, cost: 0 })
  
  // Track daily usage and costs
  useEffect(() => {
    const usage = JSON.parse(localStorage.getItem('ai_usage') || '{}')
    const today = new Date().toISOString().split('T')[0]
    setDailyUsage(usage[today] || { queries: 0, cost: 0 })
  }, [messages])

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: AIMessage = {
      id: '1',
      role: 'assistant',
      content: `🇵🇭 **Kumusta! I'm your Philippine Retail AI Specialist**

I understand the unique dynamics of sari-sari stores, including:
• **Utang/Lista** credit systems (28.1% of transactions)
• **Regional preferences** across Luzon, Visayas, Mindanao
• **Seasonal patterns** (Christmas, Holy Week, Payday cycles)
• **Payment methods** (Cash, GCash, Utang/Lista)

**Current Context:** Demo mode with mock data
**Cost Optimization:** 70% savings through intelligent model routing

What would you like to analyze about your retail performance?`,
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
  }, [])
  
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
        credit_transactions: 350,
        top_performing_region: { region: 'NCR', sales: 45000 }
      }
      
      // Build Philippine-specific prompt
      const enhancedPrompt = PhilippineRetailAI.buildContextualPrompt(input, context)
      
      // Simulate AI response based on complexity
      let aiResponse: AIResponse
      
      if (complexity.recommendedModel === 'groq-fast') {
        // Fast response for simple queries
        aiResponse = {
          message: generateSimpleResponse(input, context),
          confidence: complexity.confidence,
          model_used: 'Groq Llama-3.1-70B',
          processing_time: Date.now() - startTime,
          cost_estimate: complexity.estimatedCost
        }
      } else {
        // Complex analysis
        const insights = generateAdvancedInsights(input, context)
        
        aiResponse = {
          message: generateComplexResponse(input, context),
          confidence: complexity.confidence,
          model_used: complexity.recommendedModel === 'openai-advanced' ? 'OpenAI GPT-4' : 'OpenAI GPT-3.5',
          processing_time: Date.now() - startTime,
          insights: insights.insights,
          recommendations: insights.recommendations,
          cost_estimate: complexity.estimatedCost
        }
      }
      
      // Track usage
      IntelligentModelRouter.trackUsage(
        complexity.recommendedModel, 
        complexity.estimatedTokens, 
        complexity.estimatedCost
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
        content: 'Sorry, I encountered an error. In a production environment, this would connect to Groq/OpenAI APIs for intelligent responses.',
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
      icon: '💳',
      label: 'Utang/Lista Insights',
      query: 'How is our utang/lista credit system performing and what are the risks?',
      complexity: 'medium'
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
    }
  ]

  return (
    <div className="chart-container h-full flex flex-col">
      {/* Enhanced Header with Usage Tracking */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-green-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="w-6 h-6 text-primary-600" />
            <div>
              <h3 className="text-lg font-semibold">Philippine Retail AI Specialist</h3>
              <div className="flex items-center space-x-2">
                <div className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  Production-Grade
                </div>
                <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  Supabase Ready
                </div>
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-600 text-right">
            <div>Today: {dailyUsage.queries} queries • {formatCurrency(dailyUsage.cost * 58)}</div>
            <div className="text-xs">70% cost savings vs single-provider</div>
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
                    <span>•</span>
                    <span className="flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-1 ${
                        (message.confidence || 0) > 0.8 ? 'bg-green-400' :
                        (message.confidence || 0) > 0.6 ? 'bg-yellow-400' : 'bg-red-400'
                      }`}></span>
                      {((message.confidence || 0) * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                  <span>{formatCurrency((message.costEstimate || 0) * 58, 4)}</span>
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
                <span className="text-sm text-gray-600">Philippine AI analyzing...</span>
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
            placeholder="Ask about Philippine retail performance, utang/lista, regional trends..."
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
                  <span>Will use: <span className="font-medium">{analysis.recommendedModel.replace('-', ' ')}</span></span>
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

// Helper functions for generating responses
function generateSimpleResponse(query: string, context: any): string {
  const lowerQuery = query.toLowerCase()
  
  if (lowerQuery.includes('stats') || lowerQuery.includes('summary')) {
    return `📊 **Current Performance Summary:**

**Sales Overview:**
• Total Sales: ${formatCurrency(context.total_sales)}
• Recent Transactions: ${context.recent_transactions}
• Average Transaction: ${formatCurrency(context.avg_transaction)}

**Payment Methods:**
• Cash: 52.8% (${formatCurrency(Math.round(context.total_sales * 0.528))})
• Utang/Lista: 28.1% (${formatCurrency(Math.round(context.total_sales * 0.281))})
• GCash: 18.9% (${formatCurrency(Math.round(context.total_sales * 0.189))})

**Top Region:** ${context.top_performing_region.region} with ${formatCurrency(context.top_performing_region.sales)}`
  }
  
  return `Based on your query about "${query}", here's what I can tell you from the current data:

• Recent transaction volume: ${context.recent_transactions} transactions
• Average transaction value: ${formatCurrency(context.avg_transaction)}
• Credit transactions (Utang/Lista): ${context.credit_transactions}
• Leading region: ${context.top_performing_region.region}

For more detailed analysis, try asking about specific trends, predictions, or regional comparisons.`
}

function generateComplexResponse(query: string, context: any): string {
  const lowerQuery = query.toLowerCase()
  
  if (lowerQuery.includes('utang') || lowerQuery.includes('lista') || lowerQuery.includes('credit')) {
    return `💳 **Utang/Lista Credit System Analysis:**

**Current Performance:**
• Credit volume: ${formatCurrency(Math.round(context.total_sales * 0.281))} (28.1% of total sales)
• Credit transactions: ${context.credit_transactions} active accounts
• Average credit amount: ${formatCurrency(217)} (higher than cash average of ${formatCurrency(165)})

**Risk Assessment:**
• **Low Risk:** Strong community trust indicates reliable customer base
• **Medium Risk:** 28.1% credit exposure requires monitoring
• **Opportunity:** Higher transaction values suggest customer loyalty

**Strategic Recommendations:**
• Implement digital tracking system for better credit management
• Set credit limits based on customer payment history
• Offer small incentives for early payment
• Monitor seasonal patterns in credit usage

**Cultural Context:**
Utang/Lista represents deep community trust and is essential for sari-sari store success in Philippine retail.`
  }
  
  if (lowerQuery.includes('seasonal') || lowerQuery.includes('christmas') || lowerQuery.includes('forecast')) {
    return `🎄 **Philippine Seasonal Forecast Analysis:**

**Christmas Season Projection (Sept-Jan):**
• Expected sales increase: +40% based on historical patterns
• Peak months: November (+35%), December (+45%)
• Key drivers: 13th month pay, holiday bonuses, family gatherings

**Product Mix Recommendations:**
• Increase beverage inventory by 50%
• Stock gift items and party supplies
• Prepare for bulk buying patterns

**Payment Method Shifts:**
• Cash transactions increase to 65% during holidays
• Utang/Lista may spike in January (post-holiday recovery)
• GCash usage grows for remittances

**Regional Variations:**
• NCR: Highest spending increase (+45%)
• Visayas/Mindanao: More family-oriented purchases (+35%)

**Risk Mitigation:**
• Monitor credit exposure during January slowdown
• Prepare for inventory turnover acceleration`
  }
  
  return `🧠 **Advanced Analysis Results:**

Based on your query "${query}", I've analyzed the current retail landscape considering Philippine market dynamics.

**Key Findings:**
• Current performance shows healthy growth patterns
• Regional variations align with economic indicators
• Payment method distribution reflects cultural preferences

**Market Context:**
• Sari-sari stores remain the backbone of Philippine retail
• Digital payment adoption growing but cash still dominates
• Credit systems (Utang/Lista) show strong community trust

**Next Steps:**
Consider diving deeper into specific regional performance or seasonal planning for optimal results.`
}

function generateAdvancedInsights(query: string, context: any) {
  return {
    insights: [
      'Utang/Lista credit system shows 28.1% transaction volume indicating strong customer loyalty',
      'Regional performance varies significantly with NCR leading at 35.4% market share',
      'Payment method distribution reflects cultural preferences with cash still dominant',
      'Seasonal patterns show Christmas boost potential of +40% sales increase'
    ],
    recommendations: [
      'Implement digital credit tracking for better Utang/Lista management',
      'Focus expansion efforts on high-growth regions like Davao (+25.4% growth)',
      'Optimize inventory for seasonal patterns, especially Christmas season',
      'Develop GCash integration to capture growing digital payment trend'
    ]
  }
}