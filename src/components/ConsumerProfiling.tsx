import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LabelList, Cell } from 'recharts';
import { Users, UserCircle, MapPin, Activity } from 'lucide-react';
import { Transaction } from '../utils/mockDataGenerator';
import { CHART_COLORS, CHART_CONFIG, formatters } from '../utils/chartConfig';

interface ConsumerProfilingProps {
  transactions: Transaction[];
  filters: {
    gender?: '' | 'male' | 'female';
    ageGroup?: string;
    brand?: string;
    category?: string;
  };
}


const ConsumerProfiling: React.FC<ConsumerProfilingProps> = ({ transactions, filters }) => {
  // Apply filters
  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(t => {
      if (filters.gender && t.customer_profile.gender !== filters.gender) return false;
      if (filters.ageGroup && t.customer_profile.age_bracket !== filters.ageGroup) return false;
      if (filters.category && !t.items.some(item => item.category === filters.category)) return false;
      if (filters.brand && !t.items.some(item => item.brand === filters.brand)) return false;
      return true;
    });
  }, [transactions, filters]);

  // Calculate gender distribution
  const genderData = React.useMemo(() => {
    const genderCount = new Map<string, number>();
    
    filteredTransactions.forEach(t => {
      if (t.customer_profile.gender !== 'unknown') {
        genderCount.set(t.customer_profile.gender, 
          (genderCount.get(t.customer_profile.gender) || 0) + 1
        );
      }
    });

    return Array.from(genderCount.entries()).map(([gender, count]) => ({
      name: gender.charAt(0).toUpperCase() + gender.slice(1),
      value: count,
      percentage: (count / filteredTransactions.filter(t => t.customer_profile.gender !== 'unknown').length) * 100
    }));
  }, [filteredTransactions]);

  // Calculate age distribution
  const ageData = React.useMemo(() => {
    const ageCount = new Map<string, number>();
    
    filteredTransactions.forEach(t => {
      if (t.customer_profile.age_bracket !== 'unknown') {
        ageCount.set(t.customer_profile.age_bracket, 
          (ageCount.get(t.customer_profile.age_bracket) || 0) + 1
        );
      }
    });

    const ageOrder = ['18-24', '25-34', '35-44', '45-54', '55+'];
    return ageOrder
      .filter(age => ageCount.has(age))
      .map(age => ({
        age,
        count: ageCount.get(age)!,
        percentage: (ageCount.get(age)! / filteredTransactions.filter(t => t.customer_profile.age_bracket !== 'unknown').length) * 100
      }));
  }, [filteredTransactions]);

  // Calculate geographic distribution
  const geographicData = React.useMemo(() => {
    const regionCount = new Map<string, number>();
    
    filteredTransactions.forEach(t => {
      regionCount.set(t.region, (regionCount.get(t.region) || 0) + 1);
    });

    return Array.from(regionCount.entries())
      .map(([region, count]) => ({
        region,
        count,
        percentage: (count / filteredTransactions.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredTransactions]);

  // Calculate category preferences by demographic
  const categoryPreferences = React.useMemo(() => {
    const preferenceMap = new Map<string, Map<string, number>>();
    
    // Initialize demographic groups
    const demographics = ['Male', 'Female', '18-24', '25-34', '35-44', '45-54', '55+'];
    demographics.forEach(demo => preferenceMap.set(demo, new Map()));

    filteredTransactions.forEach(t => {
      const gender = t.customer_profile.gender !== 'unknown' 
        ? t.customer_profile.gender.charAt(0).toUpperCase() + t.customer_profile.gender.slice(1)
        : null;
      const age = t.customer_profile.age_bracket !== 'unknown' ? t.customer_profile.age_bracket : null;

      t.items.forEach(item => {
        if (gender) {
          const genderMap = preferenceMap.get(gender)!;
          genderMap.set(item.category, (genderMap.get(item.category) || 0) + item.quantity * item.price);
        }
        if (age) {
          const ageMap = preferenceMap.get(age)!;
          ageMap.set(item.category, (ageMap.get(item.category) || 0) + item.quantity * item.price);
        }
      });
    });

    // Convert to radar chart format
    const categories = ['shampoo', 'cigarettes', 'snacks', 'beverages', 'essentials'];
    const radarData = categories.map(category => {
      const dataPoint: any = { category };
      
      preferenceMap.forEach((catMap, demo) => {
        const total = Array.from(catMap.values()).reduce((sum, val) => sum + val, 0);
        const categoryValue = catMap.get(category) || 0;
        dataPoint[demo] = total > 0 ? (categoryValue / total) * 100 : 0;
      });
      
      return dataPoint;
    });

    return radarData;
  }, [filteredTransactions]);

  // Calculate spending patterns by demographic
  const spendingPatterns = React.useMemo(() => {
    const spendingByDemo = new Map<string, { total: number; count: number; avg: number }>();
    
    filteredTransactions.forEach(t => {
      const key = `${t.customer_profile.gender}-${t.customer_profile.age_bracket}`;
      if (t.customer_profile.gender !== 'unknown' && t.customer_profile.age_bracket !== 'unknown') {
        const existing = spendingByDemo.get(key) || { total: 0, count: 0, avg: 0 };
        existing.total += t.transaction_value;
        existing.count += 1;
        existing.avg = existing.total / existing.count;
        spendingByDemo.set(key, existing);
      }
    });

    return Array.from(spendingByDemo.entries())
      .map(([demo, data]) => {
        const [gender, age] = demo.split('-');
        return {
          demographic: `${gender.charAt(0).toUpperCase() + gender.slice(1)} ${age}`,
          avgSpending: data.avg,
          totalSpending: data.total,
          transactionCount: data.count
        };
      })
      .sort((a, b) => b.avgSpending - a.avgSpending);
  }, [filteredTransactions]);

  // Calculate KPIs
  const kpis = React.useMemo(() => {
    const profiledCustomers = filteredTransactions.filter(t => 
      t.customer_profile.gender !== 'unknown' && t.customer_profile.age_bracket !== 'unknown'
    ).length;
    
    const avgTransactionByGender = new Map<string, number>();
    genderData.forEach(g => {
      const genderTransactions = filteredTransactions.filter(t => 
        t.customer_profile.gender === g.name.toLowerCase()
      );
      const avgValue = genderTransactions.reduce((sum, t) => sum + t.transaction_value, 0) / genderTransactions.length;
      avgTransactionByGender.set(g.name, avgValue);
    });

    const topSpendingDemo = spendingPatterns.length > 0 ? spendingPatterns[0] : null;
    const profileRate = (profiledCustomers / filteredTransactions.length) * 100;

    return {
      profiledCustomers,
      profileRate,
      avgTransactionByGender,
      topSpendingDemo
    };
  }, [filteredTransactions, genderData, spendingPatterns]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Profiled Customers</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.profiledCustomers.toLocaleString()}</p>
              <p className="text-sm text-gray-500">{kpis.profileRate.toFixed(1)}% coverage</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Top Segment</p>
              <p className="text-lg font-bold text-gray-900">
                {kpis.topSpendingDemo ? kpis.topSpendingDemo.demographic : 'N/A'}
              </p>
              <p className="text-sm text-gray-500">
                {kpis.topSpendingDemo ? `₱${kpis.topSpendingDemo.avgSpending.toFixed(2)} avg` : '-'}
              </p>
            </div>
            <UserCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Gender Split</p>
              <div className="flex items-center space-x-4 mt-1">
                {genderData.map(g => (
                  <div key={g.name} className="text-center">
                    <p className="text-lg font-bold text-gray-900">{g.percentage.toFixed(0)}%</p>
                    <p className="text-xs text-gray-500">{g.name}</p>
                  </div>
                ))}
              </div>
            </div>
            <Activity className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Top Region</p>
              <p className="text-lg font-bold text-gray-900">
                {geographicData.length > 0 ? geographicData[0].region : 'N/A'}
              </p>
              <p className="text-sm text-gray-500">
                {geographicData.length > 0 ? `${geographicData[0].percentage.toFixed(1)}% of customers` : '-'}
              </p>
            </div>
            <MapPin className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Gender Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={genderData}
              layout="horizontal"
              margin={CHART_CONFIG.margin}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis type="number" tickFormatter={formatters.number} />
              <YAxis type="category" dataKey="name" width={80} />
              <Tooltip 
                formatter={(value: number) => formatters.number(value)}
                contentStyle={CHART_CONFIG.tooltip.contentStyle}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                <LabelList 
                  dataKey="percentage" 
                  position="right" 
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                  style={{ fontSize: '14px', fontWeight: 600 }}
                />
                {genderData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.name === 'Male' ? CHART_COLORS.gender.male : 
                          entry.name === 'Female' ? CHART_COLORS.gender.female : 
                          CHART_COLORS.gender.unknown} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Age Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Age Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="age" />
              <YAxis />
              <Tooltip formatter={(value: number) => value.toLocaleString()} />
              <Bar dataKey="count" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Preferences Radar */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Preferences by Demographics</h3>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={categoryPreferences}>
            <PolarGrid />
            <PolarAngleAxis dataKey="category" />
            <PolarRadiusAxis angle={90} domain={[0, 40]} />
            <Radar name="Male" dataKey="Male" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
            <Radar name="Female" dataKey="Female" stroke="#EC4899" fill="#EC4899" fillOpacity={0.3} />
            <Legend />
            <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Geographic Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {geographicData.map((region) => (
            <div key={region.region} className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-gray-900">{region.region}</p>
              <p className="text-2xl font-bold text-blue-600">{region.count}</p>
              <p className="text-xs text-gray-500">{region.percentage.toFixed(1)}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Spending Patterns */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Spending Demographics</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demographic</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Transaction</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spending</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {spendingPatterns.slice(0, 5).map((pattern, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pattern.demographic}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">₱{pattern.avgSpending.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">₱{pattern.totalSpending.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{pattern.transactionCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Insight */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Insight</h3>
        <p className="text-gray-700">
          {kpis.topSpendingDemo && `${kpis.topSpendingDemo.demographic} represents your highest-value customer segment with ₱${kpis.topSpendingDemo.avgSpending.toFixed(2)} average transaction. `}
          {ageData.length > 0 && `The ${ageData[0].age} age group is most active (${ageData[0].percentage.toFixed(0)}%). `}
          {geographicData.length > 0 && `${geographicData[0].region} shows highest customer concentration. `}
          Consider targeted promotions for high-value segments and expansion opportunities in underserved demographics.
        </p>
      </div>
    </div>
  );
};

export default ConsumerProfiling;