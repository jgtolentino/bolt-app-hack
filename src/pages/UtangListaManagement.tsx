import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useFilterStore } from '../stores/filterStore';
import {
  Users, DollarSign, Calendar, Clock, CreditCard, 
  PlusCircle, Edit, Trash2, CheckCircle, XCircle, 
  Download, RefreshCcw, Search, Filter, ArrowUp, ArrowDown
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

interface UtangAccount {
  id: string;
  customer_name: string;
  customer_contact: string;
  geography_id: string;
  credit_limit: number;
  current_balance: number;
  payment_due_date: string | null;
  last_payment_date: string | null;
  payment_history: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  geography?: {
    store_name: string;
    region: string;
    city_municipality: string;
    barangay: string;
  };
}

interface UtangTransaction {
  id: string;
  account_id: string;
  transaction_id: string | null;
  transaction_type: 'purchase' | 'payment';
  amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const UtangListaManagement: React.FC = () => {
  const navigate = useNavigate();
  const { region, city_municipality, barangay, setFilter } = useFilterStore();
  const [accounts, setAccounts] = useState<UtangAccount[]>([]);
  const [transactions, setTransactions] = useState<UtangTransaction[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<UtangAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('current_balance');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [newAccount, setNewAccount] = useState({
    customer_name: '',
    customer_contact: '',
    geography_id: '',
    credit_limit: 1000
  });
  const [storeLocations, setStoreLocations] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  
  // Load accounts and analytics data
  useEffect(() => {
    loadAccounts();
    loadAnalytics();
    loadStoreLocations();
  }, [region, city_municipality, barangay]);
  
  // Load account transactions when an account is selected
  useEffect(() => {
    if (selectedAccount) {
      loadAccountTransactions(selectedAccount.id);
    }
  }, [selectedAccount]);
  
  const loadAccounts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('utang_lista_accounts')
        .select(`
          *,
          geography:geography_id(
            store_name,
            region,
            city_municipality,
            barangay
          )
        `)
        .order(sortField, { ascending: sortDirection === 'asc' });
      
      // Apply filters if set
      if (region) {
        query = query.eq('geography.region', region);
      }
      if (city_municipality) {
        query = query.eq('geography.city_municipality', city_municipality);
      }
      if (barangay) {
        query = query.eq('geography.barangay', barangay);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data) {
        setAccounts(data);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      // Fallback to mock data
      setAccounts([
        {
          id: '1',
          customer_name: 'Maria Santos',
          customer_contact: '09123456789',
          geography_id: '1',
          credit_limit: 2000,
          current_balance: 1250,
          payment_due_date: '2025-04-15',
          last_payment_date: '2025-03-15',
          payment_history: 'good',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          geography: {
            store_name: 'Tondo Sari-Sari Store',
            region: 'NCR',
            city_municipality: 'Manila',
            barangay: 'Tondo'
          }
        },
        {
          id: '2',
          customer_name: 'Juan Dela Cruz',
          customer_contact: '09187654321',
          geography_id: '1',
          credit_limit: 1500,
          current_balance: 750,
          payment_due_date: '2025-04-10',
          last_payment_date: '2025-03-10',
          payment_history: 'excellent',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          geography: {
            store_name: 'Tondo Sari-Sari Store',
            region: 'NCR',
            city_municipality: 'Manila',
            barangay: 'Tondo'
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  const loadAccountTransactions = async (accountId: string) => {
    try {
      const { data, error } = await supabase
        .from('utang_lista_transactions')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      // Fallback to mock data
      setTransactions([
        {
          id: '1',
          account_id: accountId,
          transaction_id: null,
          transaction_type: 'purchase',
          amount: 500,
          notes: 'Weekly groceries',
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          account_id: accountId,
          transaction_id: null,
          transaction_type: 'purchase',
          amount: 350,
          notes: 'School supplies',
          created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          account_id: accountId,
          transaction_id: null,
          transaction_type: 'payment',
          amount: 300,
          notes: 'Partial payment',
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          account_id: accountId,
          transaction_id: null,
          transaction_type: 'purchase',
          amount: 700,
          notes: 'Birthday supplies',
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]);
    }
  };
  
  const loadAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('v_utang_lista_analytics')
        .select('*');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Aggregate data for summary
        const totalAccounts = data.reduce((sum, item) => sum + item.credit_accounts, 0);
        const totalOutstanding = data.reduce((sum, item) => sum + item.total_credit_outstanding, 0);
        const avgBalance = totalAccounts > 0 ? totalOutstanding / totalAccounts : 0;
        const totalPurchases = data.reduce((sum, item) => sum + item.total_credit_purchases, 0);
        const totalPayments = data.reduce((sum, item) => sum + item.total_credit_payments, 0);
        const collectionRate = totalPurchases > 0 ? (totalPayments / totalPurchases) * 100 : 0;
        
        setAnalyticsData({
          totalAccounts,
          totalOutstanding,
          avgBalance,
          totalPurchases,
          totalPayments,
          collectionRate,
          regionData: data
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Fallback to mock data
      setAnalyticsData({
        totalAccounts: 125,
        totalOutstanding: 87500,
        avgBalance: 700,
        totalPurchases: 125000,
        totalPayments: 85000,
        collectionRate: 68,
        regionData: [
          { region: 'NCR', credit_accounts: 45, total_credit_outstanding: 31500, payment_collection_rate: 72 },
          { region: 'Region VII', credit_accounts: 28, total_credit_outstanding: 19600, payment_collection_rate: 65 },
          { region: 'Region III', credit_accounts: 22, total_credit_outstanding: 15400, payment_collection_rate: 70 }
        ]
      });
    }
  };
  
  const loadStoreLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('geography')
        .select('id, store_name, region, city_municipality, barangay');
      
      if (error) throw error;
      
      if (data) {
        setStoreLocations(data);
      }
    } catch (error) {
      console.error('Error loading store locations:', error);
    }
  };
  
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const handleAddPayment = async () => {
    if (!selectedAccount || paymentAmount <= 0) return;
    
    try {
      // Call the process_utang_lista_payment function
      const { data, error } = await supabase.rpc('process_utang_lista_payment', {
        p_account_id: selectedAccount.id,
        p_amount: paymentAmount,
        p_notes: paymentNotes || 'Payment received'
      });
      
      if (error) throw error;
      
      // Refresh data
      loadAccounts();
      loadAccountTransactions(selectedAccount.id);
      
      // Reset form
      setPaymentAmount(0);
      setPaymentNotes('');
      setShowAddPaymentModal(false);
      
      // Update selected account
      const updatedAccount = accounts.find(a => a.id === selectedAccount.id);
      if (updatedAccount) {
        setSelectedAccount({
          ...updatedAccount,
          current_balance: Math.max(0, updatedAccount.current_balance - paymentAmount),
          last_payment_date: new Date().toISOString().split('T')[0]
        });
      }
      
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Failed to process payment. Please try again.');
    }
  };
  
  const handleAddAccount = async () => {
    if (!newAccount.customer_name || !newAccount.geography_id) return;
    
    try {
      const { data, error } = await supabase
        .from('utang_lista_accounts')
        .insert([
          {
            customer_name: newAccount.customer_name,
            customer_contact: newAccount.customer_contact,
            geography_id: newAccount.geography_id,
            credit_limit: newAccount.credit_limit,
            current_balance: 0,
            payment_due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            is_active: true
          }
        ])
        .select();
      
      if (error) throw error;
      
      // Refresh accounts
      loadAccounts();
      
      // Reset form
      setNewAccount({
        customer_name: '',
        customer_contact: '',
        geography_id: '',
        credit_limit: 1000
      });
      setShowAddAccountModal(false);
      
    } catch (error) {
      console.error('Error adding account:', error);
      alert('Failed to add account. Please try again.');
    }
  };
  
  const filteredAccounts = accounts.filter(account => 
    account.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (account.geography?.store_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (account.customer_contact || '').includes(searchTerm)
  );
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utang/Lista Management</h1>
          <p className="text-gray-600">
            Manage credit accounts and track payments for the traditional Filipino credit system
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowAddAccountModal(true)}
            className="filter-button flex items-center space-x-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Account</span>
          </button>
          <button className="filter-button flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button 
            onClick={loadAccounts}
            className="filter-button flex items-center space-x-2"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* Analytics Overview */}
      {analyticsData && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-gray-500">Total</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {analyticsData.totalAccounts}
            </div>
            <div className="text-sm text-gray-600">Credit Accounts</div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-gray-500">Outstanding</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(analyticsData.totalOutstanding)}
            </div>
            <div className="text-sm text-gray-600">Total Credit</div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-gray-500">Average</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(analyticsData.avgBalance)}
            </div>
            <div className="text-sm text-gray-600">Avg Balance</div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <ArrowUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-gray-500">Purchases</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(analyticsData.totalPurchases)}
            </div>
            <div className="text-sm text-gray-600">Credit Sales</div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
                <ArrowDown className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-gray-500">Payments</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(analyticsData.totalPayments)}
            </div>
            <div className="text-sm text-gray-600">Total Collected</div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-gray-500">Rate</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {analyticsData.collectionRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Collection Rate</div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accounts List */}
        <motion.div
          className="lg:col-span-1 chart-container"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Credit Accounts</h3>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          
          <div className="overflow-y-auto max-h-[600px]">
            <div className="flex items-center justify-between text-xs text-gray-500 px-3 py-2 border-b">
              <button 
                onClick={() => handleSort('customer_name')}
                className="flex items-center space-x-1"
              >
                <span>Customer</span>
                {sortField === 'customer_name' && (
                  sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                )}
              </button>
              <button 
                onClick={() => handleSort('current_balance')}
                className="flex items-center space-x-1"
              >
                <span>Balance</span>
                {sortField === 'current_balance' && (
                  sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                )}
              </button>
              <button 
                onClick={() => handleSort('payment_history')}
                className="flex items-center space-x-1"
              >
                <span>Status</span>
                {sortField === 'payment_history' && (
                  sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                )}
              </button>
            </div>
            
            {loading ? (
              <div className="py-20 text-center">
                <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Loading accounts...</p>
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-gray-500">No accounts found</p>
              </div>
            ) : (
              filteredAccounts.map((account) => (
                <div
                  key={account.id}
                  onClick={() => setSelectedAccount(account)}
                  className={`p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedAccount?.id === account.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">{account.customer_name}</div>
                      <div className="text-xs text-gray-500">{account.geography?.store_name}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${
                        account.current_balance > account.credit_limit * 0.8 ? 'text-red-600' :
                        account.current_balance > account.credit_limit * 0.5 ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {formatCurrency(account.current_balance)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {account.payment_history === 'excellent' ? '⭐ Excellent' :
                         account.payment_history === 'good' ? '✅ Good' :
                         account.payment_history === 'fair' ? '⚠️ Fair' : '❌ Poor'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
        
        {/* Account Details */}
        <motion.div
          className="lg:col-span-2 chart-container"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {selectedAccount ? (
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedAccount.customer_name}</h3>
                  <p className="text-sm text-gray-600">
                    {selectedAccount.geography?.store_name}, {selectedAccount.geography?.barangay}
                  </p>
                  {selectedAccount.customer_contact && (
                    <p className="text-sm text-gray-600 mt-1">
                      Contact: {selectedAccount.customer_contact}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowAddPaymentModal(true)}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Add Payment
                  </button>
                  <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                    Edit Account
                  </button>
                </div>
              </div>
              
              {/* Account Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-600">Current Balance</div>
                  <div className="text-xl font-bold text-blue-900">
                    {formatCurrency(selectedAccount.current_balance)}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Limit: {formatCurrency(selectedAccount.credit_limit)}
                  </div>
                  <div className="w-full bg-blue-200 h-2 rounded-full mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (selectedAccount.current_balance / selectedAccount.credit_limit) * 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600">Payment History</div>
                  <div className="text-xl font-bold text-green-900">
                    {selectedAccount.payment_history === 'excellent' ? 'Excellent' :
                     selectedAccount.payment_history === 'good' ? 'Good' :
                     selectedAccount.payment_history === 'fair' ? 'Fair' : 'Poor'}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Last payment: {selectedAccount.last_payment_date ? 
                      formatDate(new Date(selectedAccount.last_payment_date)) : 'None'}
                  </div>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-purple-600">Payment Due</div>
                  <div className="text-xl font-bold text-purple-900">
                    {selectedAccount.payment_due_date ? 
                      formatDate(new Date(selectedAccount.payment_due_date)) : 'Not set'}
                  </div>
                  <div className="text-xs text-purple-600 mt-1">
                    Account since: {formatDate(new Date(selectedAccount.created_at))}
                  </div>
                </div>
              </div>
              
              {/* Transaction History */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Transaction History</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-gray-500">
                            No transactions found
                          </td>
                        </tr>
                      ) : (
                        transactions.map((transaction) => (
                          <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              {formatDate(new Date(transaction.created_at))}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                transaction.transaction_type === 'purchase' 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {transaction.transaction_type === 'purchase' ? 'Purchase' : 'Payment'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-medium">
                              <span className={transaction.transaction_type === 'purchase' ? 'text-red-600' : 'text-green-600'}>
                                {transaction.transaction_type === 'purchase' ? '+' : '-'}
                                {formatCurrency(transaction.amount)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {transaction.notes || '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Account Selected</h3>
              <p className="text-gray-600 mb-6">
                Select an account from the list to view details and transaction history
              </p>
              <button 
                onClick={() => setShowAddAccountModal(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Create New Account
              </button>
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Regional Performance */}
      {analyticsData && analyticsData.regionData && (
        <motion.div
          className="chart-container"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Regional Credit Performance</h3>
            <div className="text-sm text-gray-600">
              Collection rates across regions
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Region</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Accounts</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Outstanding</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Collection Rate</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.regionData.map((region: any, index: number) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">
                      {region.region}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {region.credit_accounts}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {formatCurrency(region.total_credit_outstanding)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {region.payment_collection_rate ? region.payment_collection_rate.toFixed(1) : 0}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (region.payment_collection_rate || 0) > 75 ? 'bg-green-100 text-green-800' :
                        (region.payment_collection_rate || 0) > 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {(region.payment_collection_rate || 0) > 75 ? 'Excellent' :
                         (region.payment_collection_rate || 0) > 50 ? 'Good' : 'Needs Attention'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">💡 Utang/Lista Best Practices</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-700">
              <div>
                <p className="mb-1">• Set clear payment terms and due dates</p>
                <p className="mb-1">• Maintain regular communication with customers</p>
                <p className="mb-1">• Offer small incentives for early payment</p>
              </div>
              <div>
                <p className="mb-1">• Keep detailed records of all transactions</p>
                <p className="mb-1">• Establish credit limits based on payment history</p>
                <p className="mb-1">• Consider digital payment options for collection</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Add Payment Modal */}
      {showAddPaymentModal && selectedAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            className="bg-white rounded-lg p-6 w-full max-w-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Payment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer
                </label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium">{selectedAccount.customer_name}</div>
                  <div className="text-sm text-gray-600">
                    Current Balance: {formatCurrency(selectedAccount.current_balance)}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Amount
                </label>
                <input
                  type="number"
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter amount"
                  min="0"
                  max={selectedAccount.current_balance}
                  step="0.01"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Add payment notes"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowAddPaymentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPayment}
                  disabled={paymentAmount <= 0 || paymentAmount > selectedAccount.current_balance}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Process Payment
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Add Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            className="bg-white rounded-lg p-6 w-full max-w-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Credit Account</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={newAccount.customer_name}
                  onChange={(e) => setNewAccount({...newAccount, customer_name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter customer name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number (Optional)
                </label>
                <input
                  type="text"
                  value={newAccount.customer_contact}
                  onChange={(e) => setNewAccount({...newAccount, customer_contact: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter contact number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store Location
                </label>
                <select
                  value={newAccount.geography_id}
                  onChange={(e) => setNewAccount({...newAccount, geography_id: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select store location</option>
                  {storeLocations.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.store_name} - {store.barangay}, {store.city_municipality}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credit Limit
                </label>
                <input
                  type="number"
                  value={newAccount.credit_limit}
                  onChange={(e) => setNewAccount({...newAccount, credit_limit: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter credit limit"
                  min="0"
                  step="100"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowAddAccountModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAccount}
                  disabled={!newAccount.customer_name || !newAccount.geography_id}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  Create Account
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UtangListaManagement;