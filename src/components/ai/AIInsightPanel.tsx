import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { insightTemplates } from '../../lib/insightTemplates';
import { useAdsBot } from '../../hooks/useAdsBot';

interface AIInsightPanelProps {
  templateId?: string;
  context: string;
  data: Record<string, any>;
  filters: Record<string, any>;
  className?: string;
}

export const AIInsightPanel: React.FC<AIInsightPanelProps> = ({ 
  templateId, 
  context, 
  data, 
  filters,
  className = ''
}) => {
  const [insights, setInsights] = useState<string[]>([]);
  const [insightType, setInsightType] = useState<'trend' | 'alert' | 'opportunity'>('trend');
  const [confidence, setConfidence] = useState<number>(0);
  
  // Use AdsBot for AI insights
  const { generateInsight, isLoading, error } = useAdsBot();

  useEffect(() => {
    // Generate insights when data or filters change
    generateContextualInsights();
  }, [data, filters, templateId]);

  const generateContextualInsights = async () => {
    try {
      if (templateId) {
        // Use template-based insight
        const insight = await generateInsight(templateId, data);
        const response = await useAdsBot().query({
          type: 'insight',
          templateId,
          data,
          filters
        });
        
        // Extract insights and confidence
        setInsights([response.content]);
        setConfidence(Math.round(response.confidence * 100));
        
        // Add suggestions if available
        if (response.suggestions && response.suggestions.length > 0) {
          setInsights(prev => [...prev, ...response.suggestions.slice(0, 2)]);
        }
      } else {
        // Generate context-aware insights
        const contextualInsights = await generateSmartInsights(context, data, filters);
        setInsights(contextualInsights);
      }
    } catch (err) {
      console.error('Failed to generate insights:', err);
      // Fallback to static insights
      setInsights(generateFallbackInsights(context, data, filters));
    }
  };

  const generateSmartInsights = async (
    context: string,
    data: any,
    filters: any
  ): Promise<string[]> => {
    // Use AdsBot to generate smart insights based on context
    const { query } = useAdsBot();
    
    try {
      const response = await query({
        type: 'analysis',
        text: `Generate 3 key insights for ${context} dashboard`,
        context: { dashboardType: context },
        data,
        filters
      });
      
      // Parse response into insights
      const insights = response.content.split('\n').filter(line => line.trim());
      return insights.slice(0, 3);
    } catch (error) {
      return generateFallbackInsights(context, data, filters);
    }
  };

  const generateFallbackInsights = (
    context: string, 
    data: any, 
    filters: any, 
    template: any
  ): string[] => {
    const insights: string[] = [];
    
    // Context-specific insights
    switch (context) {
      case 'executive':
        if (data.kpiMetrics) {
          const totalSales = data.kpiMetrics.find((m: any) => m.id === 'total_sales')?.value || 0;
          insights.push(`Total sales reached ₱${totalSales.toLocaleString()}, tracking ${filters.region ? 'in ' + filters.region : 'across all regions'}`);
          insights.push('Substitution rate at 12.5% indicates opportunity for better stock management');
        }
        break;
        
      case 'transaction-timing':
        insights.push('Peak transaction hours detected between 6-7 PM across all stores');
        insights.push('Weekend volume 23% higher than weekday average');
        if (filters.region) {
          insights.push(`${filters.region} shows unique morning spike at 7-8 AM`);
        }
        break;
        
      case 'product-sku':
        if (data.productPerformanceData && data.productPerformanceData.length > 0) {
          const topProduct = data.productPerformanceData[0];
          insights.push(`${topProduct.name} leads with ₱${topProduct.sales.toLocaleString()} in sales`);
          insights.push('Top 20% of SKUs contribute to 78% of revenue (Pareto principle)');
        }
        break;
        
      case 'consumer-patterns':
        insights.push('78% suggestion acceptance rate indicates strong staff influence');
        insights.push('Verbal requests take 50% longer than pointing-based transactions');
        break;
        
      case 'brand-switching':
        insights.push('Coke → Pepsi substitution occurs in 15% of out-of-stock scenarios');
        insights.push('Brand loyalty strongest in beverages, weakest in household items');
        break;
        
      case 'demographics':
        insights.push('Female 35-44 segment shows highest basket value at ₱215.80');
        insights.push('Young adults (18-24) growing at 28% YoY, fastest expanding segment');
        break;
        
      default:
        insights.push('Analyzing patterns in current data selection...');
    }
    
    // Add filter-specific insights
    if (filters.date_from && filters.date_to) {
      insights.push(`Data filtered from ${filters.date_from} to ${filters.date_to}`);
    }
    
    // Template-specific insights
    if (template) {
      insights.push(`Applied template: ${template.name}`);
    }
    
    return insights.slice(0, 3); // Limit to 3 insights
  };

  const getInsightIcon = () => {
    switch (insightType) {
      case 'alert':
        return <AlertTriangle className="w-4 h-4" />;
      case 'opportunity':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getInsightColor = () => {
    switch (insightType) {
      case 'alert':
        return 'from-yellow-400 to-orange-500';
      case 'opportunity':
        return 'from-purple-400 to-pink-500';
      default:
        return 'from-blue-400 to-cyan-500';
    }
  };

  return (
    <motion.div
      className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${getInsightColor()} p-4 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <h3 className="font-semibold">AI Insights</h3>
          </div>
          <div className="flex items-center space-x-2">
            {getInsightIcon()}
            <span className="text-sm capitalize">{insightType}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-4/5"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/5"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <motion.div
                key={index}
                className="flex items-start space-x-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">{insight}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Confidence Score */}
        {confidence > 0 && (
          <div className="mt-3 flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${confidence}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{confidence}% confidence</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex items-center justify-between">
          <button 
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            onClick={() => window.location.href = '/ai-chat'}
          >
            Ask follow-up →
          </button>
          <div className="flex space-x-2">
            <button 
              onClick={() => setInsightType('trend')}
              className={`px-2 py-1 text-xs rounded ${insightType === 'trend' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}
            >
              Trends
            </button>
            <button 
              onClick={() => setInsightType('alert')}
              className={`px-2 py-1 text-xs rounded ${insightType === 'alert' ? 'bg-yellow-100 text-yellow-700' : 'text-gray-500'}`}
            >
              Alerts
            </button>
            <button 
              onClick={() => setInsightType('opportunity')}
              className={`px-2 py-1 text-xs rounded ${insightType === 'opportunity' ? 'bg-purple-100 text-purple-700' : 'text-gray-500'}`}
            >
              Opportunities
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};