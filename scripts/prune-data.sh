#!/bin/bash

echo "🗑️  Pruning future data (after June 30, 2025)"
echo "============================================"
echo ""
echo "This will remove all transactions after 2025-06-30"
echo "Current data shows transactions up to Dec 31, 2025"
echo ""
echo "Press Enter to continue or Ctrl+C to cancel..."
read -r

# Supabase connection details
SUPABASE_DB_URL="postgresql://postgres.baqlxgwdfjltivlfmsbr:jtipilot2024@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

echo "Executing prune operation..."
psql "$SUPABASE_DB_URL" -f scripts/prune-future-data.sql

echo ""
echo "✅ Pruning complete!"
echo ""
echo "To verify in the dashboard:"
echo "1. Refresh the page"
echo "2. Check that the date range now ends on June 30, 2025"
echo "3. Total transactions should be reduced"
echo "4. Last 30 days will show data from June 2025"