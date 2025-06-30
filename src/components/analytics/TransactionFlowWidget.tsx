import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, RefreshCcw, Users, ShoppingCart, CreditCard, Package, TrendingUp, AlertCircle } from 'lucide-react';

interface FlowStep {
  id: string;
  label: string;
  value: number;
  percentage: number;
  icon: React.ElementType;
}

interface TransactionFlowWidgetProps {
  data?: any;
  onEnableAdvancedAnalytics?: () => void;
}

const TransactionFlowWidget: React.FC<TransactionFlowWidgetProps> = ({
  data,
  onEnableAdvancedAnalytics
}) => {
  const [isEnabled, setIsEnabled] = useState(false);

  // Sample flow data
  const flowSteps: FlowStep[] = [
    { id: 'entry', label: 'Store Entry', value: 1000, percentage: 100, icon: Users },
    { id: 'browse', label: 'Product Browse', value: 850, percentage: 85, icon: ShoppingCart },
    { id: 'basket', label: 'Add to Basket', value: 650, percentage: 65, icon: Package },
    { id: 'checkout', label: 'Checkout', value: 600, percentage: 60, icon: CreditCard },
    { id: 'complete', label: 'Complete', value: 580, percentage: 58, icon: TrendingUp }
  ];

  const handleEnableAnalytics = () => {
    setIsEnabled(true);
    if (onEnableAdvancedAnalytics) {
      onEnableAdvancedAnalytics();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 transaction-flow-widget">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <RefreshCcw className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-xl font-bold text-gray-900">Transaction Flow Analysis</h3>
            <p className="text-sm text-gray-600 mt-1">
              Customer journey from entry to purchase
            </p>
          </div>
        </div>
        {!isEnabled && (
          <button
            onClick={handleEnableAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            Enable Advanced Analytics
          </button>
        )}
      </div>

      {/* Flow Visualization */}
      <div className="relative">
        {isEnabled ? (
          <div className="space-y-4">
            {/* Flow Steps */}
            <div className="flex items-center justify-between space-x-2">
              {flowSteps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex-1"
                  >
                    <div
                      className="relative p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 cursor-pointer hover:shadow-lg transition-all clickable-segment"
                      onClick={() => console.log('Clicked:', step.label)}
                    >
                      {/* Icon */}
                      <div className="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-sm mb-3 mx-auto">
                        <step.icon className="w-6 h-6 text-blue-600" />
                      </div>
                      
                      {/* Content */}
                      <div className="text-center">
                        <p className="font-semibold text-gray-900">{step.value}</p>
                        <p className="text-xs text-gray-600 mt-1">{step.label}</p>
                        <p className="text-xs font-medium text-blue-600 mt-1">
                          {step.percentage}%
                        </p>
                      </div>

                      {/* Drop-off indicator */}
                      {index > 0 && (
                        <div className="absolute -top-2 -left-2 bg-red-100 text-red-600 text-xs font-medium px-2 py-1 rounded-full">
                          -{flowSteps[index - 1].value - step.value}
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Arrow */}
                  {index < flowSteps.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.05 }}
                    >
                      <ArrowRight className="w-6 h-6 text-gray-400" />
                    </motion.div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Insights */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Key Insights</h4>
              <div className="space-y-2 text-sm text-blue-800">
                <p>• 58% conversion rate from entry to purchase</p>
                <p>• Largest drop-off at product browse stage (15%)</p>
                <p>• Checkout abandonment rate: 3.3%</p>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                View Details
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                Optimize Flow
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4">
              <RefreshCcw className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Transaction Flow Patterns
            </h4>
            <p className="text-gray-600 mb-1">Customer Journey</p>
            <p className="text-2xl font-bold text-gray-900 mb-4">🔄</p>
            <p className="text-gray-700 max-w-md mx-auto mb-6">
              Advanced flow analysis showing customer transaction patterns,
              repeat purchase behavior, and journey optimization opportunities.
            </p>
            <button
              onClick={handleEnableAnalytics}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Enable Advanced Analytics
            </button>
          </div>
        )}
      </div>

      {/* Sari-sari Store Note */}
      {isEnabled && (
        <div className="mt-6 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Sari-sari Store Context:</p>
              <p className="mt-1">
                Transaction flow in sari-sari stores is typically simpler - customers often know what they want, 
                reducing browse time. Focus on quick service and product availability.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionFlowWidget;