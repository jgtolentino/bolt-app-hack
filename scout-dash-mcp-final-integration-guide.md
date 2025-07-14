# Scout Dash Monorepo - MCP Multi-Database Server Integration Guide

## 🎯 Complete Integration for SQLite, PostgreSQL, and Supabase

This guide consolidates the integration of the MCP server into the Scout Dash monorepo with full multi-database support.

### 1. **Repository Structure Overview**

```
scout-dash-monorepo/
├── apps/                         # 🖥️ Next.js apps
│   ├── web/                      # Scout Dash main app
│   ├── api/                      # API backend
│   └── desktop/                  # Electron app
├── packages/                     # 📦 Internal packages
│   ├── dal/                      # Data Access Layer
│   ├── types/                    # Shared TypeScript types
│   ├── utils/                    # Shared utilities
│   └── ui/                       # UI component library
├── services/                     # 🔧 Backend services
│   ├── mcp-server/              # Multi-database MCP Server (NEW)
│   ├── cron/                     # Scheduled jobs
│   └── worker/                   # Background workers
├── connectors/                   # 🔌 DAL connectors
│   ├── sqlite/
│   ├── supabase/
│   ├── postgres/                 # PostgreSQL connector (NEW)
│   └── mcp/                      # MCP connector (NEW)
├── infra/                        # 🏗️ Infrastructure
│   ├── docker-compose.yml
│   └── k8s/
└── tools/                        # 🛠️ Developer tools
    └── cli/                      # Scout CLI
```

### 2. **Step-by-Step Integration Process**

#### Step 1: Clone and Prepare MCP Server

```bash
# Navigate to monorepo root
cd scout-dash-monorepo

# Clone MCP server
git clone https://github.com/jgtolentino/mcp-sqlite-server.git temp-mcp

# Create service directory structure
mkdir -p services/mcp-server/{src,config,schema,http}
mkdir -p services/mcp-server/src/{databases,tools}

# Copy core files
cp -r temp-mcp/src/* services/mcp-server/src/
cp -r temp-mcp/config/* services/mcp-server/config/
cp temp-mcp/Dockerfile services/mcp-server/
cp temp-mcp/tsconfig.json services/mcp-server/

# Clean up
rm -rf temp-mcp
```

#### Step 2: Create Multi-Database Package Configuration

Create `services/mcp-server/package.json`:

```json
{
  "name": "@scout/mcp-server",
  "version": "1.0.0",
  "description": "Multi-database MCP Server (SQLite, PostgreSQL, Supabase)",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx src/index.ts",
    "dev:sqlite": "DB_TYPE=sqlite tsx src/index.ts",
    "dev:postgres": "DB_TYPE=postgres tsx src/index.ts",
    "dev:supabase": "DB_TYPE=supabase tsx src/index.ts",
    "dev:http": "tsx src/http/server.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "start:http": "node dist/sqlite-http-server-main.js",
    "test": "jest",
    "lint": "eslint src --ext .ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.15.0",
    "sqlite3": "^5.1.6",
    "pg": "^8.11.3",
    "@supabase/supabase-js": "^2.39.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "zod": "^3.22.4",
    "@scout/types": "workspace:*",
    "@scout/utils": "workspace:*"
  },
  "devDependencies": {
    "@types/sqlite3": "^3.1.11",
    "@types/express": "^4.17.21",
    "@types/pg": "^8.10.9",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.8"
  }
}
```

#### Step 3: Create Database Manager Interface

Create `services/mcp-server/src/types/database.ts`:

```typescript
export interface QueryResult {
  rows: any[];
  fields: Array<{
    name: string;
    type: string | number;
  }>;
}

export interface DatabaseManager {
  query(sql: string, params?: any[]): Promise<QueryResult>;
  execute(sql: string, params?: any[]): Promise<{ changes: number }>;
  listTables(): Promise<string[]>;
  getTableInfo(tableName: string): Promise<any[]>;
  close(): Promise<void>;
}

export interface DatabaseConfig {
  type: 'sqlite' | 'postgres' | 'supabase';
  connectionString?: string;
  path?: string;
  url?: string;
  serviceKey?: string;
  anonKey?: string;
}
```

