# Regional Representation Guide

## Overview

This guide ensures that your Scout Dashboard displays a representative sample of all 18 Philippine regions, especially important for demos and initial data exploration.

## Philippine Regions

The complete list of regions that should be represented:

1. **NCR** - National Capital Region (Metro Manila)
2. **Region I** - Ilocos Region
3. **Region II** - Cagayan Valley
4. **Region III** - Central Luzon
5. **Region IV-A** - CALABARZON
6. **Region IV-B** - MIMAROPA
7. **Region V** - Bicol Region
8. **Region VI** - Western Visayas
9. **Region VII** - Central Visayas
10. **Region VIII** - Eastern Visayas
11. **Region IX** - Zamboanga Peninsula
12. **Region X** - Northern Mindanao
13. **Region XI** - Davao Region
14. **Region XII** - SOCCSKSARGEN
15. **Region XIII** - Caraga
16. **CAR** - Cordillera Administrative Region
17. **CARAGA** - Caraga Region
18. **BARMM** - Bangsamoro Autonomous Region

## Implementation Methods

### Method 1: Create Representative Sample (Recommended)

```bash
# Run the representative sample script
node scripts/create-representative-sample.js
```

This script:
- Creates exactly 1000 transactions
- Distributes them evenly across all regions (~55-56 per region)
- NCR gets the remainder for slight urban bias
- Maintains realistic time patterns
- Preserves authentic shopping behaviors

### Method 2: Reorder Existing Data

If you already have data but want to reorder for better representation:

```sql
-- Run in Supabase SQL Editor
SELECT reorder_for_regional_representation();
```

This function:
- Takes existing transactions
- Reorders the first 1000 using round-robin
- Maintains actual transaction dates
- Changes only the display order

### Method 3: Query with Regional Distribution

Use the representative sampling function:

```sql
-- Get 1000 transactions with all regions represented
SELECT * FROM get_representative_transactions(1000);

-- Get 500 transactions from last 30 days
SELECT * FROM get_representative_transactions(
  500, 
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE
);
```

## Checking Regional Coverage

### 1. Run Coverage Check

```bash
node scripts/check-regional-coverage.js
```

Output example:
```
📊 Current Regional Distribution:
================================

Region          | Stores | Transactions |    Sales    | % Trans | % Sales
----------------|--------|--------------|-------------|---------|--------
NCR             |     45 |        15234 |  ₱4,567,890 |   28.5% |   31.2%
Region I        |     12 |         2341 |    ₱678,901 |    4.4% |    4.6%
...

📈 First 1000 Transactions by Region:
=====================================

NCR             62 (6.2%) ███
Region I        55 (5.5%) ██
Region II       55 (5.5%) ██
...

✅ All regions represented in first 1000 transactions!
```

### 2. Dashboard Verification

```sql
-- Check regional distribution view
SELECT * FROM v_regional_distribution;

-- Verify first 1000 transactions cover all regions
WITH first_1000 AS (
  SELECT t.*, s.region
  FROM transactions t
  JOIN stores s ON t.store_id = s.id
  ORDER BY t.created_at
  LIMIT 1000
)
SELECT 
  region,
  COUNT(*) as transaction_count,
  ROUND(COUNT(*) * 100.0 / 1000, 1) as percentage
FROM first_1000
GROUP BY region
ORDER BY region;
```

## Best Practices

### 1. **Initial Data Load**
- Always create stores for all regions first
- Use `ensure_regional_coverage()` function
- Start with representative sample for demos

### 2. **Demo Scenarios**
- First 1000 records should show all regions
- Use filters to demonstrate regional differences
- Highlight regional economic patterns

### 3. **Production Data**
- Natural distribution will emerge over time
- NCR and major cities will have more volume
- Rural regions will have different patterns

## Regional Characteristics

When generating data, consider these regional traits:

### Urban Regions (Extended Hours)
- **NCR**: 6 AM - 10 PM, higher transaction volumes
- **Region III**: Industrial, shift workers
- **Region IV-A**: Suburban sprawl, mall culture
- **Region VII**: Tourism, extended retail hours

### Rural Regions (Traditional Hours)
- **CAR**: Mountain communities, 6 AM - 6 PM
- **BARMM**: Cultural considerations, prayer times
- **Region VIII**: Agricultural, early morning peaks
- **CARAGA**: Mining communities, payday spikes

## Troubleshooting

### Missing Regions in Display

1. Check if stores exist:
```sql
SELECT region, COUNT(*) as store_count
FROM stores
GROUP BY region
ORDER BY region;
```

2. Ensure stores have transactions:
```sql
SELECT s.region, COUNT(DISTINCT t.id) as transactions
FROM stores s
LEFT JOIN transactions t ON s.id = t.store_id
GROUP BY s.region
HAVING COUNT(DISTINCT t.id) = 0;
```

3. Run regional coverage fix:
```sql
SELECT ensure_regional_coverage();
```

### Uneven Distribution

If some regions dominate:
1. Use `get_representative_transactions()` function
2. Apply regional filters in dashboard
3. Create region-specific views

## Integration with Dashboard

### Update Components

In your dashboard components, use the representative query:

```typescript
// services/dataService.ts
export async function getRepresentativeTransactions(limit = 1000) {
  const { data, error } = await supabase
    .rpc('get_representative_transactions', { 
      limit_count: limit 
    });
  
  return data;
}
```

### Regional Filters

Ensure filter shows all regions:

```typescript
// Get all possible regions
const ALL_REGIONS = [
  'NCR', 'Region I', 'Region II', 'Region III', 
  'Region IV-A', 'Region IV-B', 'Region V', 'Region VI',
  'Region VII', 'Region VIII', 'Region IX', 'Region X',
  'Region XI', 'Region XII', 'Region XIII', 
  'CAR', 'CARAGA', 'BARMM'
];
```

## Benefits

1. **Better Demos**: All regions visible immediately
2. **Accurate Testing**: Catches regional-specific issues
3. **Fair Representation**: No region bias in samples
4. **Realistic Patterns**: Maintains authentic behaviors
5. **Complete Coverage**: No missing data scenarios