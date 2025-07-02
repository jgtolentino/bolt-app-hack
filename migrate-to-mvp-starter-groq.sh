#!/bin/bash

# Migrate JTI Analytics Dashboard to mvp-starter-groq repository
# This script transfers the analytics dashboard to the existing mvp-starter-groq repo

echo "🚀 JTI Analytics Dashboard Migration to mvp-starter-groq"
echo "======================================================="

# Set paths
SOURCE_DIR="/Users/tbwa/Documents/GitHub/bolt-app-hack"
TARGET_DIR="/Users/tbwa/Documents/GitHub/mvp-starter-groq"

# Navigate to target directory
cd "$TARGET_DIR" || exit 1

# Create branch for JTI dashboard
echo "📌 Creating new branch for JTI dashboard..."
git checkout -b feature/jti-analytics-dashboard

# Clean existing files (keep git and essential configs)
echo "🧹 Cleaning existing files..."
find . -maxdepth 1 -not -name '.git' -not -name '.gitignore' -not -name '.' -not -name '..' -exec rm -rf {} \;

# Create project structure
echo "🏗️  Setting up project structure..."
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

# Copy public assets
cp -r "$SOURCE_DIR/public/data" public/ 2>/dev/null || true

# Create .gitignore
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

# JTI specific
data/mock-*.json
data/test-*.json
*.bak
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

# Copy JTI data files
echo "📊 Copying JTI-specific data..."
cp "$SOURCE_DIR/data/jti-"*.json data/ 2>/dev/null || true
cp "$SOURCE_DIR/data/jti-"*.md data/ 2>/dev/null || true

# Create README
echo "📚 Creating README..."
cat > README.md << 'EOF'
# JTI Analytics Dashboard

Real-time market intelligence platform for Japan Tobacco International Philippines.

## Overview

This dashboard provides comprehensive analytics for JTI's operations in the Philippine market, including:
- Real-time sales tracking
- Competitive intelligence
- Geographic performance analysis
- Consumer behavior insights
- Brand switching patterns

## Features

### 📊 Analytics
- **Sales Dashboard**: Real-time sales metrics and trends
- **Geographic Analysis**: Interactive maps showing regional performance
- **Product Performance**: SKU-level analytics with market share tracking
- **Consumer Insights**: Purchase patterns and brand loyalty analysis

### 🎯 JTI-Specific Features
- Winston, Mevius, Camel, Mighty brand tracking
- Competitor analysis (Marlboro, Fortune)
- Sari-sari store performance metrics
- Sin tax impact modeling