#### Step 4: Create PostgreSQL Manager

Create `services/mcp-server/src/databases/PostgresManager.ts`:

```typescript
import { Pool, PoolClient } from 'pg';
import { DatabaseManager, QueryResult } from '../types/database.js';

export class PostgresManager implements DatabaseManager {
  private pool: Pool;
  
  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  
  async query(sql: string, params?: any[]): Promise<QueryResult> {
    const client = await this.pool.connect();
    try {
      // Convert SQLite ? placeholders to PostgreSQL $1, $2, etc.
      const pgSql = this.convertSqliteToPostgres(sql);
      const result = await client.query(pgSql, params);
      
      return {
        rows: result.rows,
        fields: result.fields.map(f => ({
          name: f.name,
          type: f.dataTypeID
        }))
      };
    } finally {
      client.release();
    }
  }
  
  async execute(sql: string, params?: any[]): Promise<{ changes: number }> {
    const client = await this.pool.connect();
    try {
      const pgSql = this.convertSqliteToPostgres(sql);
      const result = await client.query(pgSql, params);
      return { changes: result.rowCount || 0 };
    } finally {
      client.release();
    }
  }
  
  async listTables(): Promise<string[]> {
    const result = await this.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    return result.rows.map(row => row.tablename);
  }
  
  async getTableInfo(tableName: string): Promise<any[]> {
    const result = await this.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    return result.rows;
  }
  
  async close(): Promise<void> {
    await this.pool.end();
  }

  private convertSqliteToPostgres(sql: string): string {
    // Convert ? placeholders to $1, $2, etc.
    let index = 0;
    return sql.replace(/\?/g, () => `$${++index}`);
  }
}
```

#### Step 5: Create Supabase Manager

Create `services/mcp-server/src/databases/SupabaseManager.ts`:

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseManager, QueryResult } from '../types/database.js';

export class SupabaseManager implements DatabaseManager {
  private client: SupabaseClient;
  private serviceKey: string;
  
