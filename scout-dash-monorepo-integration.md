# Scout Dash Monorepo - MCP SQLite Server Integration

## 🎯 Integration Strategy

### 1. **Add MCP Server as a Service (`services/mcp-server/`)**

```
scout-dash-monorepo/
│
├── services/                     # 🔧 Backend services
│   ├── mcp-server/              # NEW: MCP SQLite Server
│   │   ├── src/
│   │   │   ├── index.ts         # Main MCP server
│   │   │   ├── SQLiteManager.ts # SQLite connection manager
│   │   │   ├── tools/           # MCP tool implementations
│   │   │   │   ├── query.ts
│   │   │   │   ├── execute.ts
│   │   │   │   ├── listTables.ts
│   │   │   │   ├── tableInfo.ts
│   │   │   │   └── createTable.ts
│   │   │   └── http/            # HTTP API variant
│   │   │       └── server.ts
│   │   ├── config/
│   │   │   ├── default.json
│   │   │   └── production.json
│   │   ├── schema/              # Database schemas
│   │   │   ├── scout.sql        # Scout dashboard schema
│   │   │   └── retail.sql       # Retail analytics schema
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── api/                     # Existing API service
│       └── ...
```

### 2. **Update Monorepo Structure**

```bash
# Add to the existing structure:
connectors/
├── sqlite/
├── supabase/
├── snowflake/
├── mcp/                         # NEW: MCP connector
│   ├── src/
│   │   ├── MCPConnector.ts      # DAL connector for MCP
│   │   ├── MCPTransport.ts      # Transport layer (stdio/http)
│   │   └── index.ts
│   └── package.json
```

### 3. **Service Package.json (`services/mcp-server/package.json`)**

```json
{
  "name": "@scout/mcp-server",
  "version": "1.0.0",
  "description": "MCP SQLite Server for Scout Dash",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx src/index.ts",
    "dev:http": "tsx src/http/server.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "start:http": "node dist/http/server.js",
    "test": "jest"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.15.0",
    "sqlite3": "^5.1.6",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "zod": "^3.22.4",
    "@scout/types": "workspace:*",
    "@scout/utils": "workspace:*"
  },
  "devDependencies": {
    "@types/sqlite3": "^3.1.11",
    "@types/express": "^4.17.21",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

### 4. **MCP Connector Implementation (`connectors/mcp/src/MCPConnector.ts`)**

```typescript
import { BaseConnector, QueryResult, ConnectionConfig } from '@scout/dal';
import { MCPTransport, TransportType } from './MCPTransport';

export class MCPConnector extends BaseConnector {
  private transport: MCPTransport;
  
  constructor(config: ConnectionConfig) {
    super('mcp', config);
    
    this.transport = new MCPTransport({
      type: config.transportType || 'http',
      url: config.url || 'http://localhost:3002',
      apiKey: config.apiKey
    });
  }
  
  async connect(): Promise<void> {
    await this.transport.connect();
    this.connected = true;
  }
  
  async disconnect(): Promise<void> {
    await this.transport.disconnect();
    this.connected = false;
  }
  
  async query(sql: string, params?: any[]): Promise<QueryResult> {
    const result = await this.transport.call('sqlite_query', {
      query: sql,
      params
    });
    
    return {
      rows: result.rows || [],
      rowCount: result.rows?.length || 0,
      fields: result.columns || []
    };
  }
  
  async execute(sql: string, params?: any[]): Promise<QueryResult> {
    const result = await this.transport.call('sqlite_execute', {
      query: sql,
      params
    });
    
    return {
      rows: [],
      rowCount: result.changes || 0,
      fields: []
    };
  }
  
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.transport.call('sqlite_list_tables', {});
      return Array.isArray(result.tables);
    } catch {
      return false;
    }
  }
}
```

### 5. **Docker Compose Update (`infra/docker-compose.yml`)**

```yaml
version: '3.8'

services:
  # ... existing services ...
  
  mcp-server:
    build: ./services/mcp-server
    ports:
      - "3002:3002"
    environment:
      - DB_PATH=/data/scout.db
      - NODE_ENV=development
      - API_KEY=${MCP_API_KEY}
    volumes:
      - ./data/sqlite:/data
      - ./services/mcp-server:/app
      - /app/node_modules
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 6. **Desktop Integration Update (`apps/desktop/ipc/dal.ts`)**

```typescript
import { DALGateway } from '@scout/dal';
import { MCPConnector } from '@scout/connectors/mcp';
import { SQLiteConnector } from '@scout/connectors/sqlite';
import { SupabaseConnector } from '@scout/connectors/supabase';

export function initializeDAL() {
  const dal = new DALGateway({
    defaultConnector: 'mcp', // Use MCP as default
    healthCheckInterval: 30000
  });

  // Register MCP connector for remote SQLite access
  dal.registerConnector(new MCPConnector({
    id: 'mcp',
    name: 'MCP SQLite Server',
    transportType: 'http',
    url: process.env.MCP_SERVER_URL || 'http://localhost:3002',
    apiKey: process.env.MCP_API_KEY
  }));

  // Local SQLite fallback
  dal.registerConnector(new SQLiteConnector({
    id: 'sqlite-local',
    name: 'Local SQLite',
    dbPath: app.getPath('userData') + '/scout.db'
  }));

  // Supabase cloud option
  dal.registerConnector(new SupabaseConnector({
    id: 'supabase',
    name: 'Supabase Cloud',
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY
  }));

  return dal;
}
```

