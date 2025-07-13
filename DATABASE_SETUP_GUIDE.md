# Scout Dashboard v4.0 Database Setup Guide

This guide provides complete instructions for setting up the PostgreSQL database for the Scout Dashboard v4.0, including schema creation, synthetic data generation, and data loading.

## 📋 Overview

The v4.0 database supports:
- **FMCG & Tobacco** product categories
- **Audio transcriptions** (Tagalog/English)
- **Video signals** for computer vision
- **Geographic data** with PostGIS
- **Substitution tracking** for product recommendations
- **Campaign attribution**
- **Customer profiling**

## 🗄️ Database Schema

### Core Tables
- `brands` - Brand master data
- `products` - SKU catalog  
- `stores` - Store locations with coordinates
- `customers` - Customer profiles
- `campaigns` - Marketing campaigns
- `transactions` - Transaction headers
- `transaction_items` - Line items
- `audio_transcripts` - Conversation analysis
- `video_signals` - Computer vision data

### Materialized Views
- `mv_hourly_patterns` - Hourly transaction patterns
- `mv_daily_sales` - Daily sales summaries
- `mv_product_performance` - Product analytics
- `mv_regional_performance` - Regional metrics

## 🚀 Quick Start

### 1. Prerequisites

```bash
# Install PostgreSQL 14+ with PostGIS
brew install postgresql postgis  # macOS
sudo apt install postgresql-14 postgresql-14-postgis-3  # Ubuntu

# Install Python dependencies
pip install psycopg2-binary
```

### 2. Create Database

```bash
# Create database
createdb scout_v4

# Enable PostGIS
psql scout_v4 -c "CREATE EXTENSION postgis;"
```

### 3. Run Schema Migration

```bash
# Apply complete schema
psql scout_v4 -f migrations/001_create_scout_v4_schema.sql
```

### 4. Generate Synthetic Data

```bash
# Make script executable
chmod +x scripts/generate_fmcg_tobacco.py

# Generate 50k transactions
python scripts/generate_fmcg_tobacco.py
```

This creates `comprehensive_fmcg_tobacco.csv` with all required fields.

### 5. Load Data into Database

```bash
# Load CSV into PostgreSQL
python scripts/load_data_to_postgres.py comprehensive_fmcg_tobacco.csv \
  --host localhost \
  --database scout_v4 \
  --user postgres \
  --password yourpassword
```

## 📊 Data Dictionary

| Field | Type | Description |
|-------|------|-------------|
| **transaction_id** | `VARCHAR(50)` | Unique transaction ID (TX00000001) |
| **timestamp** | `TIMESTAMP` | Transaction datetime |
| **store_id** | `VARCHAR(20)` | Store identifier (ST000123) |
| **store_name** | `VARCHAR(255)` | Human-readable store name |
| **store_type** | `VARCHAR(50)` | sari-sari, convenience |
| **region** | `VARCHAR(50)` | Philippine region (NCR, Region III, etc.) |
| **province** | `VARCHAR(100)` | Province name |
| **city_municipality** | `VARCHAR(100)` | City/municipality |
| **barangay** | `VARCHAR(100)` | Barangay name |
| **latitude** | `DECIMAL(10,6)` | Store latitude |
| **longitude** | `DECIMAL(10,6)` | Store longitude |
| **customer_id** | `UUID` | Customer identifier |
| **gender** | `VARCHAR(20)` | male, female, other |
| **age_bracket** | `VARCHAR(20)` | 18-24, 25-34, etc. |
| **sku_id** | `VARCHAR(50)` | Product SKU |
| **brand_name** | `VARCHAR(255)` | Brand (Alaska, Marlboro, etc.) |
| **product_name** | `VARCHAR(255)` | Full product name |
| **product_category** | `VARCHAR(50)` | FMCG category |
| **quantity** | `INTEGER` | Units purchased |
| **unit_price** | `DECIMAL(10,2)` | Price per unit |
| **was_substituted** | `BOOLEAN` | Product substitution flag |
| **audio_transcript** | `TEXT` | Conversation transcript |
| **video_objects** | `TEXT[]` | Detected objects |

## 🔧 Configuration

### Environment Variables