  constructor(url: string, serviceKey: string) {
    this.serviceKey = serviceKey;
    this.client = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  
  async query(sql: string, params?: any[]): Promise<QueryResult> {
    // For direct SQL, use the postgres REST endpoint
    const response = await fetch(`${this.client.supabaseUrl}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.serviceKey,
        'Authorization': `Bearer ${this.serviceKey}`
      },
      body: JSON.stringify({ query: sql, params: params || [] })
    });

    if (!response.ok) {
      // If RPC doesn't exist, fall back to using individual table queries
      return this.fallbackQuery(sql, params);
    }

    const data = await response.json();
    return {
      rows: data.rows || [],
      fields: data.fields || []
    };
  }

  private async fallbackQuery(sql: string, params?: any[]): Promise<QueryResult> {
    // Parse simple SELECT queries and use Supabase client
    const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM\s+(\w+)/i);
    if (selectMatch) {
      const [, columns, table] = selectMatch;
      const { data, error } = await this.client
        .from(table)
        .select(columns === '*' ? '*' : columns);
      
      if (error) throw error;
      
      return {
        rows: data || [],
        fields: data?.length ? Object.keys(data[0]).map(name => ({ name, type: 'unknown' })) : []
      };
    }
    
    throw new Error('Complex SQL queries require execute_sql RPC function in Supabase');
  }
  
  async execute(sql: string, params?: any[]): Promise<{ changes: number }> {
    const result = await this.query(sql, params);
    return { changes: 0 }; // Supabase doesn't return row count easily
  }
  
  async listTables(): Promise<string[]> {
    const { data, error } = await this.client
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
      
    if (error) throw error;
    
    return data?.map(row => row.table_name) || [];
  }
  
  async getTableInfo(tableName: string): Promise<any[]> {
    const { data, error } = await this.client
      .from('information_schema.columns')
      .select('*')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .order('ordinal_position');
      
    if (error) throw error;
    
    return data || [];
  }
  
  async close(): Promise<void> {
    // Supabase client doesn't need explicit closing
  }
}
```

#### Step 6: Update Main MCP Server Entry

Update `services/mcp-server/src/index.ts`:

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SQLiteManager } from './sqlite-server.js';
import { PostgresManager } from './databases/PostgresManager.js';
import { SupabaseManager } from './databases/SupabaseManager.js';
import { DatabaseManager } from './types/database.js';

const DB_TYPE = process.env.DB_TYPE || 'sqlite';

async function createDatabaseManager(): Promise<DatabaseManager> {
  switch (DB_TYPE) {
    case 'postgres':
      const pgUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
      if (!pgUrl) throw new Error('POSTGRES_URL or DATABASE_URL not set');
      console.log(`🐘 Connecting to PostgreSQL...`);
      return new PostgresManager(pgUrl);
      
    case 'supabase':
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY required');
      }
      console.log(`☁️  Connecting to Supabase...`);
      return new SupabaseManager(supabaseUrl, supabaseKey);
      
    case 'sqlite':
    default:
      const dbPath = process.env.DB_PATH || './scout.db';
      console.log(`📁 Using SQLite database at ${dbPath}`);
      const sqliteManager = new SQLiteManager({ 
        path: dbPath,
        timeout: 5000,
        maxConnections: 10
      });
      await sqliteManager.connect();
      return sqliteManager;
  }
}

async function main() {
  const transport = new StdioServerTransport();
  const server = new Server(
    {
      name: 'scout-mcp-server',
      version: '1.0.0',
      capabilities: {
        tools: {
          sqlite_query: { 
            description: 'Execute a SELECT query',
            inputSchema: {
              type: 'object',
              properties: {
                sql: { type: 'string' },
                params: { type: 'array', items: { type: 'string' } }
              },
              required: ['sql']
            }
          },
          sqlite_execute: { 
            description: 'Execute INSERT/UPDATE/DELETE query',
            inputSchema: {
              type: 'object',
              properties: {
                sql: { type: 'string' },
                params: { type: 'array', items: { type: 'string' } }
              },
              required: ['sql']
            }
          },
          sqlite_list_tables: { 
            description: 'List all tables',
            inputSchema: { type: 'object', properties: {} }
          },
          sqlite_table_info: { 
            description: 'Get table schema info',
            inputSchema: {
              type: 'object',
              properties: {
                table: { type: 'string' }
              },
              required: ['table']
            }
          }
        }
      }
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  const dbManager = await createDatabaseManager();
  
  // Register tools that work with any database
  server.setRequestHandler('tools/call', async (request) => {
    const { name, arguments: args } = request.params;
    
    try {
      switch (name) {
        case 'sqlite_query':
          const queryResult = await dbManager.query(args.sql, args.params);
          return { content: [{ type: 'text', text: JSON.stringify(queryResult, null, 2) }] };
          
        case 'sqlite_execute':
          const execResult = await dbManager.execute(args.sql, args.params);
          return { content: [{ type: 'text', text: `Executed successfully. Changes: ${execResult.changes}` }] };
          
        case 'sqlite_list_tables':
          const tables = await dbManager.listTables();
          return { content: [{ type: 'text', text: JSON.stringify({ tables }, null, 2) }] };
          
        case 'sqlite_table_info':
          const info = await dbManager.getTableInfo(args.table);
          return { content: [{ type: 'text', text: JSON.stringify({ columns: info }, null, 2) }] };
          
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return { 
        content: [{ 
          type: 'text', 
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }],
        isError: true
      };
    }
  });

  await server.connect(transport);
  
  console.log(`✅ MCP Server started with ${DB_TYPE} database`);
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down MCP Server...');
    await dbManager.close();
    process.exit(0);
  });
}

main().catch(console.error);
```

#### Step 7: Update HTTP Server for Multi-Database

Update `services/mcp-server/src/sqlite-http-server-main.ts`:

```typescript
import { SQLiteHTTPServer } from './sqlite-http-server.js';
import { config } from 'dotenv';
import * as path from 'path';

config();

const DB_TYPE = process.env.DB_TYPE || 'sqlite';
const PORT = parseInt(process.env.PORT || '3000', 10);

// Configuration based on database type
const httpConfig = {
  port: PORT,
  apiKey: process.env.API_KEY,
  database: {
    type: DB_TYPE,
    // SQLite config
    path: process.env.DB_PATH || './data/database.sqlite',
    // PostgreSQL config
    postgresUrl: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    // Supabase config
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_KEY,
    // Common config
    timeout: 5000,
    maxConnections: 10
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
  }
};

async function startServer() {
  console.log(`🚀 Starting MCP HTTP Server with ${DB_TYPE} database...`);
  
  const server = new SQLiteHTTPServer(httpConfig as any);
  await server.start();
  
  console.log(`📊 Database Type: ${DB_TYPE}`);
  console.log(`🌐 API Endpoint: http://localhost:${PORT}`);
  console.log(`🔐 API Key: ${httpConfig.apiKey ? 'Required' : 'Not required'}`);
}

startServer().catch(console.error);
```

#### Step 8: Create MCP Connector

Create `connectors/mcp/src/MCPConnector.ts`:

```typescript
import { BaseConnector, QueryResult, ConnectionConfig } from '@scout/dal';

interface MCPResponse {
  success: boolean;
  data?: any;
  result?: any;
  error?: string;
  details?: any;
}

export class MCPConnector extends BaseConnector {
  private baseUrl: string;
  private apiKey?: string;
  
  constructor(config: ConnectionConfig) {
    super('mcp', config);
    this.baseUrl = config.url || 'http://localhost:3000';
    this.apiKey = config.apiKey;
  }
  
  async connect(): Promise<void> {
    // Test connection
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error('Failed to connect to MCP server');
    }
    this.connected = true;
  }
  
  async disconnect(): Promise<void> {
    this.connected = false;
  }
  
  async query(sql: string, params?: any[]): Promise<QueryResult> {
    const response = await this.makeRequest('/api/query', {
      sql,
      params
    });
    
    return {
      rows: response.data?.rows || [],
      rowCount: response.data?.rows?.length || 0,
      fields: response.data?.fields || []
    };
  }
  
  async execute(sql: string, params?: any[]): Promise<QueryResult> {
    const response = await this.makeRequest('/api/execute', {
      sql,
      params
    });
    
    return {
      rows: [],
      rowCount: response.changes || 0,
      fields: []
    };
  }
  
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/api/tables', null, 'GET');
      return response.success === true;
    } catch {
      return false;
    }
  }

