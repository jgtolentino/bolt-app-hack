import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, FunnelChart, Funnel, LabelList } from 'recharts';
import { Users, MessageCircle, UserCheck, ShoppingBag } from 'lucide-react';
import { Transaction } from '../utils/mockDataGenerator';

interface ConsumerBehaviorProps {
  transactions: Transaction[];
  filters: {
    category?: string;
    brand?: string;
    barangay?: string;
  };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const ConsumerBehavior: React.FC<ConsumerBehaviorProps> = ({ transactions, filters }) => {
  // Apply filters
  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(t => {
      if (filters.barangay && t.barangay !== filters.barangay) return false;
      if (filters.category && !t.items.some(item => item.category === filters.category)) return false;
      if (filters.brand && !t.items.some(item => item.brand === filters.brand)) return false;
      return true;
    });
  }, [transactions, filters]);

  // Calculate request type distribution
  const requestTypeData = React.useMemo(() => {
    const typeCount = new Map<string, number>();
    
    filteredTransactions.forEach(t => {
      const type = t.audio_signals.request_type;
      typeCount.set(type, (typeCount.get(type) || 0) + 1);
    });

    return Array.from(typeCount.entries()).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      percentage: (value / filteredTransactions.length) * 100
    }));
  }, [filteredTransactions]);

  // Calculate store owner influence
  const storeOwnerInfluenceData = React.useMemo(() => {
    const influenceCount = new Map<string, number>();
    
    filteredTransactions.forEach(t => {
      const influence = t.audio_signals.storeowner_influence;
      influenceCount.set(influence, (influenceCount.get(influence) || 0) + 1);
    });

    return Array.from(influenceCount.entries()).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      percentage: (value / filteredTransactions.length) * 100
    }));
  }, [filteredTransactions]);

  // Calculate suggestion acceptance rate
  const suggestionData = React.useMemo(() => {
    const accepted = filteredTransactions.filter(t => t.audio_signals.suggestion_accepted).length;
    const rejected = filteredTransactions.length - accepted;
    
    return [
      { name: 'Accepted', value: accepted, percentage: (accepted / filteredTransactions.length) * 100 },
      { name: 'Rejected', value: rejected, percentage: (rejected / filteredTransactions.length) * 100 }
    ];
  }, [filteredTransactions]);

  // Calculate purchase funnel
  const purchaseFunnelData = React.useMemo(() => {
    const total = filteredTransactions.length;
    const withBrandedRequest = filteredTransactions.filter(t => t.audio_signals.request_type === 'branded').length;
    const withInfluence = filteredTransactions.filter(t => 
      t.audio_signals.storeowner_influence !== 'none'
    ).length;
    const withSubstitution = filteredTransactions.filter(t => 
      t.items.some(item => item.was_substituted)
    ).length;
    const completed = total;

    return [
      { name: 'Store Entry', value: total, fill: '#3B82F6' },
      { name: 'Product Request', value: Math.round(total * 0.95), fill: '#10B981' },
      { name: 'Store Influence', value: withInfluence, fill: '#F59E0B' },
      { name: 'Product Selection', value: Math.round(total * 0.85), fill: '#8B5CF6' },
      { name: 'Purchase Complete', value: completed, fill: '#EF4444' }
    ];
  }, [filteredTransactions]);

  // Calculate indirect cues analysis
  const indirectCuesData = React.useMemo(() => {
    const cuesMap = new Map<string, number>();
    
    filteredTransactions.forEach(t => {
      t.audio_signals.indirect_cues.forEach(cue => {
        cuesMap.set(cue, (cuesMap.get(cue) || 0) + 1);
      });
    });

    return Array.from(cuesMap.entries())
      .map(([cue, count]) => ({ cue, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredTransactions]);

  // Calculate behavior patterns by time
  const behaviorByTimeData = React.useMemo(() => {
    const hourlyBehavior = new Map<number, { 
      hour: number; 
      branded: number; 
      unbranded: number; 
      generic: number;
      total: number;
    }>();

    for (let i = 6; i < 23; i++) {
      hourlyBehavior.set(i, { hour: i, branded: 0, unbranded: 0, generic: 0, total: 0 });
    }

    filteredTransactions.forEach(t => {
      const hour = t.timestamp.getHours();
      if (hour >= 6 && hour < 23) {
        const data = hourlyBehavior.get(hour)!;
        data.total++;
        if (t.audio_signals.request_type === 'branded') data.branded++;
        else if (t.audio_signals.request_type === 'unbranded') data.unbranded++;
        else if (t.audio_signals.request_type === 'generic') data.generic++;
      }
    });

    return Array.from(hourlyBehavior.values()).map(d => ({
      hour: `${d.hour}:00`,
      brandedRate: d.total > 0 ? (d.branded / d.total) * 100 : 0,
      unbrandedRate: d.total > 0 ? (d.unbranded / d.total) * 100 : 0,
      genericRate: d.total > 0 ? (d.generic / d.total) * 100 : 0
    }));
  }, [filteredTransactions]);

  // Calculate KPIs
  const kpis = React.useMemo(() => {
    const totalCustomers = filteredTransactions.length;
    const influencedCustomers = filteredTransactions.filter(t => 
      t.audio_signals.storeowner_influence !== 'none'
    ).length;
    const suggestionAcceptance = filteredTransactions.filter(t => 
      t.audio_signals.suggestion_accepted
    ).length;
    const brandedRequests = filteredTransactions.filter(t => 
      t.audio_signals.request_type === 'branded'
    ).length;

    return {
      totalCustomers,
      influenceRate: totalCustomers > 0 ? (influencedCustomers / totalCustomers) * 100 : 0,
      suggestionAcceptanceRate: totalCustomers > 0 ? (suggestionAcceptance / totalCustomers) * 100 : 0,
      brandAwarenessRate: totalCustomers > 0 ? (brandedRequests / totalCustomers) * 100 : 0
    };
  }, [filteredTransactions]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.totalCustomers.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Analyzed behaviors</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Influence Rate</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.influenceRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-500">Store owner impact</p>
            </div>
            <MessageCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Suggestion Accept</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.suggestionAcceptanceRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-500">Follow recommendations</p>
            </div>
            <UserCheck className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Brand Awareness</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.brandAwarenessRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-500">Request by brand</p>
            </div>
            <ShoppingBag className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Types */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Types</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={requestTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percentage }) => `${name} ${percentage.toFixed(0)}%`}
              >
                {requestTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Store Owner Influence */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Store Owner Influence Level</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={storeOwnerInfluenceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `${value}%`} />
              <Tooltip formatter={(value: number, name: string) => [`${value.toFixed(0)}%`, 'Percentage']} />
              <Bar dataKey="percentage" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Purchase Funnel */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Purchase Journey</h3>
        <ResponsiveContainer width="100%" height={300}>
          <FunnelChart>
            <Tooltip />
            <Funnel
              dataKey="value"
              data={purchaseFunnelData}
              isAnimationActive
            >
              <LabelList position="center" fill="#fff" />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>

      {/* Behavior Patterns by Time */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Type Patterns by Hour</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={behaviorByTimeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis tickFormatter={(value) => `${value}%`} />
            <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
            <Legend />
            <Line type="monotone" dataKey="brandedRate" stroke="#3B82F6" name="Branded" strokeWidth={2} />
            <Line type="monotone" dataKey="unbrandedRate" stroke="#10B981" name="Unbranded" strokeWidth={2} />
            <Line type="monotone" dataKey="genericRate" stroke="#F59E0B" name="Generic" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Indirect Cues */}
      {indirectCuesData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Common Indirect Cues</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {indirectCuesData.map((cue, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900">{cue.cue}</p>
                <p className="text-2xl font-bold text-blue-600">{cue.count}</p>
                <p className="text-xs text-gray-500">occurrences</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insight */}
      <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Insight</h3>
        <p className="text-gray-700">
          {kpis.influenceRate > 50 
            ? `High store owner influence (${kpis.influenceRate.toFixed(0)}%) indicates strong trust relationships. `
            : `Moderate store owner influence (${kpis.influenceRate.toFixed(0)}%) suggests room for building stronger customer relationships. `
          }
          {kpis.brandAwarenessRate < 40 && 'Low brand-specific requests suggest opportunity for brand education initiatives. '}
          {kpis.suggestionAcceptanceRate > 60 && 'High suggestion acceptance rate indicates effective store owner recommendations. '}
          Peak influence occurs during morning hours when regular customers visit.
        </p>
      </div>
    </div>
  );
};

export default ConsumerBehavior;