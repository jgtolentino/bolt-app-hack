# Scout Analytics: Legacy to Medallion Migration Plan

## Overview

This document outlines the migration from legacy `geography`/`organization` tables to the modern Medallion architecture with `stores`/`products`/`brands` schema.

## Current State

### Existing Data (As of July 2025)
- **376,212** transactions
- **48** stores (in `geography` table)
- **43** products (in `organization` table)
- **18** Philippine regions covered

### Legacy Schema
```
geography (stores) → transactions ← organization (products)
```

### Target Schema (Medallion Silver Layer)
```
stores → transactions → transaction_items ← products
                ↑                              ↑
            cashiers                        brands
                                         categories
```

## Migration Strategy

### Phase 1: Data Transformation (Zero Downtime)

| Step | Action | Impact | Rollback |
|------|--------|--------|----------|
| 1.1 | Create new tables (`stores`, `products`, `brands`, `categories`) | No impact - new tables | DROP new tables |
| 1.2 | Copy data from `geography` → `stores` | No impact - parallel data | DELETE from stores |
| 1.3 | Copy data from `organization` → `products`/`brands` | No impact - parallel data | DELETE from products |
| 1.4 | Create backward-compatible views | Legacy queries continue working | DROP views |

### Phase 2: Transaction Updates (Minimal Impact)

| Step | Action | Impact | Rollback |
|------|--------|--------|----------|
| 2.1 | Add `store_id`, `product_id` columns to transactions | Schema change only | DROP columns |
| 2.2 | Populate new columns from legacy IDs | Background update | NULL out columns |
| 2.3 | Add foreign key constraints | Ensures referential integrity | DROP constraints |

### Phase 3: Medallion Activation

| Step | Action | Impact | Rollback |
|------|--------|--------|----------|
| 3.1 | Deploy Bronze layer tables | New ingestion path | Keep using direct inserts |
| 3.2 | Activate Silver/Gold views | Enhanced analytics | Use legacy views |
| 3.3 | Enable cron ETL jobs | Automated processing | Disable cron jobs |

## Pre-Migration Checklist

- [ ] **Backup database** 
  ```bash
  pg_dump -h [host] -U [user] -d [database] > scout_backup_$(date +%Y%m%d).sql
  ```

- [ ] **Test migration on staging**
  ```sql
  -- Create test schema
  CREATE SCHEMA migration_test;
  -- Run migration in test schema first
  ```

- [ ] **Verify no active transactions**
  ```sql
  SELECT count(*) FROM pg_stat_activity 
  WHERE datname = current_database() 
  AND state = 'active';
  ```

- [ ] **Check disk space**
  ```sql
  SELECT pg_size_pretty(pg_database_size(current_database()));
  ```

## Migration Execution

### 1. Run Migration Script
```bash
# Execute the migration
psql -h [host] -U [user] -d [database] -f 20250701_legacy_to_medallion_migration.sql

# Or via Supabase CLI
supabase db push
```

### 2. Monitor Progress
```sql
-- Check migration status
SELECT * FROM migration_log ORDER BY started_at;

-- Monitor active queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE query LIKE '%INSERT INTO%' 
AND state = 'active';
```

### 3. Verify Results
```sql
-- Run verification
SELECT * FROM verify_migration();

-- Check record counts
SELECT 
  'geography' as source, COUNT(*) as count FROM geography
UNION ALL
SELECT 'stores' as source, COUNT(*) as count FROM stores
UNION ALL
SELECT 'organization' as source, COUNT(*) as count FROM organization
UNION ALL
SELECT 'products' as source, COUNT(*) as count FROM products;
```

## Post-Migration Tasks

### 1. Update Application Code (Optional)
```typescript
// Old code (still works via views)
const { data } = await supabase
  .from('geography')
  .select('*');

// New code (preferred)
const { data } = await supabase
  .from('stores')
  .select('*');
```

### 2. Refresh Materialized Views
```sql
-- Refresh all Silver layer views
SELECT refresh_all_silver_views();

-- Refresh all Gold layer views
SELECT refresh_all_gold_views();
```

### 3. Enable Monitoring
```sql
-- Check medallion health
SELECT * FROM check_medallion_health();

-- View cron job status
SELECT * FROM get_cron_job_status();
```

## Rollback Plan

If issues arise, execute rollback in reverse order:

### Quick Rollback (< 5 minutes)
```sql
-- Disable new processing
UPDATE cron.job SET active = false WHERE jobname LIKE '%medallion%';

-- Remove foreign key constraints
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS fk_transactions_store;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS fk_transactions_product;

-- Drop new columns
ALTER TABLE transactions DROP COLUMN IF EXISTS store_id;
ALTER TABLE transactions DROP COLUMN IF EXISTS product_id;

-- Application continues using legacy tables/views
```

### Full Rollback (if needed)
```sql
-- Drop all new objects
DROP TABLE IF EXISTS transaction_items CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP VIEW IF EXISTS geography CASCADE;
DROP VIEW IF EXISTS organization CASCADE;

-- Restore from backup
psql -h [host] -U [user] -d [database] < scout_backup_[date].sql
```

## Success Metrics

| Metric | Target | Query |
|--------|--------|-------|
| Data Integrity | 100% match | `SELECT COUNT(*) FROM geography g WHERE NOT EXISTS (SELECT 1 FROM stores s WHERE s.store_id = g.id::text)` |
| Query Performance | < 100ms | Check slow query log |
| View Compatibility | All legacy queries work | Test suite execution |
| Zero Downtime | No failed requests | Application logs |

## Timeline

| Phase | Duration | Details |
|-------|----------|---------|
| Preparation | 1 hour | Backups, staging test |
| Migration | 15 minutes | Run migration script |
| Verification | 30 minutes | Check data integrity |
| Monitoring | 24 hours | Watch for issues |
| Cleanup | 1 week later | Remove legacy tables (optional) |

## Support Contacts

- **Database Admin**: [Your DBA]
- **Application Team**: [Your Dev Team]
- **On-Call**: [Your On-Call Rotation]

## Appendix: Common Issues

### Issue 1: Duplicate Key Violations
```sql
-- Fix: Use ON CONFLICT
INSERT INTO stores (...) 
VALUES (...) 
ON CONFLICT (store_id) DO NOTHING;
```

### Issue 2: Foreign Key Constraints Fail
```sql
-- Fix: Clean orphaned records first
DELETE FROM transactions 
WHERE geography_id NOT IN (SELECT id FROM geography);
```

### Issue 3: View Permission Errors
```sql
-- Fix: Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL VIEWS IN SCHEMA public TO authenticated;
```

---

**Remember**: The beauty of this migration is that it's **non-destructive**. The legacy tables remain untouched, and compatibility views ensure zero application changes are required.