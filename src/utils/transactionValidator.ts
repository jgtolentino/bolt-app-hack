/**
 * Transaction validation utilities for Philippine retail data
 */

// Maximum reasonable transaction amount for Philippine retail (₱10000)
// This covers bulk purchases and higher-value transactions while filtering extreme outliers
export const MAX_TRANSACTION_AMOUNT = 10000;

// Minimum transaction amount (must be positive)
export const MIN_TRANSACTION_AMOUNT = 0.01;

export interface TransactionValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface TransactionInput {
  total_amount: number;
  quantity: number;
  unit_price: number;
  payment_method: string;
  organization_id?: string;
  geography_id?: string;
}

/**
 * Validates a transaction before insertion
 */
export function validateTransaction(transaction: TransactionInput): TransactionValidationResult {
  const errors: string[] = [];

  // Validate total amount
  if (typeof transaction.total_amount !== 'number' || isNaN(transaction.total_amount)) {
    errors.push('Total amount must be a valid number');
  } else if (transaction.total_amount <= 0) {
    errors.push('Total amount must be greater than 0');
  } else if (transaction.total_amount > MAX_TRANSACTION_AMOUNT) {
    errors.push(`Total amount exceeds maximum allowed value of ₱${MAX_TRANSACTION_AMOUNT}`);
  }

  // Validate quantity
  if (typeof transaction.quantity !== 'number' || !Number.isInteger(transaction.quantity)) {
    errors.push('Quantity must be a valid integer');
  } else if (transaction.quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  } else if (transaction.quantity > 100) {
    errors.push('Quantity exceeds reasonable limit (100 items)');
  }

  // Validate unit price
  if (typeof transaction.unit_price !== 'number' || isNaN(transaction.unit_price)) {
    errors.push('Unit price must be a valid number');
  } else if (transaction.unit_price <= 0) {
    errors.push('Unit price must be greater than 0');
  }

  // Validate calculation consistency
  if (transaction.total_amount && transaction.quantity && transaction.unit_price) {
    const expectedTotal = transaction.quantity * transaction.unit_price;
    const tolerance = 0.01; // Allow 1 centavo difference for rounding
    
    if (Math.abs(transaction.total_amount - expectedTotal) > tolerance) {
      errors.push('Total amount does not match quantity × unit price');
    }
  }

  // Validate payment method
  const validPaymentMethods = ['Cash', 'GCash', 'Utang/Lista', 'Credit Card'];
  if (!validPaymentMethods.includes(transaction.payment_method)) {
    errors.push(`Invalid payment method. Must be one of: ${validPaymentMethods.join(', ')}`);
  }

  // Validate foreign keys if provided
  if (transaction.organization_id && !isValidUUID(transaction.organization_id)) {
    errors.push('Invalid organization ID format');
  }

  if (transaction.geography_id && !isValidUUID(transaction.geography_id)) {
    errors.push('Invalid geography ID format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitizes transaction amounts to ensure they're within acceptable bounds
 */
export function sanitizeTransactionAmount(amount: number): number {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 0;
  }
  
  // Clamp to reasonable bounds
  return Math.min(Math.max(amount, MIN_TRANSACTION_AMOUNT), MAX_TRANSACTION_AMOUNT);
}

/**
 * Validates UUID format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Gets statistics about transaction anomalies
 */
export async function getTransactionAnomalyStats(transactions: any[]): Promise<{
  totalCount: number;
  anomalyCount: number;
  anomalyPercentage: number;
  maxValue: number;
  p99Value: number;
}> {
  if (!transactions || transactions.length === 0) {
    return {
      totalCount: 0,
      anomalyCount: 0,
      anomalyPercentage: 0,
      maxValue: 0,
      p99Value: 0
    };
  }

  const amounts = transactions.map(t => t.total_amount).sort((a, b) => a - b);
  const p99Index = Math.floor(amounts.length * 0.99);
  const p99Value = amounts[p99Index];
  
  const anomalyCount = amounts.filter(a => a > p99Value).length;
  
  return {
    totalCount: transactions.length,
    anomalyCount,
    anomalyPercentage: (anomalyCount / transactions.length) * 100,
    maxValue: Math.max(...amounts),
    p99Value
  };
}