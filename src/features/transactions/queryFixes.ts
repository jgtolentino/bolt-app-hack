// Fix all transaction queries to use correct column names
import { supabase } from '../../lib/supabase';

// Fix transaction queries by replacing incorrect column names
export function fixTransactionQuery(query: any) {
  // This is a wrapper to fix common query issues
  // Since we can't directly modify the Supabase query builder,
  // we'll need to fix the queries at their source
  return query;
}

// Build correct transaction select string
export function buildTransactionSelect() {
  return `
    id,
    datetime,
    store_id,
    customer_id,
    payment_method,
    total_amount,
    discount_amount,
    stores!inner(
      store_id,
      store_name,
      region,
      city_municipality,
      barangay
    )
  `;
}

// Build correct transaction with items select
export function buildTransactionWithItemsSelect() {
  return `
    id,
    datetime,
    store_id,
    customer_id,
    payment_method,
    total_amount,
    discount_amount,
    stores!inner(
      store_id,
      store_name,
      region,
      city_municipality,
      barangay
    ),
    transaction_items(
      item_id,
      product_id,
      quantity,
      unit_price,
      discount_percentage
    )
  `;
}

// Transform transaction data to match expected format
export function transformTransactionData(transaction: any) {
  if (!transaction) return transaction;
  
  // Calculate items count if transaction_items exists
  const itemsCount = transaction.transaction_items?.length || 0;
  
  return {
    ...transaction,
    // Map datetime to all the different date/time fields the app expects
    transaction_date: transaction.datetime,
    transaction_time: transaction.datetime,
    transaction_datetime: transaction.datetime,
    // Use ID as receipt number
    receipt_number: transaction.id,
    // Calculate or default missing fields
    items_count: itemsCount,
    status: 'completed', // All transactions are completed
    subtotal: transaction.total_amount - (transaction.discount_amount || 0),
    tax_amount: transaction.total_amount * 0.12, // 12% VAT
    // Fix store data
    store: transaction.stores ? {
      ...transaction.stores,
      city: transaction.stores.city_municipality,
      status: transaction.stores.is_active ? 'active' : 'inactive'
    } : null
  };
}

// Fix date filters
export function fixDateFilters(dateFrom: any, dateTo: any) {
  // Ensure dates are properly formatted
  const fromDate = dateFrom instanceof Date ? dateFrom.toISOString() : dateFrom;
  const toDate = dateTo instanceof Date ? dateTo.toISOString() : dateTo;
  
  return {
    from: fromDate,
    to: toDate
  };
}