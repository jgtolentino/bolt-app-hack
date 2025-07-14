# Scout Dash Monorepo - MCP Server Integration (PostgreSQL/Supabase)

## 🎯 Corrected Integration for PostgreSQL/Supabase

### 1. **Multi-Database MCP Server (`services/mcp-server/`)**

```
scout-dash-monorepo/
│
├── services/
│   ├── mcp-server/              # Multi-database MCP Server
│   │   ├── src/
│   │   │   ├── index.ts         # Main MCP server entry
│   │   │   ├── databases/       # Database-specific implementations
│   │   │   │   ├── SQLiteManager.ts
│   │   │   │   ├── PostgresManager.ts    # PostgreSQL support
│   │   │   │   └── SupabaseManager.ts    # Supabase support
│   │   │   ├── tools/           # MCP tools (work with all DBs)
│   │   │   │   ├── query.ts
│   │   │   │   ├── execute.ts
│   │   │   │   └── schema.ts
│   │   │   └── http/
│   │   │       └── server.ts    # HTTP API server
│   │   ├── config/
│   │   │   ├── default.json
│   │   │   ├── postgres.json    # PostgreSQL config
│   │   │   └── supabase.json    # Supabase config
│   │   ├── Dockerfile
│   │   └── package.json
```

### 2. **Corrected Package.json (`services/mcp-server/package.json`)**

```json
{
  "name": "@scout/mcp-server",
  "version": "1.0.0",
  "description": "Multi-database MCP Server (SQLite, PostgreSQL, Supabase)",
  "scripts": {
    "dev": "tsx src/index.ts",
    "dev:postgres": "DB_TYPE=postgres tsx src/index.ts",
    "dev:supabase": "DB_TYPE=supabase tsx src/index.ts",
    "dev:http": "tsx src/http/server.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "start:postgres": "DB_TYPE=postgres node dist/index.js",
    "start:supabase": "DB_TYPE=supabase node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.15.0",
    "sqlite3": "^5.1.6",
    "pg": "^8.11.3",
    "@supabase/supabase-js": "^2.39.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "zod": "^3.22.4",
    "@scout/types": "workspace:*"
  }
}
```

### 3. **PostgreSQL Manager (`services/mcp-server/src/databases/PostgresManager.ts`)**

```typescript
import { Pool, PoolClient } from 'pg';
import { DatabaseManager, QueryResult } from '../types';

export class PostgresManager implements DatabaseManager {
  private pool: Pool;
  
  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  
  async query(sql: string, params?: any[]): Promise<QueryResult> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
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
      const result = await client.query(sql, params);
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
}
```

### 4. **Supabase Manager (`services/mcp-server/src/databases/SupabaseManager.ts`)**

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseManager, QueryResult } from '../types';

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
    // Supabase uses RPC for raw SQL queries
    const { data, error } = await this.client.rpc('execute_sql', {
      query: sql,
      params: params || []
    });
    
    if (error) throw error;
    
    return {
      rows: data.rows || [],
      fields: data.fields || []
    };
  }
  
  async execute(sql: string, params?: any[]): Promise<{ changes: number }> {
    const { data, error } = await this.client.rpc('execute_sql', {
      query: sql,
      params: params || []
    });
    
    if (error) throw error;
    
    return { changes: data.rowCount || 0 };
  }
  
  async listTables(): Promise<string[]> {
    const { data, error } = await this.client
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
      
    if (error) throw error;
    
    return data.map(row => row.table_name);
  }
  
  async getTableInfo(tableName: string): Promise<any[]> {
    const { data, error } = await this.client
      .from('information_schema.columns')
      .select('*')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .order('ordinal_position');
      
    if (error) throw error;
    
    return data;
  }
  
  async close(): Promise<void> {
    // Supabase client doesn't need explicit closing
  }
}
```

### 5. **Updated Docker Compose (`infra/docker-compose.yml`)**

```yaml
version: '3.8'

services:
  # PostgreSQL for local development
  postgres:
    image: postgres:15
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
      test: ["CMD-SHELL", "pg_isready -U scout"]
      interval: 10s
      timeout: 5s
      retries: 5

  # MCP Server with PostgreSQL
  mcp-server:
    build: ./services/mcp-server
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "3002:3002"
    environment:
      - DB_TYPE=postgres
      - POSTGRES_URL=postgresql://scout:scout123@postgres:5432/scout_dash
      - NODE_ENV=development
      - API_KEY=${MCP_API_KEY}
    volumes:
      - ./services/mcp-server:/app
      - /app/node_modules
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # API service connects to PostgreSQL
  api:
    build: ./apps/api
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    environment:
      DATABASE_URL: postgresql://scout:scout123@postgres:5432/scout_dash
      MCP_SERVER_URL: http://mcp-server:3002
      REDIS_URL: redis://redis:6379
    ports:
      - "3001:3001"
```

### 6. **Environment Configuration (`.env`)**

```bash
# Database Type Selection
DB_TYPE=postgres  # Options: sqlite, postgres, supabase

# PostgreSQL Configuration (Local)
POSTGRES_URL=postgresql://scout:scout123@localhost:5432/scout_dash

# Supabase Configuration (Production)
SUPABASE_URL=https://baqlxgwdfjltivlfmsbr.supabase.co
SUPABASE_SERVICE_KEY=your-service-key-here
SUPABASE_ANON_KEY=your-anon-key-here

# MCP Server
MCP_SERVER_URL=http://localhost:3002
MCP_API_KEY=your-secure-api-key

