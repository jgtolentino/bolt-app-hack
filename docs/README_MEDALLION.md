# Scout Analytics Medallion Architecture on Supabase

## Quick Start

### 1. Run the Migration
```bash
# Apply the Medallion architecture to your Supabase project
supabase db push
```

### 2. Enable Scheduled Jobs
```sql
-- In Supabase SQL Editor, enable pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Verify jobs are scheduled
SELECT * FROM cron.job;
```

### 3. Test Data Flow
```sql
-- Insert test data into Bronze
INSERT INTO bronze_pos_transactions (store_id, raw_transaction) 
VALUES ('STORE001', '{"id": "123", "total": 150.50, "timestamp": "2025-07-01T10:00:00Z"}'::jsonb);

-- Check if ETL processed it (after 15 min)
SELECT * FROM transactions WHERE transaction_id = '123';
```

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  BRONZE LAYER   │     │  SILVER LAYER   │     │   GOLD LAYER    │
│                 │     │                 │     │                 │
│ • Raw ingestion │ ──► │ • Cleaned data  │ ──► │ • BI/AI ready   │
│ • JSON/JSONB    │     │ • Validated     │     │ • Pre-aggregated│
│ • Service only  │     │ • Joined        │     │ • Scored        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
       ▲                                                  │
       │                                                  ▼
┌─────────────────┐                            ┌─────────────────┐
│  EDGE DEVICES   │                            │   APPLICATIONS  │
│ • STT/Vision    │                            │ • Dashboard     │
│ • POS Systems   │                            │ • AI Insights   │
└─────────────────┘                            └─────────────────┘
```

## Layer-by-Layer Guide

### 🥉 Bronze Layer

**Purpose**: Capture everything, validate nothing

**Tables**:
- `bronze_transcriptions` - Raw STT from stores
- `bronze_vision_detections` - OpenCV object detection
- `bronze_pos_transactions` - POS system dumps
- `bronze_inventory_events` - Stock movements
- `bronze_customer_interactions` - Touch points

**Access Pattern**:
```typescript
// Only Edge Functions should write to Bronze
const { data, error } = await supabase
  .from('bronze_transcriptions')
  .insert({
    device_id: 'EDGE_001',
    store_id: 'STORE_123',
    raw_payload: sttPayload,
    transcription_text: extractedText,
    confidence_score: 0.85
  });
```

### 🥈 Silver Layer

**Purpose**: The workhorse - clean, validated, joinable

**Core Tables** (existing):
- `transactions`
- `products`
- `stores`
- `transaction_items`

**New Materialized Views**:
- `silver_product_performance` - Daily product metrics
- `silver_store_hourly_patterns` - Store traffic patterns
- `silver_customer_patterns` - Basket analysis

**Access Pattern**:
```typescript
// Query from React components
const { data } = await supabase
  .from('silver_product_performance')
  .select('*')
  .eq('brand_name', 'Coca-Cola')
  .gte('date', lastWeek);
```

### 🥇 Gold Layer

**Purpose**: Dashboard-ready, AI-optimized

**Materialized Views**:
- `gold_executive_kpis` - C-suite metrics
- `gold_brand_performance` - Brand health scores
- `gold_ai_features` - ML feature store
- `gold_substitution_matrix` - Product relationships

**Access Pattern**:
```typescript
// For KPI Cards
const { data: kpis } = await supabase
  .from('gold_executive_kpis')
  .select('*')
  .single();

// For AI Insights
const { data: features } = await supabase
  .from('gold_ai_features')
  .select('revenue_timeseries, growth_rate')
  .eq('product_id', productId);