```bash
export DB_HOST=localhost
export DB_NAME=scout_v4
export DB_USER=postgres
export DB_PASSWORD=yourpassword
export DB_PORT=5432
```

### Connection String for Supabase

```javascript
const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
);
```

## 📈 Sample Queries

### Transaction Patterns
```sql
-- Hourly patterns by region
SELECT 
  region,
  hour_of_day,
  COUNT(*) as transactions,
  SUM(transaction_value) as revenue
FROM transactions t
JOIN stores s ON t.store_id = s.store_id
WHERE DATE(timestamp) = CURRENT_DATE
GROUP BY region, hour_of_day
ORDER BY region, hour_of_day;
```

### Product Substitutions
```sql
-- Substitution analysis
SELECT 
  p1.brand_name as requested_brand,
  p2.brand_name as substituted_brand,
  COUNT(*) as substitution_count
FROM transaction_items ti
JOIN products p1 ON ti.original_sku_id = p1.sku_id
JOIN products p2 ON ti.sku_id = p2.sku_id
WHERE ti.was_substituted = TRUE
GROUP BY p1.brand_name, p2.brand_name
ORDER BY substitution_count DESC;
```

### Geographic Analysis
```sql
-- Sales by barangay with coordinates
SELECT 
  s.barangay,
  s.latitude,
  s.longitude,
  COUNT(DISTINCT t.transaction_id) as transactions,
  SUM(t.transaction_value) as total_sales
FROM stores s
JOIN transactions t ON s.store_id = t.store_id
WHERE t.timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY s.barangay, s.latitude, s.longitude;
```

### Audio Insights
```sql
-- Language preference by region
SELECT 
  s.region,
  a.audio_language,
  COUNT(*) as count,
  AVG(a.sentiment_score) as avg_sentiment
FROM audio_transcripts a
JOIN transactions t ON a.transaction_id = t.transaction_id
JOIN stores s ON t.store_id = s.store_id
GROUP BY s.region, a.audio_language
ORDER BY s.region, count DESC;
```

## 🛠️ Maintenance

### Refresh Materialized Views
```sql
-- Run daily
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_hourly_patterns;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_sales;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_performance;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_regional_performance;
```

### Vacuum and Analyze
```sql
-- Run weekly
VACUUM ANALYZE transactions;
VACUUM ANALYZE transaction_items;
VACUUM ANALYZE stores;
VACUUM ANALYZE products;
```

### Backup
```bash
# Full backup
pg_dump scout_v4 > scout_v4_backup_$(date +%Y%m%d).sql

# Data only
pg_dump --data-only scout_v4 > scout_v4_data_$(date +%Y%m%d).sql
```

## 🔍 Troubleshooting

### Common Issues

1. **PostGIS not found**
   ```sql
   -- Check if PostGIS is installed
   SELECT PostGIS_Version();
   ```

2. **Performance issues**
   ```sql
   -- Check missing indexes
   SELECT schemaname, tablename, indexname 
   FROM pg_indexes 
   WHERE schemaname = 'public';
   ```

3. **Data load errors**
   - Check CSV encoding (should be UTF-8)
   - Verify column count matches
   - Check for special characters in text fields

### Performance Optimization

1. **Increase shared_buffers**
   ```
   # postgresql.conf
   shared_buffers = 256MB
   ```

2. **Enable parallel queries**
   ```
   # postgresql.conf
   max_parallel_workers_per_gather = 4
   ```

3. **Partition large tables**
   ```sql
   -- Partition transactions by month
   CREATE TABLE transactions_2024_01 
   PARTITION OF transactions 
   FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
   ```

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostGIS Documentation](https://postgis.net/docs/)
- [Supabase Database Guide](https://supabase.com/docs/guides/database)

## 🎯 Next Steps

1. **Connect Dashboard**: Update connection strings in the Scout Dashboard
2. **Add Real Data**: Import actual transaction data when available
3. **Setup Monitoring**: Configure pg_stat_statements for query monitoring
4. **Create APIs**: Build RESTful endpoints for dashboard queries
5. **Add Security**: Implement row-level security policies

---

For questions or issues, please refer to the main project documentation or create an issue in the repository.