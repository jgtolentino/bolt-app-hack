import React from 'react';
import { Brain, TrendingUp, AlertCircle, Lightbulb, Target, Package, Users, DollarSign } from 'lucide-react';
import { Transaction } from '../utils/mockDataGenerator';

interface AIRecommendationPanelProps {
  transactions: Transaction[];
  activeModule: 'trends' | 'products' | 'behavior' | 'profiling';
}

interface Recommendation {
  icon: React.ElementType;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'revenue' | 'efficiency' | 'customer' | 'inventory';
}

const AIRecommendationPanel: React.FC<AIRecommendationPanelProps> = ({ transactions, activeModule }) => {
  // Generate recommendations based on data analysis
  const recommendations = React.useMemo(() => {
    const recs: Recommendation[] = [];

    // Analyze transaction patterns
    const avgTransactionValue = transactions.reduce((sum, t) => sum + t.transaction_value, 0) / transactions.length;
    const substitutionRate = transactions.filter(t => t.items.some(i => i.was_substituted)).length / transactions.length;
    const brandedRequestRate = transactions.filter(t => t.audio_signals.request_type === 'branded').length / transactions.length;
    const highInfluenceRate = transactions.filter(t => t.audio_signals.storeowner_influence === 'high').length / transactions.length;

    // Module-specific recommendations
    switch (activeModule) {
      case 'trends':
        // Peak hour analysis
        const hourlyVolume = new Map<number, number>();
        transactions.forEach(t => {
          const hour = t.timestamp.getHours();
          hourlyVolume.set(hour, (hourlyVolume.get(hour) || 0) + 1);
        });
        const peakHours = Array.from(hourlyVolume.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
        
        recs.push({
          icon: TrendingUp,
          title: 'Optimize Peak Hours',
          description: `Focus staffing during ${peakHours.map(h => `${h[0]}:00`).join(', ')} when 60% of transactions occur. Consider express checkout or pre-order systems.`,
          impact: 'high',
          category: 'efficiency'
        });

        if (avgTransactionValue < 100) {
          recs.push({
            icon: DollarSign,
            title: 'Increase Basket Size',
            description: `Average transaction (₱${avgTransactionValue.toFixed(2)}) is below optimal. Implement bundle deals and strategic product placement near checkout.`,
            impact: 'high',
            category: 'revenue'
          });
        }
        break;

      case 'products':
        // Top performing categories
        const categoryRevenue = new Map<string, number>();
        transactions.forEach(t => {
          t.items.forEach(item => {
            categoryRevenue.set(item.category, 
              (categoryRevenue.get(item.category) || 0) + (item.quantity * item.price)
            );
          });
        });
        const topCategory = Array.from(categoryRevenue.entries()).sort((a, b) => b[1] - a[1])[0];

        recs.push({
          icon: Package,
          title: 'Expand Top Category',
          description: `${topCategory[0]} generates ${((topCategory[1] / Array.from(categoryRevenue.values()).reduce((a, b) => a + b, 0)) * 100).toFixed(0)}% of revenue. Add 2-3 premium SKUs in this category.`,
          impact: 'high',
          category: 'inventory'
        });

        if (substitutionRate > 0.15) {
          recs.push({
            icon: AlertCircle,
            title: 'Reduce Stock-outs',
            description: `${(substitutionRate * 100).toFixed(0)}% substitution rate indicates inventory gaps. Implement automated reordering for top 20 SKUs.`,
            impact: 'high',
            category: 'inventory'
          });
        }
        break;

      case 'behavior':
        if (brandedRequestRate < 0.4) {
          recs.push({
            icon: Target,
            title: 'Brand Education Campaign',
            description: `Only ${(brandedRequestRate * 100).toFixed(0)}% request specific brands. Partner with suppliers for in-store promotions and sampling.`,
            impact: 'medium',
            category: 'customer'
          });
        }

        if (highInfluenceRate > 0.3) {
          recs.push({
            icon: Users,
            title: 'Leverage Store Owner Trust',
            description: `High influence rate (${(highInfluenceRate * 100).toFixed(0)}%) shows customer trust. Train staff on premium product benefits to increase upselling.`,
            impact: 'high',
            category: 'revenue'
          });
        }
        break;

      case 'profiling':
        // Age group analysis
        const ageGroups = new Map<string, number>();
        transactions.forEach(t => {
          if (t.customer_profile.age_bracket !== 'unknown') {
            ageGroups.set(t.customer_profile.age_bracket, 
              (ageGroups.get(t.customer_profile.age_bracket) || 0) + 1
            );
          }
        });
        const dominantAge = Array.from(ageGroups.entries()).sort((a, b) => b[1] - a[1])[0];

        recs.push({
          icon: Users,
          title: 'Target Demographics',
          description: `${dominantAge[0]} age group represents ${((dominantAge[1] / transactions.length) * 100).toFixed(0)}% of customers. Curate product mix for this demographic.`,
          impact: 'medium',
          category: 'customer'
        });

        // Gender-based insights
        const femaleTransactions = transactions.filter(t => t.customer_profile.gender === 'female');
        const maleTransactions = transactions.filter(t => t.customer_profile.gender === 'male');
        
        if (femaleTransactions.length > maleTransactions.length * 1.5) {
          recs.push({
            icon: Lightbulb,
            title: 'Female-Focused Products',
            description: 'Female customers dominate (60%+). Expand beauty/personal care selection and create dedicated display area.',
            impact: 'medium',
            category: 'inventory'
          });
        }
        break;
    }

    // Universal recommendations based on overall patterns
    const weekendTransactions = transactions.filter(t => {
      const day = t.timestamp.getDay();
      return day === 0 || day === 6;
    });
    const weekendRevenue = weekendTransactions.reduce((sum, t) => sum + t.transaction_value, 0);
    const weekdayRevenue = transactions.filter(t => {
      const day = t.timestamp.getDay();
      return day !== 0 && day !== 6;
    }).reduce((sum, t) => sum + t.transaction_value, 0);

    if (weekendRevenue > weekdayRevenue * 0.4) {
      recs.push({
        icon: DollarSign,
        title: 'Weekend Promotions',
        description: 'Weekend sales are strong. Launch "Weekend Special" bundles targeting family purchases and bulk buying.',
        impact: 'medium',
        category: 'revenue'
      });
    }

    return recs.slice(0, 4); // Return top 4 recommendations
  }, [transactions, activeModule]);

  // Calculate potential impact metrics
  const impactMetrics = React.useMemo(() => {
    const avgTransaction = transactions.reduce((sum, t) => sum + t.transaction_value, 0) / transactions.length;
    const dailyTransactions = transactions.length / 30; // Assuming 30 days of data
    
    return {
      revenueOpportunity: dailyTransactions * avgTransaction * 0.15 * 30, // 15% improvement over 30 days
      efficiencyGain: dailyTransactions * 2 * 30, // 2 minutes saved per transaction
      customerSatisfaction: 85 // Target satisfaction score
    };
  }, [transactions]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'revenue': return DollarSign;
      case 'efficiency': return TrendingUp;
      case 'customer': return Users;
      case 'inventory': return Package;
      default: return Brain;
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="h-8 w-8" />
          <h2 className="text-2xl font-bold">AI Recommendations</h2>
        </div>
        <p className="text-purple-100">
          Personalized insights based on your store's transaction patterns and customer behavior
        </p>
      </div>

      {/* Impact Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Potential Impact</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Revenue Opportunity</span>
            <span className="text-lg font-bold text-green-600">
              +₱{impactMetrics.revenueOpportunity.toFixed(0)}/month
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Time Savings</span>
            <span className="text-lg font-bold text-blue-600">
              {impactMetrics.efficiencyGain.toFixed(0)} min/month
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Customer Satisfaction</span>
            <span className="text-lg font-bold text-purple-600">
              {impactMetrics.customerSatisfaction}% target
            </span>
          </div>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {recommendations.map((rec, index) => {
          const Icon = rec.icon;
          const CategoryIcon = getCategoryIcon(rec.category);
          
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">{rec.title}</h4>
                    <div className="flex items-center space-x-2">
                      <CategoryIcon className="h-4 w-4 text-gray-400" />
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${getImpactColor(rec.impact)}`}>
                        {rec.impact.toUpperCase()} IMPACT
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600">{rec.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="space-y-3">
          <button className="w-full text-left px-4 py-3 bg-white rounded-lg hover:bg-gray-50 transition flex items-center justify-between group">
            <span className="text-sm font-medium text-gray-700">Generate detailed report</span>
            <span className="text-gray-400 group-hover:text-gray-600">→</span>
          </button>
          <button className="w-full text-left px-4 py-3 bg-white rounded-lg hover:bg-gray-50 transition flex items-center justify-between group">
            <span className="text-sm font-medium text-gray-700">Schedule consultation</span>
            <span className="text-gray-400 group-hover:text-gray-600">→</span>
          </button>
          <button className="w-full text-left px-4 py-3 bg-white rounded-lg hover:bg-gray-50 transition flex items-center justify-between group">
            <span className="text-sm font-medium text-gray-700">Export insights</span>
            <span className="text-gray-400 group-hover:text-gray-600">→</span>
          </button>
        </div>
      </div>

      {/* Learning Progress */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">AI Learning Progress</h3>
          <span className="text-xs text-gray-500">Updated hourly</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full" style={{ width: '78%' }}></div>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          78% confidence based on {transactions.length.toLocaleString()} transactions analyzed
        </p>
      </div>
    </div>
  );
};

export default AIRecommendationPanel;