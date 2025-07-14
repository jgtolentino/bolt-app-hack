# Supabase MCP Multi-Schema Architecture Implementation Guide

## 🎯 One Supabase, Multiple Projects with Schema Isolation

This guide implements a secure, maintainable architecture for running multiple TBWA projects on a single Supabase instance with proper schema isolation and read-only MCP access for LLM agents.

## 1. Database Schema Architecture

### Schema Structure
```sql
-- Execute as postgres superuser
CREATE SCHEMA IF NOT EXISTS scout_dash;        -- Dashboard 2.0 (TBWA/Scout)
CREATE SCHEMA IF NOT EXISTS creative_insights;  -- Creative KPI store
CREATE SCHEMA IF NOT EXISTS financial_ops;      -- FP&A cube
CREATE SCHEMA IF NOT EXISTS agent_metrics;      -- Agent performance tracking

-- Shared utilities remain in public
-- public schema contains: uuid extension, job queue, shared functions
```

### Schema Ownership Setup
```sql
-- Create schema-specific roles
CREATE ROLE scout_dash_owner;
CREATE ROLE creative_insights_owner;
CREATE ROLE financial_ops_owner;

-- Grant schema ownership
ALTER SCHEMA scout_dash OWNER TO scout_dash_owner;
ALTER SCHEMA creative_insights OWNER TO creative_insights_owner;
ALTER SCHEMA financial_ops OWNER TO financial_ops_owner;

-- Grant usage to service roles
GRANT USAGE ON SCHEMA scout_dash TO scout_dash_owner;
GRANT USAGE ON SCHEMA creative_insights TO creative_insights_owner;
GRANT USAGE ON SCHEMA financial_ops TO financial_ops_owner;
```

## 2. MCP Server Configuration

### 2.1 Update MCP Server for Multi-Schema Support

Create `services/mcp-server/src/databases/SupabaseMultiSchemaManager.ts`:

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseManager, QueryResult } from '../types/database.js';

interface SchemaConfig {
  defaultSchema: string;
  allowedSchemas: string[];
  searchPath: string[];
}

export class SupabaseMultiSchemaManager implements DatabaseManager {
  private client: SupabaseClient;
  private serviceKey: string;
  private schemaConfig: SchemaConfig;
  private isReadOnly: boolean;
  
