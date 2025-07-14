/**
 * Scout Dash 2.0 - Smart Insight Card
 * AI-powered insight widget with trend analysis and recommendations
 * Inspired by retail-insights-dashboard-ph
 */

import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Info,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/UI/Card';
import { Badge } from '../../components/UI/Badge';

export interface SmartInsightCardProps {
  title: string;
  data: any[];
  metric: string;
  timeField?: string;
  compareField?: string;
  threshold?: {
    warning: number;
    critical: number;
  };
  className?: string;
  onInsightClick?: (insight: InsightData) => void;
}

interface InsightData {
  type: 'trend' | 'anomaly' | 'threshold' | 'recommendation';
  severity: 'info' | 'warning' | 'critical' | 'success';
  title: string;
  description: string;
  value?: number;
  change?: number;
  confidence: number;
  action?: string;
}

interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable';
  changePercent: number;
  confidence: number;
  significance: 'high' | 'medium' | 'low';
}

export const SmartInsightCard: React.FC<SmartInsightCardProps> = ({
  title,
  data,
  metric,
  timeField = 'date',
  compareField,
  threshold,
  className = '',
  onInsightClick
}) => {
  const insights = useMemo((): InsightData[] => {
    if (!data || data.length === 0) return [];

    const insights: InsightData[] = [];

    // Trend Analysis
    const trendAnalysis = analyzeTrend(data, metric, timeField);
    if (trendAnalysis.significance !== 'low') {
      insights.push({
        type: 'trend',
        severity: trendAnalysis.direction === 'up' ? 'success' : 
                 trendAnalysis.direction === 'down' ? 'warning' : 'info',
        title: `${trendAnalysis.direction === 'up' ? 'Positive' : 
                 trendAnalysis.direction === 'down' ? 'Negative' : 'Stable'} Trend Detected`,
        description: `${metric} is trending ${trendAnalysis.direction} by ${Math.abs(trendAnalysis.changePercent).toFixed(1)}% over the period`,
        change: trendAnalysis.changePercent,
        confidence: trendAnalysis.confidence,
        action: trendAnalysis.direction === 'down' ? 'Investigate causes' : 'Capitalize on growth'
      });
    }

    // Anomaly Detection
    const anomalies = detectAnomalies(data, metric);
    if (anomalies.length > 0) {
      insights.push({
        type: 'anomaly',
        severity: 'warning',
        title: `${anomalies.length} Anomal${anomalies.length === 1 ? 'y' : 'ies'} Detected`,
        description: `Unusual patterns found in ${metric} data`,
        confidence: 85,
        action: 'Review data quality and investigate outliers'
      });
    }

    // Threshold Analysis
    if (threshold) {
      const currentValue = data[data.length - 1]?.[metric] || 0;
      if (currentValue >= threshold.critical) {
        insights.push({
          type: 'threshold',
          severity: 'critical',
          title: 'Critical Threshold Exceeded',
          description: `${metric} (${currentValue.toLocaleString()}) exceeds critical threshold (${threshold.critical.toLocaleString()})`,
          value: currentValue,
          confidence: 100,
          action: 'Immediate action required'
        });
      } else if (currentValue >= threshold.warning) {
        insights.push({
          type: 'threshold',
          severity: 'warning',
          title: 'Warning Threshold Reached',
          description: `${metric} (${currentValue.toLocaleString()}) is approaching critical levels`,
          value: currentValue,
          confidence: 95,
          action: 'Monitor closely and prepare response'
        });
      }
    }

    // Comparison Analysis
    if (compareField) {
      const comparisonInsights = analyzeComparison(data, metric, compareField);
      insights.push(...comparisonInsights);
    }

    // Recommendations
    const recommendations = generateRecommendations(data, metric, trendAnalysis);
    insights.push(...recommendations);

    return insights.slice(0, 3); // Limit to top 3 insights
  }, [data, metric, timeField, compareField, threshold]);

  const getInsightIcon = (type: string, severity: string) => {
    switch (type) {
      case 'trend':
        return severity === 'success' ? <TrendingUp className="w-4 h-4" /> :
               severity === 'warning' ? <TrendingDown className="w-4 h-4" /> :
               <Minus className="w-4 h-4" />;
      case 'anomaly':
        return <AlertTriangle className="w-4 h-4" />;
      case 'threshold':
        return severity === 'critical' ? <AlertTriangle className="w-4 h-4" /> :
               <Info className="w-4 h-4" />;
      case 'recommendation':
        return <Lightbulb className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getSeverityColors = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950';
      case 'success':
        return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950';
      default:
        return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950';
    }
  };

  if (insights.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Lightbulb className="w-5 h-5 mr-2 text-blue-500" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-sm">No insights available</div>
            <div className="text-xs mt-1">Analyzing data patterns...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center">
            <Lightbulb className="w-5 h-5 mr-2 text-blue-500" />
            {title}
          </div>
          <Badge variant="secondary" className="text-xs">
            {insights.length} insight{insights.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer transition-all hover:shadow-md ${getSeverityColors(insight.severity)}`}
              onClick={() => onInsightClick?.(insight)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="mt-0.5">
                    {getInsightIcon(insight.type, insight.severity)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">
                      {insight.title}
                    </h4>
                    <p className="text-xs opacity-80 mb-2">
                      {insight.description}
                    </p>
                    {insight.action && (
                      <div className="text-xs font-medium flex items-center">
                        <span className="mr-1">Action:</span>
                        <span>{insight.action}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end ml-3">
                  {insight.change !== undefined && (
                    <div className="flex items-center text-xs font-medium mb-1">
                      {insight.change > 0 ? (
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 mr-1" />
                      )}
                      {Math.abs(insight.change).toFixed(1)}%
                    </div>
                  )}
                  <div className="text-xs opacity-60">
                    {insight.confidence}% confidence
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Helper functions for analysis
function analyzeTrend(data: any[], metric: string, timeField: string): TrendAnalysis {
  if (data.length < 2) {
    return { direction: 'stable', changePercent: 0, confidence: 0, significance: 'low' };
  }

  // Sort data by time
  const sortedData = [...data].sort((a, b) => 
    new Date(a[timeField]).getTime() - new Date(b[timeField]).getTime()
  );

  // Calculate trend using linear regression
  const values = sortedData.map(d => d[metric] || 0);
  const n = values.length;
  const xSum = (n * (n - 1)) / 2;
  const ySum = values.reduce((sum, val) => sum + val, 0);
  const xySum = values.reduce((sum, val, index) => sum + val * index, 0);
  const xSquaredSum = (n * (n - 1) * (2 * n - 1)) / 6;

  const slope = (n * xySum - xSum * ySum) / (n * xSquaredSum - xSum * xSum);
  const changePercent = n > 1 ? ((values[n - 1] - values[0]) / Math.abs(values[0] || 1)) * 100 : 0;

  const direction = Math.abs(changePercent) < 5 ? 'stable' : 
                   changePercent > 0 ? 'up' : 'down';

  const significance = Math.abs(changePercent) > 20 ? 'high' :
                      Math.abs(changePercent) > 10 ? 'medium' : 'low';

  const confidence = Math.min(95, Math.max(50, 70 + Math.abs(changePercent) * 2));

  return { direction, changePercent, confidence, significance };
}

function detectAnomalies(data: any[], metric: string): any[] {
  if (data.length < 5) return [];

  const values = data.map(d => d[metric] || 0);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const stdDev = Math.sqrt(
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  );

  const threshold = 2 * stdDev;
  
  return data.filter(d => {
    const value = d[metric] || 0;
    return Math.abs(value - mean) > threshold;
  });
}

function analyzeComparison(data: any[], metric: string, compareField: string): InsightData[] {
  const insights: InsightData[] = [];
  
  // Group by comparison field and calculate averages
  const groups = data.reduce((acc, item) => {
    const key = item[compareField];
    if (!acc[key]) acc[key] = [];
    acc[key].push(item[metric] || 0);
    return acc;
  }, {} as Record<string, number[]>);

  const groupAverages = Object.entries(groups).map(([key, values]) => ({
    name: key,
    average: values.reduce((sum, val) => sum + val, 0) / values.length,
    count: values.length
  })).sort((a, b) => b.average - a.average);

  if (groupAverages.length >= 2) {
    const best = groupAverages[0];
    const worst = groupAverages[groupAverages.length - 1];
    const improvement = ((best.average - worst.average) / worst.average) * 100;

    if (improvement > 20) {
      insights.push({
        type: 'recommendation',
        severity: 'info',
        title: 'Performance Gap Identified',
        description: `${best.name} outperforms ${worst.name} by ${improvement.toFixed(1)}%`,
        confidence: 80,
        action: `Analyze ${best.name} practices for replication`
      });
    }
  }

  return insights;
}

function generateRecommendations(data: any[], metric: string, trend: TrendAnalysis): InsightData[] {
  const recommendations: InsightData[] = [];

  if (trend.direction === 'down' && trend.significance === 'high') {
    recommendations.push({
      type: 'recommendation',
      severity: 'warning',
      title: 'Intervention Required',
      description: `Declining ${metric} trend requires immediate attention`,
      confidence: 85,
      action: 'Review recent changes and implement corrective measures'
    });
  } else if (trend.direction === 'up' && trend.significance === 'high') {
    recommendations.push({
      type: 'recommendation',
      severity: 'success',
      title: 'Scale Success Factors',
      description: `Strong positive trend in ${metric} presents growth opportunity`,
      confidence: 90,
      action: 'Identify and replicate success factors across other areas'
    });
  }

  return recommendations;
}

export default SmartInsightCard;