### 7. **API Integration (`apps/api/src/services/MCPService.ts`)**

```typescript
import { MCPConnector } from '@scout/connectors/mcp';

export class MCPService {
  private connector: MCPConnector;
  
  constructor() {
    this.connector = new MCPConnector({
      transportType: 'http',
      url: process.env.MCP_SERVER_URL || 'http://mcp-server:3002',
      apiKey: process.env.MCP_API_KEY
    });
  }
  
  async getTransactions(filters?: any) {
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
      WHERE 1=1
      ${filters?.startDate ? 'AND t.date >= ?' : ''}
      ${filters?.endDate ? 'AND t.date <= ?' : ''}
      ${filters?.region ? 'AND s.region = ?' : ''}
      ORDER BY t.date DESC
      LIMIT 1000
    `;
    
    const params = [];
    if (filters?.startDate) params.push(filters.startDate);
    if (filters?.endDate) params.push(filters.endDate);
    if (filters?.region) params.push(filters.region);
    
    const result = await this.connector.query(query, params);
    return result.rows;
  }
  
  async getDashboardMetrics() {
    const queries = {
      totalSales: 'SELECT SUM(sales) as total FROM transactions',
      uniqueCustomers: 'SELECT COUNT(DISTINCT customer_id) as count FROM transactions',
      averageBasket: 'SELECT AVG(sales) as average FROM transactions',
      topRegion: `
        SELECT s.region, SUM(t.sales) as total
        FROM transactions t
        JOIN stores s ON t.store_id = s.store_id
        GROUP BY s.region
        ORDER BY total DESC
        LIMIT 1
      `
    };
    
    const results = await Promise.all(
      Object.entries(queries).map(async ([key, query]) => {
        const result = await this.connector.query(query);
        return { key, value: result.rows[0] };
      })
    );
    
    return results.reduce((acc, { key, value }) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, any>);
  }
}
```

### 8. **Environment Configuration (`.env`)**

```bash
# MCP Server Configuration
MCP_SERVER_URL=http://localhost:3002
MCP_API_KEY=your-secure-api-key
MCP_DB_PATH=./data/sqlite/scout.db
MCP_TRANSPORT_TYPE=http

# For production deployment
MCP_SERVER_DEPLOY_URL=https://mcp-sqlite-server-1.onrender.com
```

### 9. **GitHub Actions Workflow Update (`.github/workflows/deploy.yml`)**

```yaml
name: Deploy Scout Dash

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Build all packages
        run: pnpm build
        
      - name: Deploy MCP Server
        run: |
          cd services/mcp-server
          docker build -t scout-mcp-server .
          docker push ${{ secrets.DOCKER_REGISTRY }}/scout-mcp-server:latest
          
      - name: Deploy API
        run: |
          cd apps/api
          docker build -t scout-api .
          docker push ${{ secrets.DOCKER_REGISTRY }}/scout-api:latest
```

### 10. **Development Workflow**

```bash
# Clone the MCP server into the monorepo
cd scout-dash-monorepo
git clone https://github.com/jgtolentino/mcp-sqlite-server.git services/mcp-server-temp

# Move relevant files to proper location
mkdir -p services/mcp-server
cp -r services/mcp-server-temp/src services/mcp-server/
cp -r services/mcp-server-temp/config services/mcp-server/
cp -r services/mcp-server-temp/schema services/mcp-server/
cp services/mcp-server-temp/Dockerfile services/mcp-server/

# Update package.json for monorepo
cd services/mcp-server
# Edit package.json to use workspace dependencies

# Clean up
rm -rf ../mcp-server-temp

# Add to git
git add services/mcp-server
git commit -m "feat: integrate MCP SQLite Server into monorepo"
```

### 11. **Turbo Configuration Update (`turbo.json`)**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true,
      "dependsOn": ["db:setup"]
    },
    "db:setup": {
      "cache": false,
      "outputs": []
    },
    "services/mcp-server#dev": {
      "dependsOn": ["@scout/types#build", "@scout/utils#build"],
      "cache": false,
      "persistent": true,
      "env": ["MCP_DB_PATH", "MCP_API_KEY"]
    }
  }
}
```

### 12. **Benefits of Integration**

1. **Unified Development**: Single repo for all services
2. **Shared Types**: MCP server uses same TypeScript types
3. **Docker Orchestration**: All services run together
4. **CI/CD Integration**: Deploy MCP server with other services
5. **Local Development**: Easy setup with docker-compose
6. **Production Ready**: Health checks, monitoring, scaling

### 13. **Usage in Scout Dash**

```typescript
// In your dashboard component
import { useDAL } from '@scout/hooks';

function DashboardPage() {
  const dal = useDAL();
  
  const [data, setData] = useState([]);
  
  useEffect(() => {
    // DAL automatically uses MCP connector
    dal.query('SELECT * FROM transactions LIMIT 100')
      .then(result => setData(result.rows));
  }, []);
  
  return (
    <TransactionTrendsChart 
      data={data}
      blueprint={blueprint}
    />
  );
}
```

This integration makes the MCP SQLite Server a first-class citizen in the Scout Dash monorepo, with proper type safety, shared dependencies, and seamless deployment alongside other services.