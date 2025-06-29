#!/bin/bash

# Run Supabase Migrations and Seed Data Script
# This script runs all migrations and seeds the database with Philippine retail data

echo "🚀 Starting Supabase migrations and seed process..."

# Check if .env.local or .env exists
if [ -f .env.local ]; then
    ENV_FILE=".env.local"
elif [ -f .env ]; then
    ENV_FILE=".env"
else
    echo "❌ Error: No environment file found!"
    echo "Please create .env.local or .env with your Supabase credentials:"
    echo "VITE_SUPABASE_URL=your_supabase_url"
    echo "VITE_SUPABASE_ANON_KEY=your_anon_key"
    echo "VITE_SUPABASE_SERVICE_KEY=your_service_role_key"
    echo ""
    echo "Or use the legacy format:"
    echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key"
    echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    exit 1
fi

# Load environment variables
export $(cat $ENV_FILE | grep -v '^#' | xargs)

echo "📦 Installing dependencies..."
npm install

echo "🗄️ Running Supabase migrations..."
npx supabase db push

echo "🌱 Seeding database with master data..."
node scripts/seed-database.js

echo "✨ Migration and seed process complete!"
echo ""
echo "📊 You can now:"
echo "1. Check your Supabase dashboard for the data"
echo "2. Run 'npm run dev' to start the application"
echo "3. The first 2000 transactions will include ALL regions and brands"
echo ""
echo "🎯 Coverage guaranteed in first batch:"
echo "- All 6 regions (NCR, Region III, IV-A, VI, VII, XI)"
echo "- All product categories (Beverages, Snacks, Personal Care, Food, Home Care, Tobacco)"
echo "- All brands (50+ unique brands)"
echo "- Realistic distribution patterns"