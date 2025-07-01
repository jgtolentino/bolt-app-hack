// Column mappings for database compatibility
// Maps the column names used in the app to the actual database column names

export const TRANSACTION_COLUMNS = {
  // App column -> Database column
  transaction_date: 'datetime',
  transaction_time: 'datetime',
  transaction_datetime: 'datetime',
  receipt_number: 'id', // Using transaction ID as receipt number
  items_count: null, // Will need to be calculated from transaction_items
  status: null, // No status column, all transactions are considered completed
  cashier: null, // Not available
  customer: 'customer_id',
  subtotal: 'total_amount', // Using total_amount as subtotal
  tax_amount: null, // Not stored separately (calculated as 12% VAT)
} as const;

export const STORE_COLUMNS = {
  // Stores table uses 'city_municipality' not 'city'
  city: 'city_municipality',
  province: null, // Not available
  address: null, // Not available
  status: 'is_active',
} as const;

// Helper function to transform transaction data
export function transformTransaction(transaction: any): any {
  if (!transaction) return transaction;
  
  return {
    ...transaction,
    transaction_date: transaction.datetime,
    transaction_time: transaction.datetime,
    transaction_datetime: transaction.datetime,
    receipt_number: transaction.id,
    items_count: transaction.transaction_items?.length || 0,
    status: 'completed',
    subtotal: transaction.total_amount,
    tax_amount: transaction.total_amount * 0.12, // Assuming 12% VAT
  };
}

// Helper function to build safe column selections
export function buildTransactionSelect(columns: string[]): string {
  return columns.map(col => {
    if (col in TRANSACTION_COLUMNS) {
      const dbCol = TRANSACTION_COLUMNS[col as keyof typeof TRANSACTION_COLUMNS];
      if (dbCol) {
        // Map to actual column, aliasing if needed
        return col === dbCol ? dbCol : `${dbCol} as ${col}`;
      }
      // Column doesn't exist in DB, will handle in transformation
      return null;
    }
    return col;
  }).filter(Boolean).join(',');
}

// Fix date column references in where clauses
export function fixDateFilters(filters: any): any {
  const fixed = { ...filters };
  
  // Replace transaction_date with datetime
  if ('transaction_date' in fixed) {
    fixed.datetime = fixed.transaction_date;
    delete fixed.transaction_date;
  }
  
  // Remove status filter as it doesn't exist
  if ('status' in fixed) {
    delete fixed.status;
  }
  
  return fixed;
}