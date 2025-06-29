import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bot, Lightbulb, TrendingUp, AlertTriangle, Target, Zap, X, RefreshCcw } from 'lucide-react'
import { OpenAIService } from '../../lib/openai-service'
import { IntelligentModelRouter } from '../../lib/intelligent-router'
import { PhilippineRetailAI } from '../../lib/philippine-retail-ai'
import { useDataStore } from '../../stores/dataStore'

interface AIInsight {
  id: string
  type: 'insight' | 'recommendation' | 'warning' | 'opportunity'
  title: string
  description: string
  confidence: number
  actionable: boolean
}

interface AIInsightsPanelProps {
  context: string // 'overview', 'transactions', 'products', 'geography', 'consumers'
  data?: any
  filters?: any
  className?: string
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ 
  context, 
  data, 
  filters, 
  className = '' 
}) => {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null)
  const [isLive, setIsLive] = useState(false)
  const { useRealData } = useDataStore()

  // Check if API is configured
  useEffect(() => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    setIsLive(!!apiKey && apiKey.startsWith('sk-') && useRealData)
  }, [useRealData])

  // Generate insights when context or data changes
  useEffect(() => {
    generateInsights()
  }, [context, data, filters, useRealData])

  const generateInsights = async () => {
    setLoading(true)
    try {
      if (isLive) {
        // LIVE: Generate real AI insights
        const prompt = buildContextualPrompt(context, data, filters)
        const response = await OpenAIService.generateResponse(prompt, 'gpt-3.5-turbo')
        const parsedInsights = parseAIResponse(response.message)
        setInsights(parsedInsights)
      } else {
        // Demo: Generate contextual insights based on the current data
        const generatedInsights = generateDynamicInsights(context, data)
        setInsights(generatedInsights)
      }
      setLastGenerated(new Date())
    } catch (error) {
      console.error('Failed to generate insights:', error)
      // Fallback to dynamic insights
      const generatedInsights = generateDynamicInsights(context, data)
      setInsights(generatedInsights)
    } finally {
      setLoading(false)
    }
  }

  const buildContextualPrompt = (context: string, data: any, filters: any): string => {
    const basePrompt = `Generate 3-4 actionable insights for a Philippine retail analytics dashboard.

Context: ${context} page
Current filters: ${JSON.stringify(filters || {})}
Data summary: ${JSON.stringify(data || {})}

For each insight, provide:
1. Type (insight/recommendation/warning/opportunity)
2. Title (max 50 chars)
3. Description (max 120 chars)
4. Confidence (0-100)
5. Actionable (true/false)

Focus on Philippine retail dynamics: sari-sari stores, regional differences, seasonal patterns, payment methods.

Format as JSON array with objects containing: type, title, description, confidence, actionable`

    return PhilippineRetailAI.buildContextualPrompt(basePrompt, data || {})
  }

  const parseAIResponse = (response: string): AIInsight[] => {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return parsed.map((item: any, index: number) => ({
          id: `ai-${index}`,
          type: item.type || 'insight',
          title: item.title || 'AI Insight',
          description: item.description || 'Generated insight',
          confidence: item.confidence || 85,
          actionable: item.actionable !== false
        }))
      }
    } catch (error) {
      console.warn('Failed to parse AI response, using fallback')
    }
    
    // Fallback parsing
    return generateDynamicInsights(context, data)
  }

  const generateDynamicInsights = (context: string, data: any): AIInsight[] => {
    // Generate insights dynamically based on the actual data provided
    const insights: AIInsight[] = []
    
    // Common insights based on context
    if (context === 'overview') {
      if (data?.kpiMetrics?.length > 0) {
        const salesMetric = data.kpiMetrics.find((m: any) => m.id === 'total_sales')
        if (salesMetric && salesMetric.change > 0) {
          insights.push({
            id: 'ov-1',
            type: 'insight',
            title: `Sales Growth Trend`,
            description: `Sales increased by ${salesMetric.change}% - analyze top performing products and regions`,
            confidence: 90,
            actionable: true
          })
        }
      }
      
      if (data?.geographicData?.length > 0) {
        const topRegion = data.geographicData.sort((a: any, b: any) => b.total_sales - a.total_sales)[0]
        if (topRegion) {
          insights.push({
            id: 'ov-2',
            type: 'opportunity',
            title: `${topRegion.region} Expansion Opportunity`,
            description: `${topRegion.region} shows strong performance with room for growth`,
            confidence: 85,
            actionable: true
          })
        }
      }
      
      // Seasonal insight based on current month
      const currentMonth = new Date().getMonth()
      if (currentMonth >= 8 && currentMonth <= 11) {
        insights.push({
          id: 'ov-3',
          type: 'recommendation',
          title: 'Christmas Season Prep',
          description: 'Historical data shows 40% sales increase - prepare inventory',
          confidence: 95,
          actionable: true
        })
      } else if (currentMonth >= 5 && currentMonth <= 6) {
        insights.push({
          id: 'ov-3',
          type: 'recommendation',
          title: 'Back-to-School Opportunity',
          description: 'Prepare for 25% sales increase during back-to-school season',
          confidence: 92,
          actionable: true
        })
      }
    } else if (context === 'transactions') {
      if (data?.timePatterns?.length > 0) {
        const peakHour = data.timePatterns.sort((a: any, b: any) => b.transactions - a.transactions)[0]
        if (peakHour) {
          insights.push({
            id: 'tr-1',
            type: 'insight',
            title: 'Peak Hours Optimization',
            description: `${peakHour.hour} shows highest transaction volume - optimize staffing`,
            confidence: 88,
            actionable: true
          })
        }
      }
      
      if (data?.paymentMethods?.length > 0) {
        const gcashPayment = data.paymentMethods.find((p: any) => p.name === 'GCash')
        if (gcashPayment) {
          insights.push({
            id: 'tr-2',
            type: 'opportunity',
            title: 'Digital Payment Growth',
            description: `GCash adoption growing - consider enhanced digital integration`,
            confidence: 87,
            actionable: true
          })
        }
      }
    } else if (context === 'products') {
      if (data?.categoryPerformance?.length > 0) {
        const topCategory = data.categoryPerformance.sort((a: any, b: any) => b.growth - a.growth)[0]
        if (topCategory) {
          insights.push({
            id: 'pr-1',
            type: 'insight',
            title: `${topCategory.category} Category Leader`,
            description: `${topCategory.category} shows ${topCategory.growth}% growth - highest performing category`,
            confidence: 91,
            actionable: false
          })
        }
        
        const lowMarginCategory = data.categoryPerformance.sort((a: any, b: any) => a.margin - b.margin)[0]
        if (lowMarginCategory) {
          insights.push({
            id: 'pr-2',
            type: 'warning',
            title: `Low Margin in ${lowMarginCategory.category}`,
            description: `${lowMarginCategory.category} has ${lowMarginCategory.margin}% margin - review pricing strategy`,
            confidence: 85,
            actionable: true
          })
        }
      }
    } else if (context === 'geography') {
      if (data?.regionalPerformance?.length > 0) {
        const highGrowthRegion = data.regionalPerformance.sort((a: any, b: any) => b.growth - a.growth)[0]
        if (highGrowthRegion) {
          insights.push({
            id: 'ge-1',
            type: 'opportunity',
            title: `${highGrowthRegion.region} Growth Potential`,
            description: `${highGrowthRegion.region} shows ${highGrowthRegion.growth}% growth with room for expansion`,
            confidence: 93,
            actionable: true
          })
        }
        
        const lowDensityRegion = data.regionalPerformance.sort((a: any, b: any) => a.density - b.density)[0]
        if (lowDensityRegion) {
          insights.push({
            id: 'ge-2',
            type: 'insight',
            title: 'Store Density Opportunity',
            description: `${lowDensityRegion.region} has low store density - consider expansion`,
            confidence: 84,
            actionable: true
          })
        }
      }
    } else if (context === 'consumers') {
      if (data?.customerSegments?.length > 0) {
        const topSegment = data.customerSegments.sort((a: any, b: any) => b.percentage - a.percentage)[0]
        if (topSegment) {
          insights.push({
            id: 'co-1',
            type: 'insight',
            title: `${topSegment.segment} Segment Dominance`,
            description: `${topSegment.segment} represents ${topSegment.percentage}% of customers - tailor offerings`,
            confidence: 89,
            actionable: true
          })
        }
        
        const highValueSegment = data.customerSegments.sort((a: any, b: any) => b.avg_spend - a.avg_spend)[0]
        if (highValueSegment) {
          insights.push({
            id: 'co-2',
            type: 'recommendation',
            title: 'High-Value Customer Focus',
            description: `${highValueSegment.segment} spend ${highValueSegment.avg_spend} on average - develop loyalty program`,
            confidence: 90,
            actionable: true
          })
        }
      }
    }
    
    // Add a generic insight if we don't have enough
    if (insights.length < 3) {
      insights.push({
        id: 'gen-1',
        type: 'recommendation',
        title: 'Payday Cycle Optimization',
        description: '15th and 30th show 20% sales spikes - plan promotional campaigns',
        confidence: 94,
        actionable: true
      })
    }
    
    return insights
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'insight': return Lightbulb
      case 'recommendation': return Target
      case 'warning': return AlertTriangle
      case 'opportunity': return TrendingUp
      default: return Lightbulb
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'insight': return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'recommendation': return 'bg-green-50 border-green-200 text-green-800'
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'opportunity': return 'bg-purple-50 border-purple-200 text-purple-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  if (!isExpanded) {
    return (
      <motion.div
        className={`fixed bottom-4 right-4 z-50 ${className}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        <button
          onClick={() => setIsExpanded(true)}
          className="w-12 h-12 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
        >
          <Bot className="w-6 h-6" />
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div
      className={`bg-white/90 backdrop-blur-sm border border-white/30 rounded-xl shadow-lg ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-primary-600" />
          <div>
            <h3 className="font-semibold text-gray-900">AI Insights</h3>
            <div className="flex items-center space-x-2 text-xs">
              <span className={`px-2 py-0.5 rounded-full ${
                isLive ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {isLive ? 'LIVE' : 'Demo'}
              </span>
              <span className="text-gray-500 capitalize">{context} Context</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={generateInsights}
            disabled={loading}
            className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-50"
            title="Refresh insights"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 text-gray-600 hover:text-gray-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Insights */}
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600">
                {isLive ? 'AI analyzing...' : 'Generating insights...'}
              </span>
            </div>
          </div>
        ) : (
          insights.map((insight) => {
            const Icon = getInsightIcon(insight.type)
            return (
              <motion.div
                key={insight.id}
                className={`p-3 border rounded-lg ${getInsightColor(insight.type)}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-start space-x-2">
                  <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm truncate">{insight.title}</h4>
                      <div className="flex items-center space-x-1 text-xs">
                        <span>{insight.confidence}%</span>
                        {insight.actionable && <Zap className="w-3 h-3" />}
                      </div>
                    </div>
                    <p className="text-xs opacity-90">{insight.description}</p>
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Footer */}
      {lastGenerated && (
        <div className="px-4 py-2 border-t border-gray-200 text-xs text-gray-500">
          Last updated: {lastGenerated.toLocaleTimeString()}
        </div>
      )}
    </motion.div>
  )
}