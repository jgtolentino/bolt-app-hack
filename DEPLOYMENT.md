# 🚀 Scout Dashboard v4.0 Deployment Guide

Complete deployment guide for Scout Dashboard v4.0 with multiple backend options.

## 🎯 Deployment Options

### 1. 🗄️ SQLite (Local Development)
- **Best for**: Local development, demos, offline usage
- **Setup time**: 5 minutes
- **Scaling**: Single user
- **Cost**: Free

### 2. 🌊 Supabase (Recommended for Production)
- **Best for**: Production, team collaboration, cloud analytics
- **Setup time**: 15 minutes
- **Scaling**: Unlimited users, auto-scaling
- **Cost**: Free tier available, pay-as-you-scale

### 3. 🐘 PostgreSQL (Custom Cloud)
- **Best for**: Enterprise, custom infrastructure
- **Setup time**: 30 minutes
- **Scaling**: Manual configuration
- **Cost**: Varies by provider

## 🌊 Supabase Deployment (Recommended)

### Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click **"New Project"**
3. Project settings:
   - **Name**: `scout-dashboard-v4`
   - **Database Password**: Generate secure password
   - **Region**: Choose closest to users
4. Wait for initialization (~2 minutes)

### Step 2: Deploy Database Schema

```bash
# Clone MCP server repository
git clone https://github.com/jgtolentino/mcp-sqlite-server.git
cd mcp-sqlite-server

# Install dependencies
npm install
pip3 install psycopg2-binary requests

# Set up SQLite database with 50k transactions
npm run setup:scout

# Get Supabase credentials from dashboard
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-role-key"

# Deploy to Supabase
npm run deploy:supabase
```

### Step 3: Deploy Dashboard

```bash
# Clone dashboard repository
git clone https://github.com/jgtolentino/bolt-app-hack.git
cd bolt-app-hack

# Install dependencies
npm install

# Configure environment variables
cat > .env.local << EOF
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_BACKEND_TYPE=supabase
EOF

# Build and deploy
npm run build

# Deploy to Vercel
npx vercel --prod
```

### Step 4: Verify Deployment

1. **Check database**: Visit Supabase dashboard → Table Editor
2. **Test dashboard**: Open deployed URL
3. **Verify data**: Should show 50k transactions across 17 Philippine regions

## 🗄️ SQLite Local Deployment

### Quick Start

```bash
# Clone both repositories
git clone https://github.com/jgtolentino/mcp-sqlite-server.git
git clone https://github.com/jgtolentino/bolt-app-hack.git

# Set up MCP SQLite server
cd mcp-sqlite-server
npm install
npm run setup:scout
npm run build

# Start MCP server
npm run start:sqlite &

# Set up dashboard
cd ../bolt-app-hack
npm install

# Configure for SQLite backend
cat > .env.local << EOF
VITE_BACKEND_TYPE=sqlite
VITE_MCP_SERVER_URL=http://localhost:3000
EOF

# Start dashboard
npm run dev
```

Dashboard available at: `http://localhost:5173`

## 🐘 PostgreSQL Custom Deployment

### With Docker

```bash
# Start PostgreSQL with PostGIS
docker run -d \
  --name scout-postgres \
  -e POSTGRES_DB=scout_v4 \
  -e POSTGRES_USER=scout \
  -e POSTGRES_PASSWORD=your-password \
  -p 5432:5432 \
  postgis/postgis:15-3.3

# Deploy schema
cd mcp-sqlite-server
export POSTGRES_URL="postgresql://scout:your-password@localhost:5432/scout_v4"
npm run migrate:postgres

# Start PostgreSQL MCP server
npm run start:postgres
```

### With Cloud Providers

#### AWS RDS

```bash
# Create RDS PostgreSQL instance with PostGIS
aws rds create-db-instance \
  --db-instance-identifier scout-v4-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username scout \
  --master-user-password your-password \
  --allocated-storage 20

# Enable PostGIS extension
psql "postgresql://scout:password@scout-v4-db.region.rds.amazonaws.com:5432/postgres" \
  -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

#### Google Cloud SQL

```bash
# Create Cloud SQL PostgreSQL instance
gcloud sql instances create scout-v4-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

# Enable PostGIS
gcloud sql databases create scout_v4 --instance=scout-v4-db
```

## 📊 Data Configuration

### Environment Variables

```bash
# Backend Type
VITE_BACKEND_TYPE=supabase|sqlite|postgres

# Supabase (if using Supabase)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# PostgreSQL (if using custom PostgreSQL)
VITE_POSTGRES_URL=postgresql://user:pass@host:5432/db

# SQLite (if using local SQLite)
VITE_MCP_SERVER_URL=http://localhost:3000

