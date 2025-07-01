import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle, Package } from 'lucide-react';

interface SKUHealth {
  sku: string;
  name: string;
  brand: string;
  healthScore: number; // 0-100
  status: 'healthy' | 'warning' | 'critical' | 'discontinued';
  metrics: {
    salesTrend: number; // percentage change
    stockDays: number;
    substitutionRate: number;
    marketShare: number;
    velocityScore: number; // units per day
  };
  recommendations: string[];
}

interface SKUHealthScoreProps {
  skus: SKUHealth[];
  onSKUClick?: (sku: SKUHealth) => void;
  showRecommendations?: boolean;
}

const SKUHealthScore: React.FC<SKUHealthScoreProps> = ({
  skus,
  onSKUClick,
  showRecommendations = true
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'critical': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Package className="w-5 h-5 text-gray-400" />;
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getHealthBar = (score: number) => {
    const color = score >= 80 ? 'bg-green-500' : 
                  score >= 60 ? 'bg-yellow-500' : 
                  score >= 40 ? 'bg-orange-500' : 'bg-red-500';
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
    );
  };

  // Group SKUs by status
  const groupedSKUs = {
    critical: skus.filter(s => s.status === 'critical'),
    warning: skus.filter(s => s.status === 'warning'),
    healthy: skus.filter(s => s.status === 'healthy'),
    discontinued: skus.filter(s => s.status === 'discontinued')
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">SKU Health Monitor</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">Critical ({groupedSKUs.critical.length})</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-600">Warning ({groupedSKUs.warning.length})</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Healthy ({groupedSKUs.healthy.length})</span>
          </div>
        </div>
      </div>

      {/* Critical SKUs Alert */}
      {groupedSKUs.critical.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-900">Immediate Action Required</h4>
              <p className="text-sm text-red-700 mt-1">
                {groupedSKUs.critical.length} SKUs require urgent attention
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SKU List */}
      <div className="space-y-4">
        {skus.slice(0, 10).map((sku, index) => (
          <motion.div
            key={sku.sku}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onSKUClick?.(sku)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start space-x-3">
                {getStatusIcon(sku.status)}
                <div>
                  <h4 className="font-medium text-gray-900">{sku.name}</h4>
                  <p className="text-sm text-gray-600">{sku.brand} • {sku.sku}</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(sku.healthScore)}`}>
                Score: {sku.healthScore}
              </div>
            </div>

            {/* Health Bar */}
            <div className="mb-3">
              {getHealthBar(sku.healthScore)}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-5 gap-2 mb-3 text-xs">
              <div className="text-center">
                <div className="text-gray-600">Sales Trend</div>
                <div className={`font-medium ${sku.metrics.salesTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {sku.metrics.salesTrend > 0 ? '+' : ''}{sku.metrics.salesTrend}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">Stock Days</div>
                <div className={`font-medium ${sku.metrics.stockDays < 3 ? 'text-red-600' : 'text-gray-900'}`}>
                  {sku.metrics.stockDays}d
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">Substitution</div>
                <div className={`font-medium ${sku.metrics.substitutionRate > 20 ? 'text-red-600' : 'text-gray-900'}`}>
                  {sku.metrics.substitutionRate}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">Market Share</div>
                <div className="font-medium text-gray-900">
                  {sku.metrics.marketShare}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">Velocity</div>
                <div className="font-medium text-gray-900">
                  {sku.metrics.velocityScore}/day
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {showRecommendations && sku.recommendations.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-start space-x-2">
                  <span className="text-xs font-medium text-gray-700">Actions:</span>
                  <div className="flex-1 text-xs text-gray-600">
                    {sku.recommendations[0]}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{skus.length}</div>
          <div className="text-xs text-gray-600">Total SKUs</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {Math.round(skus.filter(s => s.healthScore >= 80).length / skus.length * 100)}%
          </div>
          <div className="text-xs text-gray-600">Healthy</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {skus.filter(s => s.metrics.stockDays < 3).length}
          </div>
          <div className="text-xs text-gray-600">Low Stock</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {Math.round(skus.reduce((sum, s) => sum + s.healthScore, 0) / skus.length)}
          </div>
          <div className="text-xs text-gray-600">Avg Score</div>
        </div>
      </div>
    </motion.div>
  );
};

export default SKUHealthScore;