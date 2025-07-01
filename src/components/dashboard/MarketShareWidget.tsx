import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface MarketShareData {
  brand: string;
  currentShare: number;
  previousShare: number;
  trend: 'up' | 'down' | 'stable';
  isOwnBrand?: boolean;
}

interface MarketShareWidgetProps {
  data: MarketShareData[];
  title?: string;
  clientBrand?: string;
}

const MarketShareWidget: React.FC<MarketShareWidgetProps> = ({
  data,
  title = "Market Share Analysis",
  clientBrand = "JTI"
}) => {
  const ownBrandData = data.find(d => d.brand === clientBrand);
  const competitorGaining = data.find(d => 
    !d.isOwnBrand && d.currentShare - d.previousShare > 5
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      {/* Alert Banner if competitor gaining significant share */}
      {competitorGaining && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Competitor Alert</p>
            <p className="text-xs text-red-700">
              {competitorGaining.brand} gained {(competitorGaining.currentShare - competitorGaining.previousShare).toFixed(1)}% market share
            </p>
          </div>
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

      {/* Own Brand Highlight */}
      {ownBrandData && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">{clientBrand} Market Position</span>
            {ownBrandData.trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : ownBrandData.trend === 'down' ? (
              <TrendingDown className="w-4 h-4 text-red-600" />
            ) : null}
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-blue-900">
              {ownBrandData.currentShare.toFixed(1)}%
            </span>
            <span className={`text-sm ${
              ownBrandData.currentShare > ownBrandData.previousShare 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {ownBrandData.currentShare > ownBrandData.previousShare ? '+' : ''}
              {(ownBrandData.currentShare - ownBrandData.previousShare).toFixed(1)}%
            </span>
          </div>
          <div className="mt-2">
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${ownBrandData.currentShare}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Competitor Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Competitor Analysis</h4>
        {data.filter(d => !d.isOwnBrand).map((competitor) => (
          <div key={competitor.brand} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">{competitor.brand}</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-900">
                  {competitor.currentShare.toFixed(1)}%
                </span>
                <span className={`text-xs ${
                  competitor.currentShare > competitor.previousShare 
                    ? 'text-red-600' 
                    : 'text-green-600'
                }`}>
                  {competitor.currentShare > competitor.previousShare ? '+' : ''}
                  {(competitor.currentShare - competitor.previousShare).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  competitor.currentShare > competitor.previousShare
                    ? 'bg-red-500'
                    : 'bg-gray-400'
                }`}
                style={{ width: `${competitor.currentShare}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Market Position Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
        <span>Total Market Coverage: {data.reduce((sum, d) => sum + d.currentShare, 0).toFixed(0)}%</span>
        <span>Updated: {new Date().toLocaleTimeString()}</span>
      </div>
    </motion.div>
  );
};

export default MarketShareWidget;