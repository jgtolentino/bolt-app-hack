import { useEffect, useState } from 'react'
import { supabase, fetchAllRecords } from '../../../lib/supabase'
import { useDataStore } from '../../../stores/dataStore'
import type { Database } from '../../../lib/supabase'

type Transaction = Database['public']['Tables']['transactions']['Row']

export const useRealtimeTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { useRealData } = useDataStore()

  useEffect(() => {
    // Fetch initial transactions
    const fetchTransactions = async () => {
      try {
        if (useRealData) {
          const query = supabase
            .from('transactions')
            .select(`
              *,
              geography:geography_id(region, city_municipality, barangay, store_name),
              organization:organization_id(client, category, brand, sku)
            `)
            .order('datetime', { ascending: false })
            .limit(100);
          
          const data = await fetchAllRecords(query, 100);
          
          if (data && data.length > 0) {
            setTransactions(data || [])
            setError(null)
          } else {
            // No real data available, use mock data
            throw new Error('No real data available')
          }
        } else {
          // User explicitly wants mock data
          throw new Error('Mock data requested')
        }
      } catch (err) {
        console.warn('Using mock data:', err)
        // Fallback to mock data
        const mockTransactions = Array.from({ length: 10 }, (_, i) => ({
          id: `mock-${i}`,
          datetime: new Date(Date.now() - i * 60000).toISOString(),
          geography_id: 'mock-geo',
          organization_id: 'mock-org',
          total_amount: Math.floor(Math.random() * 500) + 50,
          quantity: Math.floor(Math.random() * 5) + 1,
          unit_price: null,
          discount_amount: null,
          payment_method: ['Cash', 'GCash', 'Utang/Lista'][Math.floor(Math.random() * 3)],
          customer_type: ['Regular', 'Student', 'Senior'][Math.floor(Math.random() * 3)],
          transaction_source: 'sari-sari',
          is_processed: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
        setTransactions(mockTransactions as Transaction[])
        setError(useRealData ? 'Using mock data - Connect to Supabase for real data' : 'Demo mode active')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()

    // Subscribe to real-time updates only if using real data
    let subscription: any = null
    
    if (useRealData) {
      subscription = supabase
        .channel('transactions_channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'transactions'
          },
          (payload) => {
            const newTransaction = payload.new as Transaction
            setTransactions((prev) => [newTransaction, ...prev.slice(0, 99)])
          }
        )
        .subscribe()
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [useRealData])

  return { transactions, loading, error }
}