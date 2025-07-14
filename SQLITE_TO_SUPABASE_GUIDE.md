# SQLite to Supabase Integration Guide

## 🎯 Direct SQLite → Supabase PostgreSQL Migration

This guide shows how to load data from SQLite (local or Render API) directly into your Supabase PostgreSQL database.

## 📊 Current Setup

- **Supabase**: PostgreSQL database with `transactions` table (31k rows)
- **Render SQLite**: Empty database at `https://mcp-sqlite-server-1.onrender.com`
- **Local SQLite**: Desktop app cache database

## 🔄 Method 1: Direct CSV Import (Easiest)

### Step 1: Export from SQLite

```bash
# If you have local SQLite file
sqlite3 scout.db <<EOF
.headers on
.mode csv
.output transactions_export.csv
SELECT * FROM transactions;
.quit
EOF
```

### Step 2: Import to Supabase

1. Go to [Supabase Table Editor](https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/editor)
2. Select `transactions` table
3. Click **Import data from CSV**
4. Upload the CSV file
5. Map columns (they should auto-match)
6. Click **Import**

## 🔄 Method 2: Using Supabase CLI

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Login
supabase login

# Direct import from SQLite
supabase db push --file scout.db --project-ref baqlxgwdfjltivlfmsbr
```

## 🔄 Method 3: Programmatic Sync (Desktop App)

### Update Desktop Data Service

```typescript
// desktop/src/main/services/syncService.ts

import { createClient } from '@supabase/supabase-js';
import Database from 'better-sqlite3';

export class SyncService {
  private supabase;
  private sqlite: Database.Database;

  constructor(sqlitePath: string) {
    this.sqlite = new Database(sqlitePath);
    this.supabase = createClient(
      'https://baqlxgwdfjltivlfmsbr.supabase.co',
      process.env.SUPABASE_SERVICE_KEY!
    );
  }

  async syncSQLiteToSupabase() {
    console.log('🔄 Starting SQLite → Supabase sync...');
    
    // Get all records from SQLite
    const records = this.sqlite.prepare('SELECT * FROM transactions').all();
    
    if (records.length === 0) {
      console.log('No records to sync');
      return;
    }

    // Batch insert into Supabase
    const batchSize = 1000;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      // Transform SQLite data to match Supabase schema
      const transformedBatch = batch.map(record => ({
        ...record,
        // Parse JSON fields
        combo_basket: typeof record.combo_basket === 'string' 
          ? JSON.parse(record.combo_basket) 
          : record.combo_basket,
        // Ensure boolean fields
        suggestion_accepted: Boolean(record.suggestion_accepted),
        substitution_occurred: Boolean(record.substitution_occurred),
        campaign_influenced: Boolean(record.campaign_influenced),
        is_tbwa_client: Boolean(record.is_tbwa_client)
      }));

      const { error } = await this.supabase
        .from('transactions')
        .upsert(transformedBatch, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Batch insert error:', error);
      } else {
        console.log(`✅ Synced ${i + batch.length} / ${records.length} records`);
      }
    }

    console.log('✅ Sync complete!');
  }

  async syncSupabaseToSQLite() {
    console.log('🔄 Starting Supabase → SQLite sync...');
    
    // Get latest records from Supabase
    const { data, error } = await this.supabase
      .from('transactions')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10000);

    if (error) {
      console.error('Supabase fetch error:', error);
      return;
    }

    // Prepare SQLite insert
    const insert = this.sqlite.prepare(`
      INSERT OR REPLACE INTO transactions VALUES (
        @id, @store_id, @timestamp, @time_of_day, @barangay,
        @city, @province, @region, @product_category, @brand_name,
        @sku, @units_per_transaction, @peso_value, @basket_size,
        @combo_basket, @request_mode, @request_type, @suggestion_accepted,
        @gender, @age_bracket, @substitution_occurred, @substitution_from,
        @substitution_to, @substitution_reason, @duration_seconds,
        @campaign_influenced, @handshake_score, @is_tbwa_client,
        @payment_method, @customer_type, @store_type, @economic_class
      )
    `);

    const insertMany = this.sqlite.transaction((records) => {
      for (const record of records) {
        insert.run({
          ...record,
          // Convert JSON back to string for SQLite
          combo_basket: JSON.stringify(record.combo_basket),
          // Convert booleans to integers
          suggestion_accepted: record.suggestion_accepted ? 1 : 0,
          substitution_occurred: record.substitution_occurred ? 1 : 0,
          campaign_influenced: record.campaign_influenced ? 1 : 0,
          is_tbwa_client: record.is_tbwa_client ? 1 : 0
        });
      }
    });

    insertMany(data);
    console.log(`✅ Synced ${data.length} records to SQLite`);
  }
}
```

## 🔄 Method 4: Using pgloader (SQLite → PostgreSQL)

```bash
# Install pgloader
brew install pgloader

