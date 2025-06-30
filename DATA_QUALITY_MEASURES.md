# Data Quality Measures

This document describes the data quality controls implemented in the Philippine Retail Analytics system.

## 1. Transaction Anomaly Filtering

### SQL Views
- **`transactions_clean`**: Filters out transactions above the 99th percentile
- **`transactions_reasonable`**: Limits transactions to ₱10,000 maximum
- **`v_transaction_thresholds`**: Shows current P95/P99 thresholds and outlier counts

### Usage
```sql
-- Use clean view instead of raw transactions table
SELECT * FROM transactions_clean WHERE datetime >= '2025-01-01';

-- Check current thresholds
SELECT * FROM v_transaction_thresholds;
```

## 2. Transaction Validation (Application Layer)

### Maximum Limits
- **Maximum transaction amount**: ₱10,000
- **Maximum quantity per transaction**: 100 items
- **Minimum transaction amount**: ₱0.01

### Validation Hook
```typescript
import { useTransactionMutation } from '@/hooks/useTransactionMutation';

const { createTransaction, isLoading, error } = useTransactionMutation();

// Transaction will be validated before insertion
const result = await createTransaction({
  total_amount: 500,
  quantity: 2,
  unit_price: 250,
  payment_method: 'Cash',
  organization_id: 'xxx',
  geography_id: 'yyy'
});
```

### Validation Rules
- Total amount must be positive and ≤ ₱10,000
- Quantity must be a positive integer ≤ 100
- Total amount must match quantity × unit price (±₱0.01 tolerance)
- Payment method must be one of: Cash, GCash, Utang/Lista, Credit Card
- Foreign key IDs must be valid UUIDs

## 3. CI/CD Data Validation

### Automated Checks
The `validate-data-completeness.js` script runs in CI to ensure:

1. **Table Completeness**
   - transactions: ≥ 1,000 records
   - geography: ≥ 10 records
   - organization: ≥ 10 records
   - customer_segments: ≥ 5 records
   - ai_insights: ≥ 5 records

2. **Transaction Quality**
   - Outlier detection (flags if >2% above P99)
   - High-value transaction warnings (>₱10,000)
   - Payment method diversity check

3. **Geographic Coverage**
   - Minimum 10/18 regions required
   - Store type diversity check

4. **Product Diversity**
   - Minimum 5 categories required
   - Minimum 20 brands recommended

### Running Validation Locally
```bash
node scripts/validate-data-completeness.js
```

### GitHub Actions Integration
Validation runs automatically on:
- Push to main/develop branches
- Pull requests
- Daily at 2 AM UTC

## 4. Batch Import Protection

When importing transactions in bulk:

```javascript
import { batchInsertTransactions } from '@/hooks/useTransactionMutation';

const result = await batchInsertTransactions(transactions);
// Returns: { success, inserted, failed, errors }
```

Each transaction is validated before insertion. Invalid records are skipped and reported.

## 5. Database Constraints

While not enforced at the database level to maintain flexibility, the application layer ensures:
- Positive amounts only
- Valid foreign key references
- Consistent calculations

## 6. Monitoring Recommendations

1. **Set up alerts** for:
   - Transactions > ₱5,000 (review for accuracy)
   - Bulk imports with >10% failure rate
   - Missing data in required tables

2. **Regular audits**:
   - Weekly: Run `validate-data-completeness.js`
   - Monthly: Review P99 thresholds and adjust if needed
   - Quarterly: Analyze outlier patterns

## 7. Future Enhancements

Consider implementing:
- Soft limits with warnings (e.g., flag transactions ₱5,000-₱10,000)
- Time-based anomaly detection (unusual spikes)
- Geographic anomaly detection (unusual sales patterns by region)
- Real-time validation dashboard

## Migration Guide

To apply these data quality measures to an existing database:

1. **Apply the migration**:
   ```bash
   # In Supabase SQL editor
   -- Run: 20250629124000_create_clean_transactions_view.sql
   ```

2. **Update application code** to use:
   - `transactions_clean` view instead of `transactions` table
   - `useTransactionMutation` hook for new transactions

3. **Set up CI secrets**:
   - `VITE_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

4. **Run initial validation**:
   ```bash
   node scripts/validate-data-completeness.js
   ```