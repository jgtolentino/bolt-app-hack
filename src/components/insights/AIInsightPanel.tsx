import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';
import { insightTemplates } from '../../lib/insightTemplates';

interface AIInsightPanelProps {
  templateId: string;
  filters: Record<string, any>;
  dataSummary: Record<string, any>;
  onInsightClick?: (insight: string) => void;
}

const AIInsightPanel: React.FC<AIInsightPanelProps> = ({ 
  templateId, 
  filters, 
  dataSummary,
  onInsightClick
}) => {
  const [insight, setInsight] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [confidence, setConfidence] = useState<number>(0);

  const template = insightTemplates.find(t => t.id === templateId);

  useEffect(() => {
    generateInsight();
  }, [templateId, filters, dataSummary]);

  const generateInsight = async () => {
    setIsLoading(true);
    
    // Simulate AI processing with template
    setTimeout(() => {
      const generatedInsight = processTemplate(template, filters, dataSummary);
      setInsight(generatedInsight);
      setConfidence(Math.floor(Math.random() * 20) + 80); // 80-100% confidence
      setIsLoading(false);
    }, 800);
  };

  const processTemplate = (template: any, filters: any, data: any): string => {
    if (!template) return 'No insight template selected';

    // Template-specific processing
    switch (template.id) {
      case 'priceSensitivity':
        const avgPrice = data.avgPrice || 50;
        const elasticity = -1.2 + (Math.random() * 0.4); // Mock elasticity
        return `Price elasticity of ${elasticity.toFixed(2)} detected. A 10% price increase could reduce demand by ${Math.abs(elasticity * 10).toFixed(0)}%. Current avg price: ₱${avgPrice}`;
        
      case 'substitutionMap':
        const topSub = data.topSubstitution || { from: 'Coke', to: 'Pepsi', rate: 15 };
        return `${topSub.from} → ${topSub.to} substitution occurs ${topSub.rate}% of the time when out of stock. ${filters.region ? `Higher in ${filters.region}` : 'Consistent across regions'}.`;
        
      case 'genderPreference':
        return `Female customers show 23% higher preference for personal care items. Male customers dominate beverage purchases (68% share).`;
        
      case 'peakHourAnalysis':
        return `Transaction volume peaks at 6-7 PM (32% of daily sales). ${filters.region ? `${filters.region} shows earlier peak at 5 PM` : 'Pattern consistent nationwide'}.`;
        
      case 'basketComposition':
        return `Average basket contains 3.2 items. Beverages appear in 78% of baskets. Cross-sell opportunity: chips with drinks (45% attachment rate).`;
        
      default:
        return `Analyzing ${template.name} patterns...`;
    }
  };

  return (
    <motion.div
      className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4 shadow-sm"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-gray-800">
            {template?.name || 'AI Insight'}
          </h3>
        </div>
        <button
          onClick={generateInsight}
          disabled={isLoading}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Insight Content */}
      <div className="relative">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-4/5"></div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <p 
              className="text-sm text-gray-700 leading-relaxed cursor-pointer hover:text-gray-900"
              onClick={() => onInsightClick?.(insight)}
            >
              {insight}
            </p>
          </motion.div>
        )}
      </div>

      {/* Confidence Indicator */}
      {!isLoading && (
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Confidence:</span>
            <div className="flex items-center space-x-1">
              <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                />
              </div>
              <span className="text-xs font-medium text-gray-700">{confidence}%</span>
            </div>
          </div>
          <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
            Explore →
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default AIInsightPanel;