# Scout Dashboard v4.0 - Supabase Deployment Guide

Complete guide for deploying the Scout Dashboard v4.0 to Supabase with full database setup and synthetic data.

## 🎯 Quick Deployment

### 1. Prerequisites
```bash
# Install dependencies
npm install

# Install Python dependencies (for data generation)
pip install psycopg2-binary
```

### 2. Environment Setup
Environment variables are already configured in:
- `.env.local` (development)
- `.env.production` (production)

**Supabase Project**: `cxzllzyxwpyptfretryc`
**Database**: PostgreSQL with PostGIS enabled

### 3. Deploy Database Schema
```bash
# Deploy complete v4.0 schema to Supabase
npm run deploy:supabase
```

This will:
- ✅ Create all tables (transactions, stores, products, etc.)
- ✅ Set up materialized views for performance
- ✅ Create spatial indexes with PostGIS
- ✅ Configure Row Level Security (RLS)
- ✅ Create API functions for dashboard queries

### 4. Generate and Load Data
```bash
# Generate 50,000 synthetic transactions
npm run generate:data

# Load data into Supabase (manual step via dashboard)
npm run load:data
```

### 5. Test Locally
```bash
# Start development server
npm run dev
```

Visit: `http://localhost:5173`

## 📊 Database Schema Overview

### Core Tables
- **`transactions`** - Transaction headers with metadata
- **`transaction_items`** - Line items with substitution tracking
- **`stores`** - Store locations with coordinates
- **`products`** - SKU catalog with categories
- **`brands`** - Brand master with TBWA client flags
- **`customers`** - Customer profiles and segmentation
- **`audio_transcripts`** - Conversation analysis
- **`video_signals`** - Computer vision data

### Key Features
- ✅ **FMCG & Tobacco focus** - Relevant product categories
- ✅ **Geographic data** - Lat/lng coordinates for mapping
- ✅ **Substitution tracking** - Original vs substituted products
- ✅ **Audio analysis** - Tagalog/English transcriptions
- ✅ **Customer profiling** - Demographics and behavior
- ✅ **Campaign attribution** - Marketing effectiveness

## 🔧 Dashboard Components Status

### ✅ All Components Ready
1. **Transaction Trends** - Time series with filters
2. **Box Plot** - Basket size distribution  
3. **Transaction Heatmap** - Day x Hour patterns
4. **Sankey Diagram** - Product substitution flows
5. **Geographic Heatmap** - Regional performance mapping

### Data Flow
```
Supabase → dashboardService → React Components → Visualizations
```

## 🚀 Production Deployment Options

### Option 1: Vercel (Recommended)
```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

### Option 2: Netlify
```bash
# Build for production
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

### Option 3: Azure Static Web Apps
```bash
# Build for production
npm run build

# Deploy to Azure
az staticwebapp create \
  --name scout-dashboard-v4 \
  --source . \
  --location "East US 2" \
  --resource-group scout-dashboard-rg
```

## 📋 Manual Data Import Steps

Since the data loader requires direct PostgreSQL access, follow these steps to import data:

### 1. Access Supabase SQL Editor
- Go to: https://supabase.com/dashboard/project/cxzllzyxwpyptfretryc/sql

### 2. Enable PostGIS
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 3. Import Sample Data
The deployment script generates `comprehensive_fmcg_tobacco.csv`. Import via:

**Table Editor Method:**
1. Go to Table Editor
2. Select `transactions` table
3. Click "Insert" → "Import from CSV"
4. Upload the generated CSV file

**SQL Method:**
```sql
-- Create temporary table for CSV import
CREATE TEMP TABLE temp_csv_import (
  transaction_id TEXT,
  timestamp TEXT,
  store_id TEXT,
  -- ... other columns
);

-- Copy from CSV (Supabase dashboard upload)
-- Then insert into normalized tables
```

## 🔍 Verification Steps

### 1. Check Database
```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check data counts
SELECT 
  'transactions' as table_name, COUNT(*) as count FROM transactions
UNION ALL
SELECT 'stores', COUNT(*) FROM stores
UNION ALL  
SELECT 'products', COUNT(*) FROM products;
```

### 2. Test API Functions
```sql
-- Test transaction trends
SELECT * FROM get_transaction_trends('NCR', '2024-01-01', '2024-12-31')
LIMIT 10;

-- Test substitution data
SELECT * FROM get_substitution_data('NCR')
LIMIT 10;
```

### 3. Verify Dashboard
- ✅ Components load without errors
- ✅ Data displays in visualizations
- ✅ Filters work correctly
- ✅ Maps show geographic data
- ✅ Sankey shows substitution flows

## 🔒 Security Configuration

### Row Level Security (RLS)
```sql
-- Already configured by deployment script
-- Allows authenticated users to read all data
-- Restricts write access appropriately
```

### API Keys
- **Anon key**: Safe for frontend use
- **Service key**: Server-side only (data loading)

## 🎯 Performance Optimization

### 1. Materialized Views
```sql
-- Refresh views daily
REFRESH MATERIALIZED VIEW mv_hourly_patterns;
REFRESH MATERIALIZED VIEW mv_daily_sales;
REFRESH MATERIALIZED VIEW mv_product_performance;
REFRESH MATERIALIZED VIEW mv_regional_performance;
```

### 2. Indexes
All tables have optimized indexes for:
- ✅ Geographic queries (GIST indexes)
- ✅ Time-based filtering
- ✅ Join performance
- ✅ Full-text search

## 🆘 Troubleshooting

### Common Issues

1. **Connection Errors**
   - Check environment variables
   - Verify Supabase project ID
   - Confirm database is accessible

2. **Schema Errors**
   - Run deployment script again
   - Check PostgreSQL version (should be 14+)
   - Verify PostGIS extension

3. **Data Import Errors**
   - Check CSV format
   - Verify column mapping
   - Use smaller batches for large datasets

4. **Performance Issues**
   - Refresh materialized views
   - Check query execution plans
   - Consider data partitioning for large datasets

## 📞 Support

- **Supabase Dashboard**: https://supabase.com/dashboard/project/cxzllzyxwpyptfretryc
- **Database URL**: https://cxzllzyxwpyptfretryc.supabase.co
- **GitHub Repository**: https://github.com/jgtolentino/bolt-app-hack

## 🎉 Success Metrics

Deployment is complete when:
- ✅ All 8 tables created
- ✅ Sample data loaded (50k+ transactions)
- ✅ Dashboard loads without errors
- ✅ All 5 visualizations working
- ✅ Filters and interactions functional
- ✅ Geographic heatmap displays Philippines data
- ✅ Sankey diagram shows substitution patterns

**Your Scout Dashboard v4.0 is now ready for Philippine sari-sari store analytics!** 🇵🇭