#!/bin/bash

echo "📊 Setting up validation data"
echo "============================"
echo ""
echo "This will:"
echo "1. Prune data to June 30, 2024 - June 30, 2025 (1 year)"
echo "2. Focus on last 30 days for validation metrics"
echo "3. Update labels to show 'Sample Data'"
echo ""
echo "Press Enter to continue or Ctrl+C to cancel..."
read -r

# Supabase connection
SUPABASE_DB_URL="postgresql://postgres.baqlxgwdfjltivlfmsbr:jtipilot2024@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

echo "🗑️  Pruning data to 1-year range..."
psql "$SUPABASE_DB_URL" -f scripts/prune-to-one-year.sql

echo ""
echo "✅ Data pruning complete!"
echo ""
echo "📈 New data structure:"
echo "- Date Range: June 30, 2024 - June 30, 2025 (365 days)"
echo "- Last 30 days: June 1-30, 2025 for metrics validation"
echo "- Dashboard now shows 'Sample Data' instead of 'Real Data'"
echo ""
echo "To verify:"
echo "1. Refresh the dashboard"
echo "2. Check the date range in overview"
echo "3. Last 30 days metrics should be from June 2025"