  constructor(
    url: string, 
    serviceKey: string, 
    schemaConfig: SchemaConfig,
    isReadOnly: boolean = true
  ) {
    this.serviceKey = serviceKey;
    this.schemaConfig = schemaConfig;
    this.isReadOnly = isReadOnly;
    
    this.client = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: schemaConfig.defaultSchema
      }
    });
  }
  
  async query(sql: string, params?: any[]): Promise<QueryResult> {
    // Validate query is read-only
    if (this.isReadOnly && !this.isReadOnlyQuery(sql)) {
      throw new Error('Write operations not allowed in read-only mode');
    }
    
    // Validate schema access
    this.validateSchemaAccess(sql);
    
    // Set search path for this query
    const searchPathSql = `SET search_path TO ${this.schemaConfig.searchPath.join(', ')};`;
    
    try {
      // Execute with search path
      const response = await this.executeRawSQL(
        searchPathSql + '\n' + sql, 
        params
      );
      
      return {
        rows: response.data || [],
        fields: response.fields || []
      };
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }
  
  private isReadOnlyQuery(sql: string): boolean {
    const writeKeywords = [
      'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 
      'ALTER', 'TRUNCATE', 'GRANT', 'REVOKE'
    ];
    
    const upperSql = sql.toUpperCase().trim();
    return !writeKeywords.some(keyword => upperSql.startsWith(keyword));
  }
  
  private validateSchemaAccess(sql: string): void {
    // Extract schema references from SQL
    const schemaPattern = /(?:FROM|JOIN|INTO)\s+(\w+)\./gi;
    let match;
    
    while ((match = schemaPattern.exec(sql)) !== null) {
      const schema = match[1];
      if (!this.schemaConfig.allowedSchemas.includes(schema)) {
        throw new Error(`Access to schema '${schema}' not allowed`);
      }
    }
  }
  
  private async executeRawSQL(sql: string, params?: any[]): Promise<any> {
    // Use Supabase's RPC function for raw SQL execution
    const { data, error } = await this.client.rpc('execute_sql', {
      query: sql,
      params: params || []
    });
    
    if (error) {
      // If RPC doesn't exist, create it first (one-time setup)
      if (error.message.includes('function execute_sql')) {
        await this.createExecuteSQLFunction();
        // Retry
        return this.executeRawSQL(sql, params);
      }
      throw error;
    }
    
    return data;
  }
  
  private async createExecuteSQLFunction(): Promise<void> {
    // This should be done during initial setup
    const createFunction = `
      CREATE OR REPLACE FUNCTION execute_sql(query text, params text[] DEFAULT '{}')
      RETURNS json
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        result json;
      BEGIN
        -- Only allow if called by service role
        IF auth.role() != 'service_role' THEN
          RAISE EXCEPTION 'Unauthorized';
        END IF;
        
        -- Execute dynamic SQL
        EXECUTE query USING params INTO result;
        RETURN result;
      END;
      $$;
    `;
    
    console.warn('Creating execute_sql function - this should be done in migrations');
  }
  
  async execute(sql: string, params?: any[]): Promise<{ changes: number }> {
    if (this.isReadOnly) {
      throw new Error('Execute operations not allowed in read-only mode');
    }
    
    const result = await this.query(sql, params);
    return { changes: 0 }; // Supabase doesn't easily return affected rows
  }
  
  async listTables(): Promise<string[]> {
    const sql = `
      SELECT table_schema || '.' || table_name as full_name
      FROM information_schema.tables
      WHERE table_schema = ANY($1)
      AND table_type = 'BASE TABLE'
      ORDER BY table_schema, table_name
    `;
    
    const result = await this.query(sql, [this.schemaConfig.allowedSchemas]);
    return result.rows.map(row => row.full_name);
  }
  
  async getTableInfo(tableName: string): Promise<any[]> {
    // Parse schema.table format
    const [schema, table] = tableName.includes('.') 
      ? tableName.split('.')
      : [this.schemaConfig.defaultSchema, tableName];
    
    if (!this.schemaConfig.allowedSchemas.includes(schema)) {
      throw new Error(`Access to schema '${schema}' not allowed`);
    }
    
    const sql = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = $1 
      AND table_name = $2
      ORDER BY ordinal_position
    `;
    
    const result = await this.query(sql, [schema, table]);
    return result.rows;
  }
  
  async close(): Promise<void> {
    // Supabase client doesn't need explicit closing
  }
}
```

### 2.2 MCP Server Entry Point with Schema Support

Update `services/mcp-server/src/index.ts`:

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SupabaseMultiSchemaManager } from './databases/SupabaseMultiSchemaManager.js';
import { DatabaseManager } from './types/database.js';

// Parse schema configuration from environment
const SEARCH_PATH = (process.env.SEARCH_PATH || 'public').split(',').map(s => s.trim());
const ALLOWED_SCHEMAS = (process.env.ALLOWED_SCHEMAS || SEARCH_PATH.join(',')).split(',').map(s => s.trim());
const DEFAULT_SCHEMA = process.env.DEFAULT_SCHEMA || SEARCH_PATH[0];
const IS_READ_ONLY = process.env.READ_ONLY !== 'false'; // Default to read-only

async function main() {
  console.log(`🚀 Starting MCP Server`);
  console.log(`📚 Search Path: ${SEARCH_PATH.join(', ')}`);
  console.log(`🔒 Mode: ${IS_READ_ONLY ? 'READ-ONLY' : 'READ-WRITE'}`);
  
  const transport = new StdioServerTransport();
  const server = new Server(
    {
      name: 'supabase-mcp-multi-schema',
      version: '1.0.0',
      capabilities: {
        tools: {
          query: { 
            description: `Execute SELECT/EXPLAIN queries. Schemas: ${ALLOWED_SCHEMAS.join(', ')}`,
            inputSchema: {
              type: 'object',
              properties: {
                sql: { type: 'string', description: 'SQL query to execute' },
                params: { type: 'array', items: { type: 'string' } },
                schema: { 
                  type: 'string', 
                  description: `Target schema (${ALLOWED_SCHEMAS.join(', ')})`,
                  enum: ALLOWED_SCHEMAS
                }
              },
              required: ['sql']
            }
          },
          list_tables: { 
            description: 'List all accessible tables across allowed schemas',
            inputSchema: {
              type: 'object',
              properties: {
                schema: { 
                  type: 'string', 
                  description: 'Filter by specific schema',
                  enum: ALLOWED_SCHEMAS
                }
              }
            }
          },
          table_info: { 
            description: 'Get table schema information',
            inputSchema: {
              type: 'object',
              properties: {
                table: { 
                  type: 'string', 
                  description: 'Table name (can include schema prefix like scout_dash.transactions)'
                }
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

  // Create database manager
  const dbManager = new SupabaseMultiSchemaManager(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      defaultSchema: DEFAULT_SCHEMA,
      allowedSchemas: ALLOWED_SCHEMAS,
      searchPath: SEARCH_PATH
    },
    IS_READ_ONLY
  );
  
  // Register tool handlers
  server.setRequestHandler('tools/call', async (request) => {
    const { name, arguments: args } = request.params;
    
    try {
      switch (name) {
        case 'query': {
          // If schema specified, prepend to search path
          let searchPath = SEARCH_PATH;
          if (args.schema && ALLOWED_SCHEMAS.includes(args.schema)) {
            searchPath = [args.schema, ...SEARCH_PATH.filter(s => s !== args.schema)];
          }
          
          const result = await dbManager.query(args.sql, args.params);
          return { 
            content: [{ 
              type: 'text', 
              text: JSON.stringify({
                schema: args.schema || DEFAULT_SCHEMA,
                searchPath,
                result
              }, null, 2)
            }] 
          };
        }
        
        case 'list_tables': {
          const tables = await dbManager.listTables();
          const filtered = args.schema 
            ? tables.filter(t => t.startsWith(args.schema + '.'))
            : tables;
            
          return { 
            content: [{ 
              type: 'text', 
              text: JSON.stringify({ 
                tables: filtered,
                schemas: ALLOWED_SCHEMAS
              }, null, 2) 
            }] 
          };
        }
        
        case 'table_info': {
          const info = await dbManager.getTableInfo(args.table);
          return { 
            content: [{ 
              type: 'text', 
              text: JSON.stringify({ 
                table: args.table,
                columns: info 
              }, null, 2) 
            }] 
          };
        }
        
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
  
  console.log('✅ MCP Server ready');
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    await dbManager.close();
    process.exit(0);
  });
}

main().catch(console.error);
```

### 2.3 HTTP Server Multi-Schema Support

Update `services/mcp-server/src/sqlite-http-server.ts` to add schema routing:

```typescript
// Add to existing routes
this.app.post('/api/query/:schema?', async (req, res) => {
  try {
    const schema = req.params.schema || DEFAULT_SCHEMA;
    
    // Validate schema access
    if (!ALLOWED_SCHEMAS.includes(schema)) {
      res.status(403).json({ error: `Access to schema '${schema}' not allowed` });
      return;
    }
    
    const params = QuerySchema.parse(req.body);
    
    // Create manager with schema-specific search path
    const manager = new SupabaseMultiSchemaManager(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        defaultSchema: schema,
        allowedSchemas: ALLOWED_SCHEMAS,
        searchPath: [schema, 'public']
      },
      true // Always read-only for HTTP API
    );
    
    const result = await manager.query(params.sql, params.params);
    res.json({ 
      success: true, 
      schema,
      data: result 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: error.errors });
    } else {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Query failed' });
    }
  }
});
```

## 3. Deployment Configuration

### 3.1 Docker Compose for Multi-Schema

```yaml
version: '3.8'

services:
  # Read-only MCP for all LLM agents
  mcp-reader:
    build: ./services/mcp-server
    container_name: supabase-mcp-reader
    ports:
      - "8888:3000"
    environment:
      - NODE_ENV=production
      - DB_TYPE=supabase
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_ANON_KEY} # Use anon key for read-only
      - READ_ONLY=true
      - SEARCH_PATH=scout_dash,public
      - ALLOWED_SCHEMAS=scout_dash,creative_insights,financial_ops,public
      - DEFAULT_SCHEMA=scout_dash
      - API_KEY=${MCP_API_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Writer MCP for Scout Dash (CI/CD only)
  mcp-writer-scout:
    build: ./services/mcp-server
    container_name: supabase-mcp-writer-scout
    ports:
      - "8889:3000"
    environment:
      - NODE_ENV=production
      - DB_TYPE=supabase
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SCOUT_SERVICE_ROLE_KEY}
      - READ_ONLY=false
      - SEARCH_PATH=scout_dash,public
      - ALLOWED_SCHEMAS=scout_dash,public
      - DEFAULT_SCHEMA=scout_dash
      - API_KEY=${SCOUT_WRITER_API_KEY}
    restart: unless-stopped
    profiles: ["writers"] # Only start when needed

  # Writer MCP for Creative Insights (CI/CD only)
  mcp-writer-creative:
    build: ./services/mcp-server
    container_name: supabase-mcp-writer-creative
    ports:
      - "8890:3000"
    environment:
      - NODE_ENV=production
      - DB_TYPE=supabase
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${CREATIVE_SERVICE_ROLE_KEY}
      - READ_ONLY=false
      - SEARCH_PATH=creative_insights,public
      - ALLOWED_SCHEMAS=creative_insights,public
      - DEFAULT_SCHEMA=creative_insights
      - API_KEY=${CREATIVE_WRITER_API_KEY}
    restart: unless-stopped
    profiles: ["writers"]
```

### 3.2 Systemd Service for Production

Create `/etc/systemd/system/supabase-mcp-reader.service`:

```ini
[Unit]
Description=Supabase MCP Reader Service
After=network.target

[Service]
Type=simple
User=mcp
WorkingDirectory=/opt/mcp-server
ExecStart=/usr/bin/node /opt/mcp-server/dist/sqlite-http-server-main.js
Restart=always
RestartSec=10

# Environment
Environment="NODE_ENV=production"
Environment="DB_TYPE=supabase"
Environment="PORT=8888"
Environment="READ_ONLY=true"
Environment="SEARCH_PATH=scout_dash,public"
Environment="ALLOWED_SCHEMAS=scout_dash,creative_insights,financial_ops,public"
EnvironmentFile=/etc/mcp/supabase.env

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/mcp-server/logs

[Install]
WantedBy=multi-user.target
```

### 3.3 Nginx Configuration

```nginx
# /etc/nginx/sites-available/mcp.tbwa.ai
server {
    listen 443 ssl http2;
    server_name mcp.tbwa.ai;

    ssl_certificate /etc/letsencrypt/live/mcp.tbwa.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mcp.tbwa.ai/privkey.pem;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=mcp_limit:10m rate=10r/s;
    limit_req zone=mcp_limit burst=20 nodelay;

    location / {
        proxy_pass http://localhost:8888;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Security headers
        add_header X-Content-Type-Options nosniff;
        add_header X-Frame-Options DENY;
        add_header X-XSS-Protection "1; mode=block";
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:8888/health;
        access_log off;
    }
}
```

## 4. Database Setup Scripts

### 4.1 Initial Schema Setup

Create `migrations/001_create_schemas.sql`:

```sql
-- Run as superuser
BEGIN;

-- Create schemas
CREATE SCHEMA IF NOT EXISTS scout_dash;
CREATE SCHEMA IF NOT EXISTS creative_insights;
CREATE SCHEMA IF NOT EXISTS financial_ops;
CREATE SCHEMA IF NOT EXISTS agent_metrics;

-- Create read-only roles
CREATE ROLE IF NOT EXISTS mcp_reader;
CREATE ROLE IF NOT EXISTS scout_anon;
CREATE ROLE IF NOT EXISTS creative_anon;
CREATE ROLE IF NOT EXISTS financial_anon;

-- Grant schema usage to read-only roles
GRANT USAGE ON SCHEMA scout_dash TO scout_anon, mcp_reader;
GRANT USAGE ON SCHEMA creative_insights TO creative_anon, mcp_reader;
GRANT USAGE ON SCHEMA financial_ops TO financial_anon, mcp_reader;
GRANT USAGE ON SCHEMA public TO mcp_reader;

-- Grant SELECT on all current and future tables
GRANT SELECT ON ALL TABLES IN SCHEMA scout_dash TO scout_anon, mcp_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA creative_insights TO creative_anon, mcp_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA financial_ops TO financial_anon, mcp_reader;

ALTER DEFAULT PRIVILEGES IN SCHEMA scout_dash 
  GRANT SELECT ON TABLES TO scout_anon, mcp_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA creative_insights 
  GRANT SELECT ON TABLES TO creative_anon, mcp_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA financial_ops 
  GRANT SELECT ON TABLES TO financial_anon, mcp_reader;

-- Create service roles with write access
CREATE ROLE IF NOT EXISTS scout_service;
CREATE ROLE IF NOT EXISTS creative_service;
CREATE ROLE IF NOT EXISTS financial_service;

-- Grant full access to service roles for their schemas
GRANT ALL PRIVILEGES ON SCHEMA scout_dash TO scout_service;
GRANT ALL PRIVILEGES ON SCHEMA creative_insights TO creative_service;
GRANT ALL PRIVILEGES ON SCHEMA financial_ops TO financial_service;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA scout_dash TO scout_service;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA creative_insights TO creative_service;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA financial_ops TO financial_service;

ALTER DEFAULT PRIVILEGES IN SCHEMA scout_dash 
  GRANT ALL PRIVILEGES ON TABLES TO scout_service;
ALTER DEFAULT PRIVILEGES IN SCHEMA creative_insights 
  GRANT ALL PRIVILEGES ON TABLES TO creative_service;
ALTER DEFAULT PRIVILEGES IN SCHEMA financial_ops 
  GRANT ALL PRIVILEGES ON TABLES TO financial_service;

COMMIT;
```

### 4.2 RLS Template per Schema

Create `migrations/002_scout_dash_rls.sql`:

```sql
-- Enable RLS on all tables in scout_dash schema
BEGIN;

-- Transactions table
ALTER TABLE scout_dash.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all" ON scout_dash.transactions
  FOR SELECT
  TO scout_anon, mcp_reader
  USING (true);

CREATE POLICY "Service role full access" ON scout_dash.transactions
  FOR ALL
  TO scout_service
  USING (true)
  WITH CHECK (true);

-- Stores table
ALTER TABLE scout_dash.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all" ON scout_dash.stores
  FOR SELECT
  TO scout_anon, mcp_reader
  USING (true);

CREATE POLICY "Service role full access" ON scout_dash.stores
  FOR ALL
  TO scout_service
  USING (true)
  WITH CHECK (true);

-- Products table
ALTER TABLE scout_dash.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all" ON scout_dash.products
  FOR SELECT
  TO scout_anon, mcp_reader
  USING (true);

CREATE POLICY "Service role full access" ON scout_dash.products
  FOR ALL
  TO scout_service
  USING (true)
  WITH CHECK (true);

-- Repeat for all tables...

COMMIT;
```

### 4.3 Execute SQL RPC Function

Create `migrations/003_execute_sql_function.sql`:

```sql
-- Create execute_sql function for MCP server
CREATE OR REPLACE FUNCTION execute_sql(
  query text,
  params text[] DEFAULT '{}'::text[]
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  is_write_query boolean;
BEGIN
  -- Check if it's a write query
  is_write_query := query ~* '^\s*(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE|GRANT|REVOKE)';
  
  -- For read queries, allow mcp_reader role
  IF NOT is_write_query AND (
    auth.role() = 'anon' OR 
    auth.role() = 'authenticated' OR
    current_user = 'mcp_reader'
  ) THEN
    -- Execute read-only query
    EXECUTE query USING params INTO result;
    RETURN result;
  END IF;
  
  -- For write queries, require service_role
  IF is_write_query AND auth.role() = 'service_role' THEN
    EXECUTE query USING params INTO result;
    RETURN result;
  END IF;
  
  -- Otherwise, deny access
  RAISE EXCEPTION 'Unauthorized: % query requires % role', 
    CASE WHEN is_write_query THEN 'Write' ELSE 'Read' END,
    CASE WHEN is_write_query THEN 'service_role' ELSE 'appropriate' END;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION execute_sql TO anon, authenticated, service_role;
```

## 5. Agent Configuration

### 5.1 Claude Desktop Configuration

Update `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "supabase-scout": {
      "command": "node",
      "args": [
        "/opt/mcp-server/dist/index.js"
      ],
      "env": {
        "SUPABASE_URL": "https://cxzllzyxwpyptfretryc.supabase.co",
        "SUPABASE_SERVICE_KEY": "${SUPABASE_ANON_KEY}",
        "READ_ONLY": "true",
        "SEARCH_PATH": "scout_dash,public",
        "ALLOWED_SCHEMAS": "scout_dash,creative_insights,financial_ops,public",
        "DEFAULT_SCHEMA": "scout_dash"
      }
    },
    "supabase-creative": {
      "command": "node",
      "args": [
        "/opt/mcp-server/dist/index.js"
      ],
      "env": {
        "SUPABASE_URL": "https://cxzllzyxwpyptfretryc.supabase.co",
        "SUPABASE_SERVICE_KEY": "${SUPABASE_ANON_KEY}",
        "READ_ONLY": "true",
        "SEARCH_PATH": "creative_insights,public",
        "ALLOWED_SCHEMAS": "creative_insights,scout_dash,public",
        "DEFAULT_SCHEMA": "creative_insights"
      }
    }
  }
}
```

### 5.2 Pulser CLI Integration

```bash
# .pulserrc configuration
mcp:
  servers:
    supa:
      url: https://mcp.tbwa.ai
      headers:
        x-api-key: ${MCP_API_KEY}
      defaultSchema: scout_dash
    supa_creative:
      url: https://mcp.tbwa.ai
      headers:
        x-api-key: ${MCP_API_KEY}
      defaultSchema: creative_insights
```

### 5.3 ChatGPT Custom GPT Configuration

```yaml
openapi: 3.0.0
info:
  title: TBWA Supabase MCP
  version: 1.0.0
servers:
  - url: https://mcp.tbwa.ai
paths:
  /api/query/scout_dash:
    post:
      operationId: queryScoutDash
      summary: Query Scout Dashboard data
      x-search-path: "scout_dash,public"
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                sql:
                  type: string
                  description: SQL query to execute
                params:
                  type: array
                  items:
                    type: string
      responses:
        '200':
          description: Query results
          
  /api/query/creative_insights:
    post:
      operationId: queryCreativeInsights
      summary: Query Creative Insights data
      x-search-path: "creative_insights,public"
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                sql:
                  type: string
                  description: SQL query to execute
                params:
                  type: array
                  items:
                    type: string
      responses:
        '200':
          description: Query results
```

## 6. CI/CD Integration

### 6.1 GitHub Actions for Schema Migrations

Create `.github/workflows/database-migrations.yml`:

```yaml
name: Database Migrations

on:
  push:
    paths:
      - 'migrations/**'
      - '.github/workflows/database-migrations.yml'

jobs:
  migrate-scout-dash:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Scout Dash Migrations
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SCOUT_SERVICE_KEY: ${{ secrets.SCOUT_SERVICE_ROLE_KEY }}
        run: |
          # Start writer MCP for scout_dash
          docker run -d \
            -e SUPABASE_URL=$SUPABASE_URL \
            -e SUPABASE_SERVICE_KEY=$SCOUT_SERVICE_KEY \
            -e READ_ONLY=false \
            -e SEARCH_PATH=scout_dash,public \
            -e DEFAULT_SCHEMA=scout_dash \
            -p 8889:3000 \
            scout/mcp-server:latest
          
          # Wait for service
          sleep 10
          
          # Run migrations
          for file in migrations/scout_dash/*.sql; do
            echo "Running $file"
            curl -X POST http://localhost:8889/api/execute \
              -H "Content-Type: application/json" \
              -H "X-API-Key: ${{ secrets.SCOUT_WRITER_API_KEY }}" \
              -d @"$file"
          done

  migrate-creative-insights:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Creative Insights Migrations
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          CREATIVE_SERVICE_KEY: ${{ secrets.CREATIVE_SERVICE_ROLE_KEY }}
        run: |
          # Similar setup for creative_insights schema
          # ...
```

### 6.2 Deployment Script

Create `scripts/deploy-mcp.sh`:

```bash
#!/bin/bash

# Deploy MCP readers (always-on)
echo "🚀 Deploying MCP readers..."

# Deploy to Render.com
render deploy \
  --service supabase-mcp-reader \
  --env production \
  --build-env "READ_ONLY=true" \
  --build-env "ALLOWED_SCHEMAS=scout_dash,creative_insights,financial_ops,public"

# Or deploy to your VM
ssh mcp.tbwa.ai << 'EOF'
  cd /opt/mcp-server
  git pull
  npm install --production
  npm run build
  sudo systemctl restart supabase-mcp-reader
EOF

echo "✅ MCP readers deployed"

# Writers are only started during CI/CD migrations
echo "📝 Writers are deployed on-demand during migrations"
```

## 7. Monitoring and Observability

### 7.1 Health Check Endpoint

Add to HTTP server:

```typescript
this.app.get('/health/detailed', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    mode: this.isReadOnly ? 'read-only' : 'read-write',
    schemas: {
      allowed: ALLOWED_SCHEMAS,
      default: DEFAULT_SCHEMA,
      searchPath: SEARCH_PATH
    },
    database: {
      connected: false,
      tablesAccessible: []
    }
  };
  
  try {
    // Test database connection
    const tables = await this.dbManager.listTables();
    health.database.connected = true;
    health.database.tablesAccessible = tables.slice(0, 5); // First 5 tables
  } catch (error) {
    health.status = 'degraded';
    health.database.error = error.message;
  }
  
  res.status(health.status === 'ok' ? 200 : 503).json(health);
});
```

### 7.2 Prometheus Metrics

```typescript
import { register, Counter, Histogram, Gauge } from 'prom-client';

const queryCounter = new Counter({
  name: 'mcp_queries_total',
  help: 'Total number of queries executed',
  labelNames: ['schema', 'status']
});

const queryDuration = new Histogram({
  name: 'mcp_query_duration_seconds',
  help: 'Query execution duration',
  labelNames: ['schema'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const activeConnections = new Gauge({
  name: 'mcp_active_connections',
  help: 'Number of active database connections',
  labelNames: ['schema']
});

// Add metrics endpoint
this.app.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
});
```

## 8. Security Best Practices

### 8.1 API Key Rotation

```bash
# Rotate API keys monthly
#!/bin/bash
# rotate-keys.sh

# Generate new keys
NEW_READER_KEY=$(openssl rand -hex 32)
NEW_SCOUT_WRITER_KEY=$(openssl rand -hex 32)
NEW_CREATIVE_WRITER_KEY=$(openssl rand -hex 32)

# Update in your secrets manager
aws secretsmanager update-secret \
  --secret-id mcp/reader-key \
  --secret-string "$NEW_READER_KEY"

# Update environment files
sed -i "s/MCP_API_KEY=.*/MCP_API_KEY=$NEW_READER_KEY/" /etc/mcp/supabase.env

# Restart services
sudo systemctl restart supabase-mcp-reader

echo "✅ Keys rotated. Update all agent configurations!"
```

### 8.2 Query Auditing

```sql
-- Create audit table
CREATE TABLE IF NOT EXISTS public.mcp_query_audit (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp timestamptz DEFAULT now(),
  schema_name text,
  query text,
  params jsonb,
  source_ip inet,
  user_agent text,
  duration_ms integer,
  error text
);

-- Create index for performance
CREATE INDEX idx_mcp_audit_timestamp ON public.mcp_query_audit(timestamp DESC);
CREATE INDEX idx_mcp_audit_schema ON public.mcp_query_audit(schema_name);

-- Retention policy (keep 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.mcp_query_audit 
  WHERE timestamp < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup
SELECT cron.schedule('cleanup-mcp-audit', '0 2 * * *', 'SELECT cleanup_old_audit_logs()');
```

## 9. Testing

### 9.1 Schema Access Tests

```bash
#!/bin/bash
# test-schema-access.sh

echo "Testing schema access controls..."

# Test 1: Scout schema access
curl -X POST https://mcp.tbwa.ai/api/query/scout_dash \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"sql": "SELECT COUNT(*) FROM transactions"}'

# Test 2: Cross-schema query (should work)
curl -X POST https://mcp.tbwa.ai/api/query \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"sql": "SELECT s.*, c.campaign_name FROM scout_dash.stores s LEFT JOIN creative_insights.campaigns c ON s.store_id = c.store_id LIMIT 5"}'

# Test 3: Write query (should fail)
curl -X POST https://mcp.tbwa.ai/api/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"sql": "INSERT INTO scout_dash.test VALUES (1)"}'

# Test 4: Unauthorized schema (should fail)
curl -X POST https://mcp.tbwa.ai/api/query \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MCP_API_KEY" \
  -d '{"sql": "SELECT * FROM auth.users"}'
```

### 9.2 Load Testing

```javascript
// k6 load test
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
  },
};

const schemas = ['scout_dash', 'creative_insights', 'financial_ops'];

export default function () {
  const schema = schemas[Math.floor(Math.random() * schemas.length)];
  
  const payload = JSON.stringify({
    sql: `SELECT COUNT(*) as count FROM ${schema}.transactions WHERE date > CURRENT_DATE - INTERVAL '7 days'`
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': __ENV.MCP_API_KEY,
    },
  };
  
  const res = http.post(
    `https://mcp.tbwa.ai/api/query/${schema}`,
    payload,
    params
  );
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response has data': (r) => JSON.parse(r.body).data !== undefined,
  });
}
```

## 10. Summary

This architecture provides:

1. **Single Supabase Instance** - One cluster, multiple schemas
2. **Schema Isolation** - Each project owns its schema completely
3. **Read-Only MCP** - One always-on reader for all LLM agents
4. **Write Control** - Separate writer MCPs for CI/CD only
5. **Security** - RLS, read-only credentials, schema boundaries
6. **Performance** - Shared connection pooling, efficient queries
7. **Monitoring** - Health checks, metrics, audit logs
8. **Flexibility** - Easy to add new schemas/projects

The key insight is that schema-level separation provides the right balance of isolation and resource sharing for most use cases, while keeping the architecture simple and cost-effective.