```

## ETL Schedule

| Job | Frequency | What it does |
|-----|-----------|--------------|
| `process-bronze-to-silver` | Every 15 min | Validates & promotes Bronze → Silver |
| `refresh-silver-views` | Every hour | Updates Silver materialized views |
| `refresh-gold-views` | Every 6 hours | Rebuilds Gold aggregations |
| `medallion-health-check` | Every 30 min | Monitors pipeline health |

## Integration Points

### 1. Command Center Query Builder
```typescript
// queryBuilder.ts
const LAYER_MAPPING = {
  'real-time': ['transactions', 'stores'], // Silver
  'aggregated': ['gold_executive_kpis'],   // Gold
  'ml-features': ['gold_ai_features']      // Gold
};
```

### 2. AI Insight Generation
```typescript
// useAIInsights.ts
// Always pull from Gold for consistency
const getInsightData = async (template: InsightTemplate) => {
  return supabase
    .from('gold_ai_features')
    .select(template.required_features);
};
```

### 3. Dashboard Components
```typescript
// KpiCard.tsx
// Use Gold layer for pre-calculated KPIs
const { data } = await supabase
  .from('gold_executive_kpis')
  .select('today_revenue, week_over_week_growth');
```

## Security Model

### Bronze Layer
```sql
-- No RLS policies = service_role only
ALTER TABLE bronze_transcriptions ENABLE ROW LEVEL SECURITY;
-- No policies defined = locked down
```

### Silver Layer
```sql
-- Region-based access
CREATE POLICY "region_access" ON stores
FOR SELECT USING (region IN (
  SELECT unnest(assigned_regions) 
  FROM user_permissions 
  WHERE user_id = auth.uid()
));
```

### Gold Layer
```sql
-- Role-based access
CREATE POLICY "executive_kpis" ON gold_executive_kpis
FOR SELECT USING (
  user_role(auth.uid()) IN ('executive', 'admin')
);
```

## Monitoring & Health

### Check Pipeline Health
```sql
-- Run this query to see layer health
SELECT * FROM check_medallion_health();
```

### View Recent Alerts
```sql
SELECT * FROM medallion_monitoring 
WHERE alert_triggered = TRUE 
ORDER BY check_time DESC 
LIMIT 10;
```

### Manual Refresh
```sql
-- Force refresh a specific view
REFRESH MATERIALIZED VIEW CONCURRENTLY gold_executive_kpis;
```

## Best Practices

### ✅ DO:
1. **Write to Bronze only** via Edge Functions/APIs
2. **Query from Silver** for detailed analysis
3. **Use Gold** for dashboards and AI
4. **Monitor pipeline health** daily
5. **Document transformations** in SQL comments

### ❌ DON'T:
1. Query Bronze from application code
2. Write directly to Silver/Gold
3. Create dependencies between Gold views
4. Store PII in Gold layer
5. Bypass validation in Bronze→Silver

## Troubleshooting

### Common Issues

**1. Bronze Backlog Growing**
```sql
-- Check unprocessed records
SELECT COUNT(*), MIN(ingested_at) 
FROM bronze_transcriptions 
WHERE processed = FALSE;

-- Force process old records
UPDATE bronze_transcriptions 
SET processed = TRUE 
WHERE processed = FALSE 
AND ingested_at < NOW() - INTERVAL '1 day';
```

**2. Stale Gold Views**
```sql
-- Check last refresh time
SELECT schemaname, matviewname, last_refresh 
FROM pg_matviews 
WHERE matviewname LIKE 'gold_%';

-- Manual refresh
REFRESH MATERIALIZED VIEW CONCURRENTLY gold_executive_kpis;
```

**3. RLS Blocking Access**
```sql
-- Test policies as a specific user
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-uuid-here';
SELECT * FROM gold_brand_performance;
```

## Next Steps

1. **Set up monitoring dashboard** for pipeline health
2. **Configure alerts** for critical thresholds
3. **Add custom Bronze sources** for your edge devices
4. **Create domain-specific Gold views** for your use cases
5. **Document your transformations** in this README

---

*For implementation details, see [DATA_PIPELINE_MEDALLION.md](./DATA_PIPELINE_MEDALLION.md)*