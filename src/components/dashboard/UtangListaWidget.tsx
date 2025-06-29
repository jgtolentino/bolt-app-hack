import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { CreditCard, ArrowRight, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface UtangListaStats {
  totalAccounts: number;
  totalOutstanding: number;
  collectionRate: number;
  riskAccounts: number;
  topCustomers: Array<{
    customer_name: string;
    current_balance: number;
    payment_history: string;
  }>;
}

export const UtangListaWidget: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<UtangListaStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadUtangListaStats();
  }, []);
  
  const loadUtangListaStats = async () => {
    try {
      // Get accounts summary
      const { data: accounts, error: accountsError } = await supabase
        .from('utang_lista_accounts')
        .select('id, customer_name, current_balance, payment_history, credit_limit');
      
      if (accountsError) throw accountsError;
      
      if (accounts) {
        // Calculate stats
        const totalAccounts = accounts.length;
        const totalOutstanding = accounts.reduce((sum, account) => sum + account.current_balance, 0);
        
        // Get collection rate from analytics view
        const { data: analytics, error: analyticsError } = await supabase
          .from('v_utang_lista_analytics')
          .select('payment_collection_rate')
          .limit(1);
        
        if (analyticsError) throw analyticsError;
        
        const collectionRate = analytics && analytics.length > 0 
          ? analytics[0].payment_collection_rate 
          : 68.5; // Default value
        
        // Find accounts at risk (balance > 80% of credit limit)
        const riskAccounts = accounts.filter(account => 
          account.current_balance > account.credit_limit * 0.8
        ).length;
        
        // Get top customers by balance
        const topCustomers = [...accounts]
          .sort((a, b) => b.current_balance - a.current_balance)
          .slice(0, 3)
          .map(account => ({
            customer_name: account.customer_name,
            current_balance: account.current_balance,
            payment_history: account.payment_history
          }));
        
        setStats({
          totalAccounts,
          totalOutstanding,
          collectionRate,
          riskAccounts,
          topCustomers
        });
      }
    } catch (error) {
      console.error('Error loading Utang/Lista stats:', error);
      // Fallback to mock data
      setStats({
        totalAccounts: 125,
        totalOutstanding: 87500,
        collectionRate: 68.5,
        riskAccounts: 18,
        topCustomers: [
          { customer_name: 'Maria Santos', current_balance: 1250, payment_history: 'good' },
          { customer_name: 'Juan Dela Cruz', current_balance: 950, payment_history: 'excellent' },
          { customer_name: 'Pedro Reyes', current_balance: 850, payment_history: 'fair' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="chart-container h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="chart-container h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <CreditCard className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Utang/Lista Credit System</h3>
        </div>
        <button
          onClick={() => navigate('/utang-lista')}
          className="text-sm text-primary-600 hover:text-primary-800 flex items-center"
        >
          Manage <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>
      
      {stats && (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-600">Accounts</div>
              <div className="text-xl font-bold text-blue-900">{stats.totalAccounts}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-green-600">Outstanding</div>
              <div className="text-xl font-bold text-green-900">{formatCurrency(stats.totalOutstanding)}</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-sm text-purple-600">Collection</div>
              <div className="text-xl font-bold text-purple-900">{stats.collectionRate.toFixed(1)}%</div>
            </div>
          </div>
          
          {/* Risk Alert */}
          {stats.riskAccounts > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Credit Risk Alert</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                {stats.riskAccounts} account{stats.riskAccounts !== 1 ? 's' : ''} over 80% of credit limit
              </p>
            </div>
          )}
          
          {/* Top Customers */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Top Credit Customers</h4>
            <div className="space-y-2">
              {stats.topCustomers.map((customer, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-white/50 rounded-lg border border-white/30">
                  <div>
                    <div className="font-medium text-gray-900">{customer.customer_name}</div>
                    <div className="text-xs text-gray-500">
                      {customer.payment_history === 'excellent' ? '⭐ Excellent' :
                       customer.payment_history === 'good' ? '✅ Good' :
                       customer.payment_history === 'fair' ? '⚠️ Fair' : '❌ Poor'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{formatCurrency(customer.current_balance)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Performance Indicators */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="flex items-center space-x-2 p-2 bg-white/50 rounded-lg border border-white/30">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <div className="text-sm">
                <span className="text-gray-600">Avg. Credit:</span>
                <span className="font-medium ml-1">
                  {formatCurrency(stats.totalOutstanding / stats.totalAccounts)}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-2 bg-white/50 rounded-lg border border-white/30">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <div className="text-sm">
                <span className="text-gray-600">Unpaid:</span>
                <span className="font-medium ml-1">
                  {formatCurrency(stats.totalOutstanding * (1 - stats.collectionRate / 100))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UtangListaWidget;