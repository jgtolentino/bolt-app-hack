import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Lightbulb, TrendingUp, AlertTriangle, Package, Send } from 'lucide-react';
import { AIInsightsPanel } from '../components/ai/AIInsightsPanel';
import { useDataStore } from '../stores/dataStore';
import { useFilterStore } from '../features/filters/filterStore';

const AIInsights: React.FC = () => {
  const [customPrompt, setCustomPrompt] = useState('');
  const { kpiMetrics, salesTrendData, geographicData, productPerformanceData } = useDataStore();
  const filters = useFilterStore(state => state);

  // Mock insights - in production, these would come from AI analysis
  const insights = [
    {
      type: 'opportunity',
      icon: TrendingUp,
      color: 'bg-green-100 text-green-800',
      title: 'Brand X lost 20% sales to Brand Y in Region III',
      description: 'Analysis shows consistent substitution pattern over last 30 days. Consider promotional strategy or stock adjustment.',
      impact: '+₱125,000 potential recovery'
    },
    {
      type: 'trend',
      icon: Lightbulb,
      color: 'bg-blue-100 text-blue-800',
      title: 'GCash peaks at 6–7PM in NCR',
      description: 'Digital payment adoption is highest during evening rush hours. Consider incentives for off-peak digital transactions.',
      impact: '23% of evening transactions'
    },
    {
      type: 'alert',
      icon: AlertTriangle,
      color: 'bg-yellow-100 text-yellow-800',
      title: 'Stock-out risk for COKE-1.5L in Region VII',
      description: 'Current sales velocity suggests stock depletion in 3 days. High substitution rate when out of stock.',
      impact: '₱45,000 at risk'
    },
    {
      type: 'recommendation',
      icon: Package,
      color: 'bg-purple-100 text-purple-800',
      title: 'Bundle opportunity: Chips + Soda combo',
      description: '68% of chip purchases include a beverage. Create targeted bundle for 15% uplift.',
      impact: '+₱89,000 monthly potential'
    }
  ];

  const nextBestActions = [
    {
      category: 'Discount Triggers',
      actions: [
        { title: '10% off Milo for morning shoppers', region: 'NCR', timing: '6-9 AM' },
        { title: 'Buy 2 Get 1 on slow-moving snacks', region: 'All', timing: 'Weekends' }
      ]
    },
    {
      category: 'Bundle Pairings',
      actions: [
        { title: 'Coke + Chips combo', discount: '₱5 off', target: 'Young adults' },
        { title: 'Coffee + Bread morning deal', discount: '₱8 off', target: 'Workers' }
      ]
    },
    {
      category: 'Regional Stocking',
      actions: [
        { title: 'Increase COKE-1.5L stock', region: 'Region VII', urgency: 'High' },
        { title: 'Add more GCash terminals', region: 'NCR stores', urgency: 'Medium' }
      ]
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-gray-900">AI Insights & Opportunities</h1>
        <p className="text-gray-600">Action-ready insights and predictions powered by AI</p>
      </motion.div>

      {/* Insight Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {insights.map((insight, index) => (
          <motion.div
            key={index}
            className="bg-white rounded-lg shadow-lg p-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium mb-4 ${insight.color}`}>
              <insight.icon className="w-4 h-4" />
              <span className="capitalize">{insight.type}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{insight.title}</h3>
            <p className="text-gray-600 mb-3">{insight.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-green-600">{insight.impact}</span>
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                View Details →
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Next Best Actions Panel */}
      <motion.div
        className="bg-white rounded-lg shadow-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Next Best Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {nextBestActions.map((category, index) => (
            <div key={index}>
              <h3 className="font-medium text-gray-700 mb-3">{category.category}</h3>
              <div className="space-y-3">
                {category.actions.map((action, actionIndex) => (
                  <div key={actionIndex} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900 text-sm">{action.title}</p>
                    <div className="mt-1 text-xs text-gray-600">
                      {action.region && <span>Region: {action.region}</span>}
                      {action.timing && <span className="ml-2">Time: {action.timing}</span>}
                      {action.discount && <span>Savings: {action.discount}</span>}
                      {action.target && <span className="ml-2">Target: {action.target}</span>}
                      {action.urgency && (
                        <span className={`ml-2 font-medium ${
                          action.urgency === 'High' ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          {action.urgency} Priority
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Dynamic Prompt Runner */}
      <motion.div
        className="bg-white rounded-lg shadow-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Analysis Console</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Analysis Prompt
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Ask AI to analyze specific patterns, opportunities, or generate insights..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Powered by Claude AI
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Bot className="w-4 h-4" />
              <span>Run Analysis</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* AI Insights Panel Component */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <AIInsightsPanel 
          context="comprehensive"
          data={{ kpiMetrics, salesTrendData, geographicData, productPerformanceData }}
          filters={filters}
          className="h-96"
        />
      </motion.div>
    </div>
  );
};

export default AIInsights;