  private async makeRequest(endpoint: string, body?: any, method = 'POST'): Promise<MCPResponse> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }
    
    const options: RequestInit = {
      method,
      headers
    };
    
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, options);
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'MCP request failed');
    }
    
    return data;
  }
}
```

#### Step 9: Update Docker Compose

Update `infra/docker-compose.yml`:

```yaml
version: '3.8'

services:
  # PostgreSQL for local development
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: scout_dash
      POSTGRES_USER: scout
      POSTGRES_PASSWORD: scout123
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./services/mcp-server/schema/postgres:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U scout -d scout_dash"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis for caching
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # MCP Server with multi-database support
  mcp-server:
    build: 
      context: ./services/mcp-server
      dockerfile: Dockerfile
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "3002:3000"
    environment:
      - DB_TYPE=${DB_TYPE:-postgres}
      - DATABASE_URL=postgresql://scout:scout123@postgres:5432/scout_dash
      - POSTGRES_URL=postgresql://scout:scout123@postgres:5432/scout_dash
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - NODE_ENV=development
      - API_KEY=${MCP_API_KEY}
      - PORT=3000
    volumes:
      - ./services/mcp-server:/app
      - ./data/sqlite:/app/data
      - /app/node_modules
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # API service
  api:
    build: ./apps/api
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      mcp-server:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://scout:scout123@postgres:5432/scout_dash
      MCP_SERVER_URL: http://mcp-server:3000
      MCP_API_KEY: ${MCP_API_KEY}
      REDIS_URL: redis://redis:6379
    ports:
      - "3001:3001"

  # Web app
  web:
    build: ./apps/web
    depends_on:
      - api
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
      NEXT_PUBLIC_MCP_URL: http://localhost:3002
    ports:
      - "3000:3000"