# Optional Features
VITE_ENABLE_REALTIME=true
VITE_ENABLE_AUTH=false
VITE_MAPBOX_TOKEN=your-mapbox-token
```

### Backend Service Configuration

The dashboard automatically configures the backend based on `VITE_BACKEND_TYPE`:

```typescript
// src/services/dashboardService.ts
let dashboardService;

switch (import.meta.env.VITE_BACKEND_TYPE) {
  case 'supabase':
    dashboardService = new SupabaseDashboardService();
    break;
  case 'postgres':
    dashboardService = new PostgresDashboardService();
    break;
  case 'sqlite':
  default:
    dashboardService = new SQLiteDashboardService();
    break;
}
```

## 🎨 Customization

### Regional Configuration

Update for different countries/regions:

```typescript
// src/utils/regions.ts
export const REGIONS = [
  'NCR', 'Region I', 'Region II', // Philippines
  // or
  'State 1', 'State 2', 'State 3', // Other countries
];
```

### Branding

```typescript
// src/utils/config.ts
export const APP_CONFIG = {
  title: 'Scout Dashboard v4.0',
  subtitle: 'Philippine Sari-Sari Store Analytics',
  logo: '/logo.png',
  primaryColor: '#1e40af',
  region: 'Philippines'
};
```

### Categories and Products

```typescript
// src/utils/categories.ts
export const CATEGORIES = [
  'beverages', 'snacks', 'household', // FMCG
  'tobacco', 'personal_care', 'dairy' // Add your categories
];
```

## 🚀 Production Deployment

### Vercel (Recommended)

```bash
# Connect GitHub repository
npx vercel --prod

# Set environment variables in Vercel dashboard:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - VITE_BACKEND_TYPE=supabase
```

### Netlify

```bash
# Build and deploy
npm run build
npx netlify deploy --prod --dir=dist

# Set environment variables in Netlify dashboard
```

### AWS Amplify

```bash
# Connect repository in AWS Amplify console
# Set build settings:
# Build command: npm run build
# Output directory: dist
# Environment variables: Same as above
```

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 📈 Monitoring

### Supabase Analytics

- **Database Usage**: Supabase dashboard → Settings → Usage
- **API Requests**: Real-time API monitoring
- **Query Performance**: PostgreSQL query analyzer

### Application Monitoring

```typescript
// src/utils/analytics.ts
import { supabase } from '../lib/supabase';

// Track page views
export const trackPageView = (page: string) => {
  supabase.from('analytics_events').insert({
    event_type: 'page_view',
    page_name: page,
    timestamp: new Date().toISOString()
  });
};

// Track user interactions
export const trackEvent = (event: string, metadata?: any) => {
  supabase.from('analytics_events').insert({
    event_type: event,
    metadata,
    timestamp: new Date().toISOString()
  });
};
```

### Performance Monitoring

```typescript
// src/utils/performance.ts
export const measureQueryTime = async (queryName: string, queryFn: () => Promise<any>) => {
  const start = performance.now();
  const result = await queryFn();
  const duration = performance.now() - start;
  
  console.log(`Query ${queryName} took ${duration.toFixed(2)}ms`);
  
  // Optional: Send to monitoring service
  if (duration > 1000) {
    console.warn(`Slow query detected: ${queryName}`);
  }
  
  return result;
};
```

## 🔧 Troubleshooting

### Common Issues

#### Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Supabase Connection Issues
```bash
# Test connection
curl -H "apikey: your-anon-key" \
     "https://your-project.supabase.co/rest/v1/stores?select=count"
```

#### Performance Issues
```sql
-- Check query performance in Supabase
EXPLAIN ANALYZE SELECT * FROM v_transaction_details LIMIT 100;

-- Refresh materialized views
SELECT refresh_analytics_views();
```

### Environment-Specific Issues

#### Development
- **CORS**: Supabase automatically handles CORS for development
- **Hot Reload**: Vite development server supports hot reload
- **Environment Variables**: Use `.env.local` for local overrides

#### Production
- **Environment Variables**: Set in deployment platform dashboard
- **Build Optimization**: Vite automatically optimizes for production
- **CDN**: Use Vercel/Netlify CDN for static asset delivery

## 📚 Documentation

- **MCP Server**: [GitHub Repository](https://github.com/jgtolentino/mcp-sqlite-server)
- **Dashboard**: [GitHub Repository](https://github.com/jgtolentino/bolt-app-hack)
- **Supabase**: [Documentation](https://supabase.com/docs)
- **Vite**: [Build Tool Docs](https://vitejs.dev)
- **React**: [Component Library](https://react.dev)

---

**🎉 Your Scout Dashboard v4.0 is ready for production with 50k Philippine retail transactions!**