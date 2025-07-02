#!/bin/bash

# JTI Analytics Dashboard - Clean Migration Script
# This script helps migrate to a fresh repository

echo "🚀 JTI Analytics Dashboard - Clean Migration Tool"
echo "================================================"

# Check if target directory is provided
if [ -z "$1" ]; then
    echo "Usage: ./migrate-to-clean-repo.sh <target-directory>"
    echo "Example: ./migrate-to-clean-repo.sh ~/Documents/jti-analytics-dashboard"
    exit 1
fi

TARGET_DIR="$1"
SOURCE_DIR="$(pwd)"

# Create target directory
echo "📁 Creating target directory: $TARGET_DIR"
mkdir -p "$TARGET_DIR"

# Create project structure
echo "🏗️  Setting up project structure..."
cd "$TARGET_DIR"
mkdir -p src/{components,lib,pages,services,utils,hooks,config,types,features,constants}
mkdir -p public/data
mkdir -p supabase/migrations
mkdir -p data
mkdir -p scripts

# Copy essential source files
echo "📋 Copying application files..."
cp -r "$SOURCE_DIR/src/components" src/
cp -r "$SOURCE_DIR/src/pages" src/
cp -r "$SOURCE_DIR/src/services" src/
cp -r "$SOURCE_DIR/src/hooks" src/
cp -r "$SOURCE_DIR/src/utils" src/
cp -r "$SOURCE_DIR/src/features" src/ 2>/dev/null || true
cp -r "$SOURCE_DIR/src/types" src/ 2>/dev/null || true
cp -r "$SOURCE_DIR/src/constants" src/ 2>/dev/null || true

# Copy core files
cp "$SOURCE_DIR/src/App.tsx" src/
cp "$SOURCE_DIR/src/main.tsx" src/
cp "$SOURCE_DIR/src/index.css" src/
cp "$SOURCE_DIR/src/vite-env.d.ts" src/ 2>/dev/null || true

# Copy lib files
cp "$SOURCE_DIR/src/lib/supabase.ts" src/lib/
cp "$SOURCE_DIR/src/lib/supabaseClient.ts" src/lib/

# Copy config
cp "$SOURCE_DIR/src/config/credentials.ts" src/config/

# Copy configuration files
echo "⚙️  Copying configuration files..."
cp "$SOURCE_DIR/package.json" .
cp "$SOURCE_DIR/tsconfig.json" .
cp "$SOURCE_DIR/tsconfig.app.json" . 2>/dev/null || true
cp "$SOURCE_DIR/tsconfig.node.json" . 2>/dev/null || true
cp "$SOURCE_DIR/vite.config.ts" .
cp "$SOURCE_DIR/tailwind.config.js" .
cp "$SOURCE_DIR/postcss.config.js" .
cp "$SOURCE_DIR/index.html" .
cp "$SOURCE_DIR/vercel.json" .

# Create clean .gitignore
echo "📝 Creating .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Build
dist/
dist-ssr/
*.local
.next/
out/

# Editor
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Testing
coverage/
.nyc_output

# Misc
*.log
.cache
.temp
.tmp
EOF

# Create environment template
echo "🔐 Creating environment template..."
cat > .env.example << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=https://your_project_id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Configuration (Optional)
VITE_OPENAI_API_KEY=
VITE_ANTHROPIC_API_KEY=

# Analytics (Optional)
VITE_GA_TRACKING_ID=

# Environment
VITE_APP_ENV=production
EOF

# Copy JTI data files if they exist
echo "📊 Copying JTI data files..."
cp "$SOURCE_DIR/data/jti-"*.json data/ 2>/dev/null || true

# Create initial schema
echo "🗄️  Creating database schema..."
cat > supabase/migrations/001_initial_schema.sql << 'EOF'
-- JTI Analytics Dashboard Schema
-- Clean production database structure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Stores table
CREATE TABLE stores (
    store_id SERIAL PRIMARY KEY,
    store_name VARCHAR(255) NOT NULL,
    region VARCHAR(100) NOT NULL,
    city_municipality VARCHAR(100),
    barangay VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    store_type VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Continue with rest of schema...
-- (Full schema in PROJECT_MIGRATION_GUIDE.md)
EOF

# Create README
echo "📚 Creating README..."
cat > README.md << 'EOF'
# JTI Analytics Dashboard

Real-time market intelligence platform for JTI Philippines.

## Features

- 📊 Real-time sales analytics
- 🗺️ Geographic performance mapping
- 📈 Competitive intelligence tracking
- 🎯 Consumer behavior insights
- 📱 Mobile-responsive design

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Supabase
- Vercel

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env.local` and fill in your credentials
3. Install dependencies: `npm install`
4. Run development server: `npm run dev`

## Deployment

This project is configured for automatic deployment to Vercel.

---

Built with ❤️ by TBWA Analytics for JTI Philippines
EOF

# Update package.json name
echo "📦 Updating package.json..."
sed -i '' 's/"name": ".*"/"name": "jti-analytics-dashboard"/' package.json 2>/dev/null || \
sed -i 's/"name": ".*"/"name": "jti-analytics-dashboard"/' package.json

echo ""
echo "✅ Migration complete!"
echo ""
echo "📋 Next steps:"
echo "1. cd $TARGET_DIR"
echo "2. git init"
echo "3. Create new GitHub repo: jti-analytics-dashboard"
echo "4. git remote add origin https://github.com/YOUR_USERNAME/jti-analytics-dashboard.git"
echo "5. npm install"
echo "6. Create .env.local with your Supabase credentials"
echo "7. Set up new Supabase project (see PROJECT_MIGRATION_GUIDE.md)"
echo "8. git add . && git commit -m 'Initial commit'"
echo "9. git push -u origin main"
echo "10. Connect to Vercel and deploy!"
echo ""
echo "📖 See PROJECT_MIGRATION_GUIDE.md for detailed instructions"