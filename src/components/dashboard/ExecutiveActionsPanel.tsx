import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, TrendingDown, Package, Users, ChevronRight } from 'lucide-react';

interface ExecutiveAction {
  id: string;
  priority: 'critical' | 'high' | 'medium';
  category: 'stock' | 'sales' | 'competition' | 'operations';
  title: string;
  description: string;
  metric?: string;
  action: string;
  deadline?: string;
}

interface ExecutiveActionsPanelProps {
  actions: ExecutiveAction[];
  onActionClick?: (action: ExecutiveAction) => void;
}

const ExecutiveActionsPanel: React.FC<ExecutiveActionsPanelProps> = ({
  actions,
  onActionClick
}) => {
  const getIcon = (category: string) => {
    switch (category) {
      case 'stock': return Package;
      case 'sales': return TrendingDown;
      case 'competition': return Users;
      default: return AlertCircle;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      default: return 'border-yellow-500 bg-yellow-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Get top 3 most critical actions
  const topActions = actions
    .sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Executive Actions Required</h3>
        <span className="text-sm text-gray-500">{actions.length} total actions</span>
      </div>

      <div className="space-y-3">
        {topActions.map((action, index) => {
          const Icon = getIcon(action.category);
          
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`border-l-4 ${getPriorityColor(action.priority)} p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => onActionClick?.(action)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Icon className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900">{action.title}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityBadge(action.priority)}`}>
                        {action.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                    {action.metric && (
                      <p className="text-xs text-gray-500 mb-2">Impact: {action.metric}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-600">{action.action}</p>
                      {action.deadline && (
                        <span className="text-xs text-gray-500">Due: {action.deadline}</span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {actions.length > 3 && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View All {actions.length} Actions →
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default ExecutiveActionsPanel;