# For production
PRODUCTION_DB_TYPE=supabase
```

### 7. **MCP Server Entry Point (`services/mcp-server/src/index.ts`)**

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SQLiteManager } from './databases/SQLiteManager.js';
import { PostgresManager } from './databases/PostgresManager.js';
import { SupabaseManager } from './databases/SupabaseManager.js';
import { DatabaseManager } from './types.js';

const DB_TYPE = process.env.DB_TYPE || 'sqlite';

async function createDatabaseManager(): Promise<DatabaseManager> {
  switch (DB_TYPE) {
    case 'postgres':
      const pgUrl = process.env.POSTGRES_URL;
      if (!pgUrl) throw new Error('POSTGRES_URL not set');
      return new PostgresManager(pgUrl);
      
    case 'supabase':
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY required');
      }
      return new SupabaseManager(supabaseUrl, supabaseKey);
      
    case 'sqlite':
    default:
      const dbPath = process.env.DB_PATH || './scout.db';
      return new SQLiteManager(dbPath);
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
          query: { db: DB_TYPE },
          execute: { db: DB_TYPE },
          listTables: { db: DB_TYPE },
          tableInfo: { db: DB_TYPE }
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
    
    switch (name) {
      case 'query':
        return await dbManager.query(args.query, args.params);
      case 'execute':
        return await dbManager.execute(args.query, args.params);
      case 'listTables':
        return { tables: await dbManager.listTables() };
      case 'tableInfo':
        return { info: await dbManager.getTableInfo(args.table) };
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

  await server.connect(transport);
  
  process.on('SIGINT', async () => {
    await dbManager.close();
    process.exit(0);
  });
}

main().catch(console.error);
```

### 8. **API Service Integration (`apps/api/src/services/DataService.ts`)**

```typescript
import { MCPConnector } from '@scout/connectors/mcp';
import { PrismaClient } from '@prisma/client';

export class DataService {
  private mcp: MCPConnector;
  private prisma: PrismaClient;
  
  constructor() {
    // MCP can connect to PostgreSQL via MCP Server
    this.mcp = new MCPConnector({
      transportType: 'http',
      url: process.env.MCP_SERVER_URL || 'http://mcp-server:3002',
      apiKey: process.env.MCP_API_KEY
    });
    
    // Direct PostgreSQL connection via Prisma
    this.prisma = new PrismaClient();
  }
  
  async getTransactions(filters?: any) {
    // Option 1: Use MCP Server (works with any DB type)
    if (process.env.USE_MCP === 'true') {
      const query = `
        SELECT 
          t.*,
          s.store_name,
          s.region,
          p.product_name,
          p.brand
        FROM transactions t
        JOIN stores s ON t.store_id = s.store_id
        JOIN products p ON t.product_id = p.product_id
        WHERE ($1::date IS NULL OR t.date >= $1)
        AND ($2::date IS NULL OR t.date <= $2)
        AND ($3::text IS NULL OR s.region = $3)
        ORDER BY t.date DESC
        LIMIT 1000
      `;
      
      const result = await this.mcp.query(query, [
        filters?.startDate || null,
        filters?.endDate || null,
        filters?.region || null
      ]);
      
      return result.rows;
    }
    
    // Option 2: Use Prisma ORM (PostgreSQL only)
    return await this.prisma.transaction.findMany({
      where: {
        date: {
          gte: filters?.startDate,
          lte: filters?.endDate
        },
        store: {
          region: filters?.region
        }
      },
      include: {
        store: true,
        product: true
      },
      orderBy: { date: 'desc' },
      take: 1000
    });
  }
}
```

### 9. **Production Deployment (Supabase)**

```typescript
// apps/api/src/config/database.ts
export const getDatabaseConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    // Use Supabase in production
    return {
      type: 'supabase',
      url: process.env.SUPABASE_URL!,
      serviceKey: process.env.SUPABASE_SERVICE_KEY!,
      anonKey: process.env.SUPABASE_ANON_KEY!
    };
  }
  
  // Use local PostgreSQL in development
  return {
    type: 'postgres',
    connectionString: process.env.DATABASE_URL || 
      'postgresql://scout:scout123@localhost:5432/scout_dash'
  };
};
```

### 10. **Migration Scripts**

```bash
# Clone and integrate
cd scout-dash-monorepo
git clone https://github.com/jgtolentino/mcp-sqlite-server.git temp-mcp

# Create service directory
mkdir -p services/mcp-server/{src,config,schema}

# Copy multi-database support files
cp -r temp-mcp/src/* services/mcp-server/src/
cp -r temp-mcp/config/* services/mcp-server/config/
cp -r temp-mcp/schema/* services/mcp-server/schema/
cp temp-mcp/Dockerfile services/mcp-server/

# Clean up
rm -rf temp-mcp

# Update for monorepo
cd services/mcp-server
# Create proper package.json with workspace deps

# Initialize PostgreSQL schema
docker-compose up -d postgres
docker exec -i scout-dash-postgres-1 psql -U scout scout_dash < schema/postgres/schema.sql

# Start all services
cd ../..
pnpm install
pnpm dev
```

### 11. **Key Differences from SQLite-only**

1. **Multi-Database Support**: MCP Server supports SQLite, PostgreSQL, and Supabase
2. **Production Ready**: Supabase provides managed PostgreSQL with built-in auth
3. **Connection Pooling**: PostgreSQL uses connection pools for performance
4. **SQL Differences**: PostgreSQL SQL syntax (e.g., `$1` instead of `?` for params)
5. **Schema Management**: Use Prisma migrations for PostgreSQL schema changes

This corrected integration properly handles the PostgreSQL/Supabase nature of the system while maintaining backward compatibility with SQLite for local development.