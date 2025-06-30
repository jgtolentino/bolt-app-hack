import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useQueryBuilder } from '../queryBuilder/useQueryBuilder';
import type { QueryConfig } from '../../constants/registry';

export interface AIInsightTemplate {
  id: string;
  template_code: string;
  template_name: string;
  category: 'sales' | 'inventory' | 'customer' | 'pricing' | 'substitution' | 'forecast';
  description: string;
  business_question: string;
  default_config: QueryConfig & {
    timeRange?: string;
  };
  recommended_charts: string[];
  required_dimensions: string[];
  required_metrics: string[];
  system_prompt?: string;
  insight_template?: string;
  is_active: boolean;
  min_data_points: number;
}

export interface GeneratedInsight {
  id: string;
  template_id: string;
  insight_text: string;
  supporting_data?: any;
  confidence_score: number;
  relevance_score: number;
  filters_applied?: any;
  generated_at: string;
  expires_at?: string;
  is_starred: boolean;
  feedback_rating?: number;
  feedback_comment?: string;
}

interface UseAIInsightsResult {
  templates: AIInsightTemplate[];
  activeInsights: GeneratedInsight[];
  isLoading: boolean;
  error: Error | null;
  generateInsight: (templateId: string, filters?: any) => Promise<GeneratedInsight | null>;
  starInsight: (insightId: string) => Promise<void>;
  rateInsight: (insightId: string, rating: number, comment?: string) => Promise<void>;
  getTemplatesByCategory: (category: string) => AIInsightTemplate[];
}

export const useAIInsights = (): UseAIInsightsResult => {
  const [templates, setTemplates] = useState<AIInsightTemplate[]>([]);
  const [activeInsights, setActiveInsights] = useState<GeneratedInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { executeDynamicMetrics } = useQueryBuilder();

  // Fetch templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      const { data, error } = await supabase
        .from('ai_insight_templates')
        .select('*')
        .eq('is_active', true)
        .order('category, template_name');

      if (!error && data) {
        setTemplates(data);
      }
    };

    const fetchActiveInsights = async () => {
      const { data, error } = await supabase
        .from('generated_insights')
        .select('*')
        .gte('expires_at', new Date().toISOString())
        .order('generated_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setActiveInsights(data);
      }
    };

    fetchTemplates();
    fetchActiveInsights();
  }, []);

  // Generate insight from template
  const generateInsight = useCallback(async (
    templateId: string,
    filters?: any
  ): Promise<GeneratedInsight | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get template
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      // Execute query with template config
      const config = {
        ...template.default_config,
        filters: filters || template.default_config.filters || []
      };

      const data = await executeDynamicMetrics(
        config.metrics,
        config.dimensions,
        config.filters
      );

      // Generate insight text (in production, this would call GPT-4)
      const insightText = generateInsightText(template, data);

      // Save generated insight
      const { data: savedInsight, error: saveError } = await supabase
        .from('generated_insights')
        .insert({
          template_id: templateId,
          insight_text: insightText,
          supporting_data: data,
          confidence_score: calculateConfidenceScore(data),
          relevance_score: calculateRelevanceScore(template, data),
          filters_applied: filters,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // Update active insights
      setActiveInsights(prev => [savedInsight, ...prev]);

      return savedInsight;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [templates, executeDynamicMetrics]);

  // Star/unstar an insight
  const starInsight = useCallback(async (insightId: string) => {
    const insight = activeInsights.find(i => i.id === insightId);
    if (!insight) return;

    const { error } = await supabase
      .from('generated_insights')
      .update({ is_starred: !insight.is_starred })
      .eq('id', insightId);

    if (!error) {
      setActiveInsights(prev =>
        prev.map(i => i.id === insightId ? { ...i, is_starred: !i.is_starred } : i)
      );
    }
  }, [activeInsights]);

  // Rate an insight
  const rateInsight = useCallback(async (
    insightId: string,
    rating: number,
    comment?: string
  ) => {
    const { error } = await supabase
      .from('generated_insights')
      .update({ 
        feedback_rating: rating,
        feedback_comment: comment
      })
      .eq('id', insightId);

    if (!error) {
      setActiveInsights(prev =>
        prev.map(i => i.id === insightId ? { ...i, feedback_rating: rating, feedback_comment: comment } : i)
      );
    }
  }, []);

  // Get templates by category
  const getTemplatesByCategory = useCallback((category: string) => {
    return templates.filter(t => t.category === category);
  }, [templates]);

  return {
    templates,
    activeInsights,
    isLoading,
    error,
    generateInsight,
    starInsight,
    rateInsight,
    getTemplatesByCategory
  };
};

// Helper functions for insight generation
function generateInsightText(template: AIInsightTemplate, data: any[]): string {
  // In production, this would call GPT-4 with the template's system_prompt
  // For now, use template-based generation
  
  if (!data || data.length === 0) {
    return 'No data available for analysis.';
  }

  // Simple template-based generation
  const firstRow = data[0];
  let insight = template.insight_template || 'Analysis complete.';

  // Replace placeholders with actual values
  Object.keys(firstRow).forEach(key => {
    const value = firstRow[key];
    insight = insight.replace(
      new RegExp(`{{${key}}}`, 'g'),
      typeof value === 'number' ? value.toLocaleString() : value
    );
  });

  // Calculate some basic stats
  if (data.length > 1) {
    const values = data.map(d => d[template.default_config.metrics[0]]).filter(v => typeof v === 'number');
    const max = Math.max(...values);
    const min = Math.min(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    
    insight = insight
      .replace(/{{max}}/g, max.toLocaleString())
      .replace(/{{min}}/g, min.toLocaleString())
      .replace(/{{avg}}/g, avg.toLocaleString())
      .replace(/{{count}}/g, data.length.toString());
  }

  return insight;
}

function calculateConfidenceScore(data: any[]): number {
  // Simple confidence based on data points
  if (!data || data.length === 0) return 0;
  if (data.length < 10) return 0.5;
  if (data.length < 50) return 0.7;
  if (data.length < 100) return 0.8;
  return 0.9;
}

function calculateRelevanceScore(template: AIInsightTemplate, data: any[]): number {
  // Simple relevance based on data freshness and completeness
  if (!data || data.length === 0) return 0;
  
  // Check if all required dimensions are present
  const hasAllDimensions = template.required_dimensions.every(dim =>
    data[0] && data[0][dim] !== undefined
  );
  
  // Check if all required metrics are present
  const hasAllMetrics = template.required_metrics.every(metric =>
    data[0] && data[0][metric] !== undefined
  );
  
  let score = 0.5;
  if (hasAllDimensions) score += 0.25;
  if (hasAllMetrics) score += 0.25;
  
  return Math.min(score, 1);
}

// Preset template categories
export const INSIGHT_CATEGORIES = [
  { id: 'sales', label: 'Sales Analysis', icon: '📊' },
  { id: 'inventory', label: 'Inventory Insights', icon: '📦' },
  { id: 'customer', label: 'Customer Behavior', icon: '👥' },
  { id: 'pricing', label: 'Price Optimization', icon: '💰' },
  { id: 'substitution', label: 'Product Substitution', icon: '🔄' },
  { id: 'forecast', label: 'Predictive Analytics', icon: '🔮' }
];