# Create pgloader config
cat > sqlite_to_supabase.load <<EOF
LOAD DATABASE
  FROM sqlite:///path/to/scout.db
  INTO postgresql://postgres:[YOUR-PASSWORD]@db.baqlxgwdfjltivlfmsbr.supabase.co:5432/postgres
  
WITH 
  include drop, 
  create tables, 
  create indexes, 
  reset sequences,
  data only

SET work_mem to '256MB',
    maintenance_work_mem to '512MB'

CAST 
  type integer to boolean 
    when (= 1 "true") 
    when (= 0 "false")
  using field-name matching (suggestion_accepted, substitution_occurred, 
                             campaign_influenced, is_tbwa_client)

BEFORE LOAD DO
  \$\$ DROP TABLE IF EXISTS transactions CASCADE; \$\$;
EOF

# Run migration
pgloader sqlite_to_supabase.load
```

## 🔧 Desktop App Integration

### Add sync commands to menu

```typescript
// desktop/src/main/menu.ts
{
  label: 'Sync',
  submenu: [
    {
      label: 'Pull from Supabase',
      click: () => {
        mainWindow?.webContents.send('menu:sync-from-supabase');
      }
    },
    {
      label: 'Push to Supabase',
      click: () => {
        mainWindow?.webContents.send('menu:sync-to-supabase');
      }
    },
    { type: 'separator' },
    {
      label: 'Export to CSV...',
      click: () => {
        mainWindow?.webContents.send('menu:export-csv');
      }
    }
  ]
}
```

### Handle sync in renderer

```typescript
// In your React component
useEffect(() => {
  if (window.scoutAPI) {
    // Listen for sync commands
    const handleSyncFromSupabase = async () => {
      try {
        setIsSyncing(true);
        await window.scoutAPI.dal.syncFromSupabase();
        toast.success('Data synced from Supabase');
        // Refresh data
        await fetchData();
      } catch (error) {
        toast.error('Sync failed: ' + error.message);
      } finally {
        setIsSyncing(false);
      }
    };

    window.addEventListener('menu:sync-from-supabase', handleSyncFromSupabase);
    
    return () => {
      window.removeEventListener('menu:sync-from-supabase', handleSyncFromSupabase);
    };
  }
}, []);
```

## 📊 Data Type Mappings

| SQLite Type | PostgreSQL Type | Notes |
|-------------|-----------------|-------|
| TEXT | TEXT/VARCHAR | Direct mapping |
| INTEGER (0/1) | BOOLEAN | Convert 0/1 to false/true |
| REAL | NUMERIC/DECIMAL | Direct mapping |
| TEXT (JSON) | JSONB | Parse JSON strings |
| TEXT (ISO date) | TIMESTAMPTZ | Parse date strings |

## 🚀 Quick Commands

```bash
# Check Supabase table structure
curl -X GET \
  'https://baqlxgwdfjltivlfmsbr.supabase.co/rest/v1/transactions?limit=1' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Count records
curl -X GET \
  'https://baqlxgwdfjltivlfmsbr.supabase.co/rest/v1/transactions?select=count' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Prefer: count=exact"

# Export from desktop app
npm run export:csv

# Import to Supabase via UI
# https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/editor
```

## ✅ Verification

After sync, verify data integrity:

```sql
-- In Supabase SQL Editor
-- Check record count
SELECT COUNT(*) FROM transactions;

-- Check data distribution
SELECT 
  region,
  COUNT(*) as transaction_count,
  AVG(peso_value) as avg_value
FROM transactions
GROUP BY region
ORDER BY transaction_count DESC;

-- Verify boolean conversions
SELECT 
  COUNT(*) FILTER (WHERE suggestion_accepted = true) as accepted,
  COUNT(*) FILTER (WHERE suggestion_accepted = false) as rejected
FROM transactions;
```

## 🔐 Security Notes

1. **Service Role Key**: Only use in backend/desktop main process
2. **Row Level Security**: Enable RLS after initial import
3. **API Rate Limits**: Batch operations to avoid throttling
4. **Backup**: Always backup before bulk operations

```sql
-- Enable RLS after import
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users can view all transactions" 
  ON transactions FOR SELECT 
  TO authenticated 
  USING (true);
```