volumes:
  postgres_data:
  sqlite_data:
```

#### Step 10: Environment Configuration

Create `.env.example`:

```bash
# Database Type Selection
# Options: sqlite, postgres, supabase
DB_TYPE=postgres

# SQLite Configuration (for local dev)
SQLITE_DB_PATH=./data/sqlite/scout.db

# PostgreSQL Configuration (for local dev)
DATABASE_URL=postgresql://scout:scout123@localhost:5432/scout_dash
POSTGRES_URL=postgresql://scout:scout123@localhost:5432/scout_dash

# Supabase Configuration (for production)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key-here
SUPABASE_ANON_KEY=your-anon-key-here

# MCP Server
MCP_SERVER_URL=http://localhost:3002
MCP_API_KEY=your-secure-api-key-here

# API Configuration
API_PORT=3001
API_HOST=0.0.0.0

# Redis
REDIS_URL=redis://localhost:6379

# Environment
NODE_ENV=development
```

#### Step 11: Migration Commands

Create `scripts/setup-mcp.sh`:

```bash
#!/bin/bash

echo "🚀 Setting up MCP Server in Scout Dash Monorepo"

# Check if we're in the right directory
if [ ! -f "turbo.json" ]; then
    echo "❌ Error: Must run from monorepo root"
    exit 1
fi

