import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  Package, 
  Users, 
  DollarSign,
  RefreshCw,
  Eye,
  Star,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useAIInsights, INSIGHT_CATEGORIES } from '../../features/insights/useAIInsights';
import { useFilterStore } from '../../features/filters/filterStore';
import ExportButton from '../common/ExportButton';
import type { AIInsightTemplate } from '../../features/insights/useAIInsights';

const InsightTemplateRunner: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('sales');
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  
  const filters = useFilterStore(state => ({
    region: state.region,
    city: state.city_municipality,
    client: state.client,
    brand: state.brand,
    category: state.category
  }));

  const {
    templates,
    activeInsights,
    isLoading,
    generateInsight,
    starInsight,
    rateInsight,
    getTemplatesByCategory
  } = useAIInsights();

  const categoryTemplates = getTemplatesByCategory(selectedCategory);
  const starredInsights = activeInsights.filter(i => i.is_starred);

  const handleGenerateInsight = async (template: AIInsightTemplate) => {
    // Apply current global filters
    const appliedFilters = Object.entries(filters)
      .filter(([_, value]) => value)
      .map(([dimension, value]) => ({
        dimension,
        operator: 'eq' as const,
        value
      }));

    await generateInsight(template.id, appliedFilters);
  };

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'sales': return <TrendingUp className="w-5 h-5" />;
      case 'inventory': return <Package className="w-5 h-5" />;
      case 'customer': return <Users className="w-5 h-5" />;
      case 'pricing': return <DollarSign className="w-5 h-5" />;
      case 'substitution': return <RefreshCw className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-900">AI Insights</h2>
          <Sparkles className="w-5 h-5 text-yellow-500" />
        </div>
        {starredInsights.length > 0 && (
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>{starredInsights.length} starred</span>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {INSIGHT_CATEGORIES.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              selectedCategory === category.id
                ? 'bg-primary-100 text-primary-700 shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span>{category.icon}</span>
            <span className="text-sm font-medium">{category.label}</span>
            {categoryTemplates.length > 0 && category.id === selectedCategory && (
              <span className="bg-primary-200 text-primary-800 text-xs px-1.5 py-0.5 rounded-full">
                {categoryTemplates.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Template Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {categoryTemplates.map(template => (
          <motion.div
            key={template.id}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            whileHover={{ y: -2 }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{template.template_name}</h3>
                <p className="text-sm text-gray-600 mt-1">{template.business_question}</p>
              </div>
              {getCategoryIcon(template.category)}
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-500">{template.description}</p>
              
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center">
                  📊 {template.recommended_charts.join(', ')}
                </span>
                <span className="flex items-center">
                  📏 Min {template.min_data_points} points
                </span>
              </div>

              <button
                onClick={() => handleGenerateInsight(template)}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 transition-colors text-sm"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Generate Insight</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Active Insights */}
      {activeInsights.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Recent Insights</h3>
          
          <div className="space-y-3">
            {activeInsights.slice(0, 5).map(insight => {
              const template = templates.find(t => t.id === insight.template_id);
              
              return (
                <motion.div
                  key={insight.id}
                  className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-4 cursor-pointer"
                  onClick={() => setExpandedInsight(
                    expandedInsight === insight.id ? null : insight.id
                  )}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {template && getCategoryIcon(template.category)}
                        <span className="text-sm font-medium text-gray-700">
                          {template?.template_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(insight.generated_at).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-900">{insight.insight_text}</p>
                      
                      {insight.confidence_score && (
                        <div className="flex items-center space-x-4 mt-3 text-xs text-gray-600">
                          <span className="flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            {Math.round(insight.confidence_score * 100)}% confident
                          </span>
                          <span className="flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {Math.round(insight.relevance_score * 100)}% relevant
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          starInsight(insight.id);
                        }}
                        className={`p-1 rounded-lg transition-colors ${
                          insight.is_starred
                            ? 'text-yellow-500 hover:text-yellow-600'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${insight.is_starred ? 'fill-current' : ''}`} />
                      </button>
                      <ChevronRight 
                        className={`w-4 h-4 text-gray-400 transition-transform ${
                          expandedInsight === insight.id ? 'rotate-90' : ''
                        }`}
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedInsight === insight.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-4 pt-4 border-t border-gray-200"
                      >
                        {/* Supporting Data */}
                        {insight.supporting_data && (
                          <div className="mb-4">
                            <h4 className="text-xs font-medium text-gray-700 mb-2">Supporting Data</h4>
                            <div className="bg-white rounded-lg p-3 text-xs">
                              <pre className="whitespace-pre-wrap">
                                {JSON.stringify(insight.supporting_data.slice(0, 3), null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* Export and Feedback */}
                        <div className="flex items-center justify-between">
                          <ExportButton
                            data={insight.supporting_data || []}
                            title={`${template?.template_name || 'Insight'} - ${new Date(insight.generated_at).toLocaleDateString()}`}
                            subtitle={insight.insight_text}
                            metadata={{
                              template: template?.template_name,
                              confidence: insight.confidence_score,
                              relevance: insight.relevance_score,
                              generatedAt: insight.generated_at
                            }}
                            buttonText="Export"
                            className="scale-90"
                          />
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                rateInsight(insight.id, 5);
                              }}
                              className={`p-1 rounded transition-colors ${
                                insight.feedback_rating === 5
                                  ? 'text-green-600 bg-green-100'
                                  : 'text-gray-400 hover:text-green-600'
                              }`}
                            >
                              <ThumbsUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                rateInsight(insight.id, 1);
                              }}
                              className={`p-1 rounded transition-colors ${
                                insight.feedback_rating === 1
                                  ? 'text-red-600 bg-red-100'
                                  : 'text-gray-400 hover:text-red-600'
                              }`}
                            >
                              <ThumbsDown className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default InsightTemplateRunner;