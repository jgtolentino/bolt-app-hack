import React from 'react'
import { useRealtimeTransactions } from '../../hooks/useRealtimeTransactions'
import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'
import { Activity, Banknote, Clock, MapPin, Users } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'

export const RealtimeTransactionFeed: React.FC = () => {
  const { transactions, loading, error } = useRealtimeTransactions()

  if (loading) {
    return (
      <div className="chart-container">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="chart-container">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Live Transaction Feed</h3>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">
            {error ? 'Demo Mode' : 'Live'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-yellow-800">{error}</span>
          </div>
        </div>
      )}
      
      <div className="max-h-96 overflow-y-auto space-y-3">
        {transactions.slice(0, 10).map((transaction, index) => (
          <motion.div
            key={transaction.id}
            className="p-4 bg-white/50 rounded-lg border border-white/30 hover:bg-white/70 transition-colors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="flex items-center space-x-1">
                    <Banknote className="w-4 h-4 text-green-600" />
                    <span className="text-lg font-semibold text-green-600">
                      {formatCurrency(transaction.total_amount)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Users className="w-3 h-3" />
                    <span>{transaction.quantity} item{transaction.quantity !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <span className={`w-2 h-2 rounded-full ${
                      transaction.payment_method === 'Cash' ? 'bg-green-500' :
                      transaction.payment_method === 'GCash' ? 'bg-blue-500' :
                      transaction.payment_method === 'Utang/Lista' ? 'bg-orange-500' :
                      'bg-purple-500'
                    }`}></span>
                    <span>{transaction.payment_method}</span>
                  </div>
                  <span>•</span>
                  <span>{transaction.customer_type}</span>
                  {(transaction as any).geography?.store_name && (
                    <>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{(transaction as any).geography.store_name}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center space-x-1 text-sm font-medium">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span>{formatDistanceToNow(new Date(transaction.datetime), { addSuffix: true })}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(transaction.datetime).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/20 bg-gray-50 rounded-lg p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Showing latest {Math.min(transactions.length, 10)} transactions
          </span>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>💰 Cash: 52.8%</span>
            <span>📝 Utang/Lista: 28.1%</span>
            <span>📱 GCash: 18.9%</span>
          </div>
        </div>
      </div>
    </div>
  )
}