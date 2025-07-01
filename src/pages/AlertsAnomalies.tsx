import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingDown, TrendingUp, Clock, MapPin, Package, Users } from 'lucide-react';
import AIInsightPanel from '../components/insights/AIInsightPanel';
import { useFilterStore } from '../features/filters/filterStore';
import { useAdsBot } from '../hooks/useAdsBot';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  metric: string;
  value: number;
  threshold: number;
  region?: string;
  sku?: string;
  timestamp: Date;
  isResolved: boolean;
}

interface Anomaly {
  id: string;
  metric: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  expectedValue: number;
  actualValue: number;
  deviation: number;
  timestamp: Date;
  category: 'sales' | 'inventory' | 'customer' | 'operational';
}

const AlertsAnomalies: React.FC = () => {
  const filters = useFilterStore();
  const { generateInsight, createAlert } = useAdsBot();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [activeTab, setActiveTab] = useState<'alerts' | 'anomalies'>('alerts');

  useEffect(() => {
    // Load alerts and anomalies
    loadAlertsAndAnomalies();
  }, [filters]);

  const loadAlertsAndAnomalies = async () => {
    // Mock alerts data - in production, this would come from your anomaly detection system
    const mockAlerts: Alert[] = [
      {
        id: 'alert-1',
        type: 'critical',
        title: 'Stock Out Risk',
        message: 'Milo 300ml projected to stock out in 2 days at current velocity',
        metric: 'stock_days',
        value: 2,
        threshold: 5,
        region: 'NCR',
        sku: 'MILO-300ML',
        timestamp: new Date(),
        isResolved: false
      },
      {
        id: 'alert-2',
        type: 'warning',
        title: 'Sales Decline',
        message: 'JTI cigarettes sales down 15% vs last week in Mindanao',
        metric: 'sales_change',
        value: -15,
        threshold: -10,
        region: 'Mindanao',
        timestamp: new Date(),
        isResolved: false
      },
      {
        id: 'alert-3',
        type: 'info',
        title: 'Competitor Activity',
        message: 'Philip Morris gaining share in Metro Manila - investigate pricing',
        metric: 'competitor_share',
        value: 8.5,
        threshold: 8,
        region: 'Metro Manila',
        timestamp: new Date(),
        isResolved: false
      }
    ];

    const mockAnomalies: Anomaly[] = [
      {
        id: 'anomaly-1',
        metric: 'Daily Sales Revenue',
        description: 'Unusual spike in beverage sales during weekday',
        severity: 'high',
        expectedValue: 45000,
        actualValue: 68000,
        deviation: 51,
        timestamp: new Date(),
        category: 'sales'
      },
      {
        id: 'anomaly-2',
        metric: 'Customer Count',
        description: 'Lower than expected foot traffic in Region IV',
        severity: 'medium',
        expectedValue: 1200,
        actualValue: 850,
        deviation: -29,
        timestamp: new Date(),
        category: 'customer'
      },
      {
        id: 'anomaly-3',
        metric: 'Transaction Time',
        description: 'Transactions taking 40% longer than usual',
        severity: 'medium',
        expectedValue: 90,
        actualValue: 126,
        deviation: 40,
        timestamp: new Date(),
        category: 'operational'
      }
    ];

    setAlerts(mockAlerts);
    setAnomalies(mockAnomalies);
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning': return <TrendingDown className="w-5 h-5 text-yellow-600" />;
      case 'info': return <TrendingUp className="w-5 h-5 text-blue-600" />;
    }
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'critical': return 'border-l-red-500 bg-red-50';
      case 'warning': return 'border-l-yellow-500 bg-yellow-50';
      case 'info': return 'border-l-blue-500 bg-blue-50';
    }
  };

  const getSeverityIcon = (severity: Anomaly['severity']) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'medium': return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'low': return <TrendingUp className="w-5 h-5 text-green-600" />;
    }
  };

  const getCategoryIcon = (category: Anomaly['category']) => {
    switch (category) {
      case 'sales': return <TrendingUp className="w-4 h-4" />;
      case 'inventory': return <Package className="w-4 h-4" />;
      case 'customer': return <Users className="w-4 h-4" />;
      case 'operational': return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-gray-900">Alerts & Anomalies</h1>
        <p className="text-gray-600">Real-time system monitoring and anomaly detection</p>
      </motion.div>

      {/* AI Insight Panel */}
      <AIInsightPanel
        templateId="stockoutPrediction"
        context="alerts"
        filters={filters}
        dataSummary={{
          criticalSKU: 'MILO-300ML',
          daysRemaining: 2,
          affectedStores: 5
        }}
      />

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'alerts'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Alerts ({alerts.filter(a => !a.isResolved).length})</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('anomalies')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'anomalies'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            <TrendingDown className="w-4 h-4" />
            <span>Anomalies ({anomalies.length})</span>
          </div>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'alerts' ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {alerts.filter(a => !a.isResolved).map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`border-l-4 ${getAlertColor(alert.type)} p-4 rounded-lg shadow-sm`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                    <p className="text-gray-700 mt-1">{alert.message}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      {alert.region && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{alert.region}</span>
                        </div>
                      )}
                      {alert.sku && (
                        <div className="flex items-center space-x-1">
                          <Package className="w-3 h-3" />
                          <span>{alert.sku}</span>
                        </div>
                      )}
                      <span>{alert.timestamp.toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                    Investigate
                  </button>
                  <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {anomalies.map((anomaly, index) => (
            <motion.div
              key={anomaly.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getSeverityIcon(anomaly.severity)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{anomaly.metric}</h3>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        {getCategoryIcon(anomaly.category)}
                        <span className="capitalize">{anomaly.category}</span>
                      </div>
                    </div>
                    <p className="text-gray-700 mt-1">{anomaly.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm">
                      <div>
                        <span className="text-gray-500">Expected:</span>
                        <span className="ml-1 font-medium">{anomaly.expectedValue.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Actual:</span>
                        <span className="ml-1 font-medium">{anomaly.actualValue.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Deviation:</span>
                        <span className={`ml-1 font-medium ${
                          anomaly.deviation > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {anomaly.deviation > 0 ? '+' : ''}{anomaly.deviation}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                    Analyze
                  </button>
                  <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                    Mark Normal
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-900">Critical Issues</h3>
          </div>
          <p className="text-2xl font-bold text-red-800 mt-2">
            {alerts.filter(a => a.type === 'critical' && !a.isResolved).length}
          </p>
          <p className="text-sm text-red-600">Require immediate attention</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-900">Anomalies Detected</h3>
          </div>
          <p className="text-2xl font-bold text-yellow-800 mt-2">{anomalies.length}</p>
          <p className="text-sm text-yellow-600">Deviation from expected patterns</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">System Health</h3>
          </div>
          <p className="text-2xl font-bold text-blue-800 mt-2">Good</p>
          <p className="text-sm text-blue-600">All systems operational</p>
        </div>
      </div>
    </div>
  );
};

export default AlertsAnomalies;