# Clone MCP server if not already done
if [ ! -d "services/mcp-server" ]; then
    echo "📦 Cloning MCP server..."
    git clone https://github.com/jgtolentino/mcp-sqlite-server.git temp-mcp
    
    echo "📂 Creating service structure..."
    mkdir -p services/mcp-server/{src,config,schema}
    mkdir -p services/mcp-server/src/{databases,tools,http}
    
    echo "📋 Copying files..."
    cp -r temp-mcp/src/* services/mcp-server/src/
    cp -r temp-mcp/config/* services/mcp-server/config/
    cp temp-mcp/Dockerfile services/mcp-server/
    cp temp-mcp/tsconfig.json services/mcp-server/
    
    echo "🧹 Cleaning up..."
    rm -rf temp-mcp
fi

# Create database managers
echo "💾 Creating database managers..."
cat > services/mcp-server/src/databases/index.ts << 'EOF'
export { PostgresManager } from './PostgresManager.js';
export { SupabaseManager } from './SupabaseManager.js';
export { SQLiteManager } from '../sqlite-server.js';
EOF

# Update package.json
echo "📦 Updating package.json..."
cp scripts/templates/mcp-package.json services/mcp-server/package.json

# Install dependencies
echo "📦 Installing dependencies..."
cd services/mcp-server
pnpm install

# Return to root
cd ../..

echo "✅ MCP Server setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env and configure"
echo "2. Run 'docker-compose up -d postgres' to start PostgreSQL"
echo "3. Run 'pnpm dev' to start all services"
echo "4. Access MCP server at http://localhost:3002"
```

### 3. **Quick Start Guide**

```bash
# 1. Clone and setup
git clone [your-repo] scout-dash-monorepo
cd scout-dash-monorepo
chmod +x scripts/setup-mcp.sh
./scripts/setup-mcp.sh

# 2. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 3. Start services
docker-compose up -d postgres redis
pnpm install
pnpm dev

# 4. Test MCP Server
curl http://localhost:3002/health

# 5. Test with different databases
# SQLite (default)
DB_TYPE=sqlite pnpm --filter @scout/mcp-server dev

# PostgreSQL
DB_TYPE=postgres pnpm --filter @scout/mcp-server dev

# Supabase
DB_TYPE=supabase pnpm --filter @scout/mcp-server dev
```

### 4. **Production Deployment**

#### For Render.com:
```yaml
# render.yaml
services:
  - type: web
    name: scout-mcp-server
    env: docker
    dockerfilePath: ./services/mcp-server/Dockerfile
    envVars:
      - key: DB_TYPE
        value: supabase
      - key: SUPABASE_URL
        fromGroup: supabase
      - key: SUPABASE_SERVICE_KEY
        fromGroup: supabase
    healthCheckPath: /health
    disk:
      name: sqlite-data
      mountPath: /app/data
      sizeGB: 1
```

#### For Kubernetes:
```yaml
# k8s/mcp-server-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mcp-server
  template:
    metadata:
      labels:
        app: mcp-server
    spec:
      containers:
      - name: mcp-server
        image: scout/mcp-server:latest
        env:
        - name: DB_TYPE
          value: "supabase"
        - name: SUPABASE_URL
          valueFrom:
            secretKeyRef:
              name: supabase-secrets
              key: url
        - name: SUPABASE_SERVICE_KEY
          valueFrom:
            secretKeyRef:
              name: supabase-secrets
              key: service-key
        ports:
        - containerPort: 3000
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
```

### 5. **Usage Examples**

#### In Scout Dashboard:
```typescript
// apps/web/src/hooks/useData.ts
import { useDAL } from '@scout/hooks';

export function useTransactionData() {
  const dal = useDAL();
  
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      // DAL automatically routes to MCP server
      const result = await dal.query(`
        SELECT 
          t.*,
          s.store_name,
          p.product_name
        FROM transactions t
        JOIN stores s ON t.store_id = s.store_id
        JOIN products p ON t.product_id = p.product_id
        LIMIT 100
      `);
      return result.rows;
    }
  });
}
```

#### In API Service:
```typescript
// apps/api/src/routes/analytics.ts
import { MCPService } from '../services/MCPService';

export async function GET(req: Request) {
  const mcp = new MCPService();
  
  const metrics = await mcp.getDashboardMetrics();
  
  return Response.json({
    success: true,
    data: metrics
  });
}
```

### 6. **Testing**

```bash
# Test SQLite
curl -X POST http://localhost:3002/api/query \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"sql": "SELECT * FROM sqlite_master WHERE type=\"table\""}'

# Test PostgreSQL
curl -X POST http://localhost:3002/api/query \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"sql": "SELECT tablename FROM pg_tables WHERE schemaname = \"public\""}'

# Test table creation
curl -X POST http://localhost:3002/api/tables \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"name": "test_table", "schema": "id INTEGER PRIMARY KEY, name TEXT"}'
```

### 7. **Benefits of This Integration**

1. **Multi-Database Support**: Seamlessly switch between SQLite (dev), PostgreSQL (staging), and Supabase (production)
2. **Type Safety**: Shared TypeScript types across the monorepo
3. **Unified Development**: All services in one repo with consistent tooling
4. **Production Ready**: Health checks, monitoring, and scaling built-in
5. **MCP Protocol**: AI agents can access any database through standardized interface
6. **Developer Experience**: Hot reload, shared dependencies, unified testing

This completes the full integration of the MCP server into your Scout Dash monorepo with support for SQLite, PostgreSQL, and Supabase!