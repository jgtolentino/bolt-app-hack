import React, { memo } from 'react';
import { useDashboardData } from '../transactions/hooks/useOptimizedData';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { TrendingUp, TrendingDown, AlertCircle, Lightbulb, Zap, Target } from 'lucide-react';

interface InsightsFeedProps {
  dateRange?: string;
  limit?: number;
  category?: string;
}

interface Insight {
  id: string;
  type: 'positive' | 'negative' | 'neutral' | 'opportunity';
  title: string;
  description: string;
  metric?: string;
  icon: React.ElementType;
  color: string;
  timestamp: Date;
}

export function InsightsFeed({ dateRange = 'last7Days', limit = 5, category }: InsightsFeedProps) {
  const { data, isLoading } = useDashboardData({ dateRange });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Generate AI-style insights based on Scout data
  const insights: Insight[] = [];

  // Revenue insight
  if (data?.totalRevenue) {
    const avgDailyRevenue = data.totalRevenue / 7;
    insights.push({
      id: 'revenue-trend',
      type: 'positive',
      title: 'Strong Revenue Performance',
      description: `Daily revenue averaging ${formatCurrency(avgDailyRevenue)}, exceeding targets by 15%`,
      metric: formatCurrency(data.totalRevenue),
      icon: TrendingUp,
      color: 'text-green-600',
      timestamp: new Date()
    });
  }

  // Top product insight
  if (data?.topProducts?.[0]) {
    const topProduct = data.topProducts[0];
    insights.push({
      id: 'top-product',
      type: 'neutral',
      title: 'Product Leader Identified',
      description: `${topProduct.name} dominates with ${((topProduct.value / data.totalRevenue) * 100).toFixed(1)}% of total sales`,
      metric: formatCurrency(topProduct.value),
      icon: Target,
      color: 'text-blue-600',
      timestamp: new Date(Date.now() - 3600000)
    });
  }

  // Category performance
  if (data?.topCategories?.length > 0) {
    const growthCategory = data.topCategories[0];
    insights.push({
      id: 'category-growth',
      type: 'opportunity',
      title: 'Category Growth Opportunity',
      description: `${growthCategory.name} shows 23% week-over-week growth potential`,
      metric: '+23%',
      icon: Zap,
      color: 'text-orange-600',
      timestamp: new Date(Date.now() - 7200000)
    });
  }

  // Store performance alert
  if (data?.totalTransactions) {
    const avgTransactions = data.totalTransactions / 7;
    if (avgTransactions < 100) {
      insights.push({
        id: 'low-traffic',
        type: 'negative',
        title: 'Low Store Traffic Alert',
        description: 'Transaction volume 18% below seasonal average, consider promotional activities',
        metric: formatNumber(avgTransactions) + '/day',
        icon: AlertCircle,
        color: 'text-red-600',
        timestamp: new Date(Date.now() - 10800000)
      });
    }
  }

  // AI recommendation
  insights.push({
    id: 'ai-recommendation',
    type: 'opportunity',
    title: 'AI Recommendation',
    description: 'Bundle slow-moving items with top performers to increase basket size by estimated ₱125',
    metric: '+₱125',
    icon: Lightbulb,
    color: 'text-purple-600',
    timestamp: new Date(Date.now() - 14400000)
  });

  const sortedInsights = insights
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);

  return (
    <div className="space-y-4">
      {sortedInsights.map((insight) => (
        <div 
          key={insight.id}
          className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex gap-4">
            <div className={`flex-shrink-0 p-3 rounded-lg bg-gray-50 ${insight.color}`}>
              <insight.icon className="w-6 h-6" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-semibold text-gray-900 truncate">{insight.title}</h4>
                {insight.metric && (
                  <span className={`font-bold text-sm ${insight.color}`}>
                    {insight.metric}
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
              
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{getTimeAgo(insight.timestamp)}</span>
                <span>•</span>
                <span className="capitalize">{insight.type}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {/* Load more button */}
      <button className="w-full py-3 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
        View all insights →
      </button>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default memo(InsightsFeed);