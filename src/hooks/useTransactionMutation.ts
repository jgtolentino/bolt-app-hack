import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { validateTransaction, TransactionInput, MAX_TRANSACTION_AMOUNT } from '../utils/transactionValidator';

interface UseTransactionMutationResult {
  createTransaction: (transaction: TransactionInput) => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for creating transactions with validation
 */
export function useTransactionMutation(): UseTransactionMutationResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTransaction = async (transaction: TransactionInput) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate transaction
      const validation = validateTransaction(transaction);
      
      if (!validation.isValid) {
        const errorMessage = validation.errors.join('; ');
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      // Additional check for max transaction amount
      if (transaction.total_amount > MAX_TRANSACTION_AMOUNT) {
        const errorMessage = `Transaction amount ₱${transaction.total_amount} exceeds maximum allowed ₱${MAX_TRANSACTION_AMOUNT}`;
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      // Insert transaction
      const { data, error: supabaseError } = await supabase
        .from('transactions')
        .insert({
          datetime: new Date().toISOString(),
          total_amount: transaction.total_amount,
          quantity: transaction.quantity,
          unit_price: transaction.unit_price,
          payment_method: transaction.payment_method,
          organization_id: transaction.organization_id,
          geography_id: transaction.geography_id
        })
        .select()
        .single();

      if (supabaseError) {
        setError(supabaseError.message);
        return { success: false, error: supabaseError.message };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create transaction';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createTransaction,
    isLoading,
    error
  };
}

/**
 * Batch insert transactions with validation
 */
export async function batchInsertTransactions(
  transactions: TransactionInput[]
): Promise<{ success: boolean; inserted: number; failed: number; errors: string[] }> {
  const errors: string[] = [];
  const validTransactions: any[] = [];

  // Validate all transactions
  for (let i = 0; i < transactions.length; i++) {
    const validation = validateTransaction(transactions[i]);
    
    if (validation.isValid && transactions[i].total_amount <= MAX_TRANSACTION_AMOUNT) {
      validTransactions.push({
        datetime: new Date().toISOString(),
        ...transactions[i]
      });
    } else {
      errors.push(`Transaction ${i + 1}: ${validation.errors.join('; ')}`);
    }
  }

  if (validTransactions.length === 0) {
    return {
      success: false,
      inserted: 0,
      failed: transactions.length,
      errors
    };
  }

  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert(validTransactions)
      .select();

    if (error) {
      errors.push(`Database error: ${error.message}`);
      return {
        success: false,
        inserted: 0,
        failed: transactions.length,
        errors
      };
    }

    return {
      success: true,
      inserted: data?.length || validTransactions.length,
      failed: transactions.length - validTransactions.length,
      errors
    };
  } catch (err) {
    errors.push(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    return {
      success: false,
      inserted: 0,
      failed: transactions.length,
      errors
    };
  }
}