### 🔧 Technical Features
- React 18 + TypeScript
- Vite for fast development
- Tailwind CSS for styling
- Supabase for real-time data
- AI-powered insights (OpenAI/Anthropic)

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone and install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
\`\`\`

3. Run development server:
\`\`\`bash
npm run dev
\`\`\`

## Deployment

### Vercel (Recommended)
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy with automatic CI/CD

### Manual Deployment
\`\`\`bash
npm run build
# Deploy dist/ folder to your hosting service
\`\`\`

## Project Structure

\`\`\`
src/
├── components/     # Reusable UI components
├── pages/         # Route pages
├── services/      # API and data services
├── hooks/         # Custom React hooks
├── utils/         # Utility functions
├── lib/           # External library configs
└── config/        # App configuration

data/
├── jti-actual-skus-philippines.json
└── jti-sample-data.json

supabase/
└── migrations/    # Database schema
\`\`\`

## Security

- All API keys should be kept in environment variables
- Row Level Security (RLS) enabled on all tables
- Authentication required for write operations

## Support

For issues or questions, contact the TBWA Analytics team.

---

Built with ❤️ by TBWA Analytics for JTI Philippines
EOF

# Update package.json
echo "📦 Updating package.json..."
# Use Node.js to properly update JSON
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.name = 'jti-analytics-dashboard';
pkg.version = '1.0.0';
pkg.description = 'Real-time market intelligence dashboard for JTI Philippines';
pkg.author = 'TBWA Analytics';
pkg.private = true;
// Remove any mvp-starter-groq specific scripts
delete pkg.scripts['groq:dev'];
delete pkg.scripts['groq:build'];
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

# Create initial database schema
echo "🗄️  Creating database schema..."
cat > supabase/migrations/001_jti_schema.sql << 'EOF'
-- JTI Analytics Dashboard Schema
-- Production database structure for tobacco industry analytics

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Stores table
CREATE TABLE IF NOT EXISTS stores (
    store_id SERIAL PRIMARY KEY,
    store_name VARCHAR(255) NOT NULL,
    region VARCHAR(100) NOT NULL,
    city_municipality VARCHAR(100),
    barangay VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    store_type VARCHAR(50) CHECK (store_type IN ('sari-sari', 'grocery', 'convenience', 'supermarket', 'mini-mart')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Brands table (JTI and competitors)
CREATE TABLE IF NOT EXISTS brands (
    brand_id SERIAL PRIMARY KEY,
    brand_name VARCHAR(100) NOT NULL UNIQUE,
    company_name VARCHAR(100),
    is_jti BOOLEAN DEFAULT false,
    is_competitor BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert JTI brands
INSERT INTO brands (brand_name, company_name, is_jti) VALUES
('Winston', 'JTI Philippines', true),
('Mevius', 'JTI Philippines', true),
('Camel', 'JTI Philippines', true),
('Mighty', 'JTI Philippines', true),
('Marvels', 'JTI Philippines', true);

-- Insert competitor brands
INSERT INTO brands (brand_name, company_name, is_competitor) VALUES
('Marlboro', 'Philip Morris', true),
('Fortune', 'Philip Morris', true),
('Hope', 'Hope Luxury', true),
('More', 'Associated Anglo American', true);

-- Products table with JTI SKUs
CREATE TABLE IF NOT EXISTS products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    brand_id INTEGER REFERENCES brands(brand_id),
    category_name VARCHAR(100) DEFAULT 'Tobacco',
    sku VARCHAR(100) UNIQUE,
    unit_price DECIMAL(10, 2),
    package_size VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id INTEGER REFERENCES stores(store_id),
    transaction_datetime TIMESTAMP NOT NULL,
    customer_id INTEGER,
    payment_method VARCHAR(50),
    total_amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transaction items
CREATE TABLE IF NOT EXISTS transaction_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(product_id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_transactions_datetime ON transactions(transaction_datetime);
CREATE INDEX idx_transactions_store ON transactions(store_id);
CREATE INDEX idx_transaction_items_transaction ON transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_product ON transaction_items(product_id);
CREATE INDEX idx_stores_region ON stores(region);
CREATE INDEX idx_products_brand ON products(brand_id);

-- Enable RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read" ON stores FOR SELECT USING (true);
CREATE POLICY "Public read" ON brands FOR SELECT USING (true);
CREATE POLICY "Public read" ON products FOR SELECT USING (true);
CREATE POLICY "Public read" ON transactions FOR SELECT USING (true);
CREATE POLICY "Public read" ON transaction_items FOR SELECT USING (true);
EOF

echo ""
echo "✅ Migration complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Review changes:"
echo "   cd $TARGET_DIR"
echo "   git status"
echo ""
echo "2. Install dependencies:"
echo "   npm install"
echo ""
echo "3. Set up Supabase:"
echo "   - Create new Supabase project for JTI"
echo "   - Run migration: supabase/migrations/001_jti_schema.sql"
echo "   - Copy credentials to .env.local"
echo ""
echo "4. Commit and push:"
echo "   git add ."
echo "   git commit -m 'feat: add JTI Analytics Dashboard'"
echo "   git push origin feature/jti-analytics-dashboard"
echo ""
echo "5. Deploy to Vercel:"
echo "   - Connect mvp-starter-groq repo"
echo "   - Set environment variables"
echo "   - Deploy feature branch"
echo ""
echo "📊 Your JTI Analytics Dashboard is ready in mvp-starter-groq!"