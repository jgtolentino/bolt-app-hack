import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Brain, 
  Calendar,
  AlertCircle,
  RefreshCw,
  Download
} from 'lucide-react';
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { 
  usePredictiveMetrics, 
  PREDICTABLE_METRICS,
  PREDICTION_GRANULARITIES 
} from '../../features/predictions/usePredictiveMetrics';
import { useFilterStore } from '../../features/filters/filterStore';
import { formatters } from '../../utils/formatters';
import ExportButton from '../common/ExportButton';

interface PredictiveChartProps {
  metric?: string;
  showControls?: boolean;
  height?: number;
}

const PredictiveChart: React.FC<PredictiveChartProps> = ({
  metric: initialMetric = 'revenue',
  showControls = true,
  height = 400
}) => {
  const [selectedMetric, setSelectedMetric] = useState(initialMetric);
  const [granularity, setGranularity] = useState('daily');
  const [showConfidenceInterval, setShowConfidenceInterval] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const chartRef = useRef<HTMLDivElement>(null);

  const filters = useFilterStore(state => ({
    region: state.region,
    brand: state.brand,
    category: state.category,
    store_id: state.store_id
  }));

  const {
    predictions,
    isLoading,
    error,
    fetchPredictions,
    generatePredictions,
    getModelPerformance
  } = usePredictiveMetrics();

  // Fetch predictions when filters change
  useEffect(() => {
    const loadPredictions = async () => {
      const scope = Object.entries(filters)
        .filter(([_, value]) => value)
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

      await fetchPredictions(selectedMetric, scope);
    };

    loadPredictions();
  }, [selectedMetric, filters, fetchPredictions]);

  // Transform predictions to chart data
  useEffect(() => {
    if (predictions.length > 0) {
      const data = predictions.map(pred => ({
        date: new Date(pred.prediction_date).toLocaleDateString(),
        predicted: pred.predicted_value,
        lowerBound: pred.lower_bound,
        upperBound: pred.upper_bound,
        confidence: pred.confidence_level,
        isPrediction: true
      }));

      // TODO: Merge with historical data
      setChartData(data);
    }
  }, [predictions]);

  const handleGeneratePredictions = async () => {
    const scope = Object.entries(filters)
      .filter(([_, value]) => value)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    const days = PREDICTION_GRANULARITIES.find(g => g.id === granularity)?.days || 7;
    await generatePredictions(selectedMetric, scope, days);
  };

  const getMetricFormatter = (metricId: string) => {
    switch (metricId) {
      case 'revenue':
        return (value: number) => formatters.currency(value);
      case 'transaction_count':
      case 'unique_customers':
      case 'units_sold':
        return (value: number) => formatters.number(value);
      case 'basket_size':
        return (value: number) => formatters.decimal(value);
      default:
        return (value: number) => value.toString();
    }
  };

  const formatter = getMetricFormatter(selectedMetric);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <div>
          <div className="font-medium text-red-900">Prediction Error</div>
          <div className="text-sm text-red-700">{error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="bg-white rounded-xl shadow-sm p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Brain className="w-6 h-6 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Predictive Analytics</h3>
        </div>
        
        {showControls && (
          <div className="flex items-center space-x-2">
            {chartData.length > 0 && (
              <ExportButton
                data={chartData}
                title={`${PREDICTABLE_METRICS.find(m => m.id === selectedMetric)?.label} Predictions`}
                subtitle={`${granularity} forecast`}
                chartRef={chartRef}
                filters={filters}
                metadata={{
                  metric: selectedMetric,
                  granularity,
                  modelName: predictions[0]?.model_name || 'prophet',
                  confidence: predictions[0]?.confidence_level || 0.95,
                  dateGenerated: new Date().toISOString()
                }}
                buttonText="Export"
                className="mr-2"
              />
            )}
            <button
              onClick={handleGeneratePredictions}
              disabled={isLoading}
              className="flex items-center space-x-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Generate</span>
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      {showControls && (
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Metric Selector */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Metric</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            >
              {PREDICTABLE_METRICS.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Granularity Selector */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Granularity</label>
            <select
              value={granularity}
              onChange={(e) => setGranularity(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            >
              {PREDICTION_GRANULARITIES.map(g => (
                <option key={g.id} value={g.id}>{g.label}</option>
              ))}
            </select>
          </div>

          {/* Confidence Toggle */}
          <label className="flex items-center space-x-2 mt-5">
            <input
              type="checkbox"
              checked={showConfidenceInterval}
              onChange={(e) => setShowConfidenceInterval(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Show confidence interval</span>
          </label>
        </div>
      )}

      {/* Chart */}
      <div ref={chartRef} style={{ height }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <TrendingUp className="w-12 h-12 mb-3 text-gray-300" />
            <p className="text-sm">No predictions available</p>
            <button
              onClick={handleGeneratePredictions}
              className="mt-3 text-sm text-primary-600 hover:text-primary-700"
            >
              Generate predictions
            </button>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                style={{ fontSize: 12 }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: 12 }}
                tickFormatter={formatter}
              />
              <Tooltip 
                formatter={formatter}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />

              {/* Today marker */}
              <ReferenceLine 
                x={new Date().toLocaleDateString()} 
                stroke="#ef4444" 
                strokeDasharray="5 5"
                label="Today"
              />

              {/* Confidence interval */}
              {showConfidenceInterval && (
                <Area
                  dataKey="upperBound"
                  stackId="1"
                  stroke="none"
                  fill="#ddd6fe"
                  fillOpacity={0.3}
                  name="Upper bound"
                />
              )}

              {/* Prediction line */}
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#7c3aed"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#7c3aed', r: 4 }}
                name="Predicted"
              />

              {showConfidenceInterval && (
                <Area
                  dataKey="lowerBound"
                  stackId="1"
                  stroke="none"
                  fill="#ffffff"
                  fillOpacity={1}
                  name="Lower bound"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Model Performance */}
      {predictions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Model: {predictions[0]?.model_name}</span>
            <span className="text-gray-600">
              Confidence: {Math.round((predictions[0]?.confidence_level || 0) * 100)}%
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PredictiveChart;