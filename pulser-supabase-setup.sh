#!/bin/bash
set -euo pipefail

# Pulser + Supabase MCP Setup Script
# Sets up CLI agents for all TBWA schemas

echo "🚀 Setting up Pulser Supabase Agents"
echo "===================================="
echo ""

# Create agents directory structure
mkdir -p packages/agents
mkdir -p scripts

# 1. Create Scout Dashboard Agent
cat > packages/agents/scout_reader.yaml << 'EOF'
name: scout_reader
codename: scout
description: Query Scout Dashboard retail analytics data
endpoint: http://localhost:8888
headers:
  X-API-Key: ${MCP_API_KEY}
  Content-Type: application/json
tools:
  - name: query
    method: POST
    path: /api/query
    description: Query scout_dash schema
    input: |
      {
        "sql": "{{input}}",
        "params": [],
        "search_path": "scout_dash,public"
      }
  - name: explain
    method: POST
    path: /api/query
    description: Explain query plan
    input: |
      {
        "sql": "EXPLAIN ANALYZE {{input}}",
        "params": [],
        "search_path": "scout_dash,public"
      }
  - name: tables
    method: GET
    path: /api/tables
    description: List all tables in scout_dash
    headers:
      X-Schema: scout_dash
EOF

# 2. Create HR Agent
cat > packages/agents/hr_reader.yaml << 'EOF'
name: hr_reader
codename: hr
description: Query HR administration data
endpoint: http://localhost:8888
headers:
  X-API-Key: ${MCP_API_KEY}
  Content-Type: application/json
tools:
  - name: query
    method: POST
    path: /api/query
    description: Query hr_admin schema
    input: |
      {
        "sql": "{{input}}",
        "params": [],
        "search_path": "hr_admin,public"
      }
  - name: explain
    method: POST
    path: /api/query
    description: Explain query plan
    input: |
      {
        "sql": "EXPLAIN ANALYZE {{input}}",
        "params": [],
        "search_path": "hr_admin,public"
      }
  - name: employees
    method: POST
    path: /api/query
    description: Quick employee lookup
    input: |
      {
        "sql": "SELECT * FROM employees WHERE last_name ILIKE '%{{input}}%' OR first_name ILIKE '%{{input}}%'",
        "params": [],
        "search_path": "hr_admin,public"
      }
EOF

# 3. Create Finance Agent
cat > packages/agents/fin_reader.yaml << 'EOF'
name: finance_reader
codename: fin
description: Query financial operations data
endpoint: http://localhost:8888
headers:
  X-API-Key: ${MCP_API_KEY}
  Content-Type: application/json
tools:
  - name: query
    method: POST
    path: /api/query
    description: Query financial_ops schema
    input: |
      {
        "sql": "{{input}}",
        "params": [],
        "search_path": "financial_ops,public"
      }
  - name: explain
    method: POST
    path: /api/query
    description: Explain query plan
    input: |
      {
        "sql": "EXPLAIN ANALYZE {{input}}",
        "params": [],
        "search_path": "financial_ops,public"
      }
  - name: invoices
    method: POST
    path: /api/query
    description: Quick invoice lookup
    input: |
      {
        "sql": "SELECT * FROM invoices WHERE invoice_number = '{{input}}' OR customer_id = '{{input}}'",
        "params": [],
        "search_path": "financial_ops,public"
      }
EOF

# 4. Create Cross-Schema Agent
cat > packages/agents/integrated_reader.yaml << 'EOF'
name: integrated_reader
codename: all
description: Query across all TBWA schemas
endpoint: http://localhost:8888
headers:
  X-API-Key: ${MCP_API_KEY}
  Content-Type: application/json
tools:
  - name: query
    method: POST
    path: /api/query
    description: Cross-schema queries
    input: |
      {
        "sql": "{{input}}",
        "params": [],
        "search_path": "scout_dash,hr_admin,financial_ops,public"
      }
  - name: employee_expenses
    method: POST
    path: /api/query
    description: Employee expense report
    input: |
      {
        "sql": "SELECT e.first_name, e.last_name, SUM(exp.amount) as total_expenses FROM hr_admin.employees e LEFT JOIN financial_ops.expenses exp ON e.employee_id = exp.employee_id WHERE e.department_id = '{{input}}' GROUP BY e.employee_id, e.first_name, e.last_name",
        "params": [],
        "search_path": "hr_admin,financial_ops,public"
      }
EOF

# 5. Create Writer Agents (CI/CD only)
cat > packages/agents/scout_writer.yaml << 'EOF'
name: scout_writer
codename: scout_write
description: Write operations for scout_dash (CI/CD only)
endpoint: http://localhost:8891
headers:
  X-API-Key: ${SCOUT_SERVICE_KEY}
  Content-Type: application/json
tools:
  - name: execute
    method: POST
    path: /api/execute
    description: Execute DDL/DML
    input: |
      {
        "sql": "{{input}}",
        "params": [],
        "search_path": "scout_dash,public"
      }
  - name: migrate
    method: POST
    path: /api/migrate
    description: Run migration file
    input: |
      {
        "file": "{{input}}"
      }
EOF

cat > packages/agents/hr_writer.yaml << 'EOF'
name: hr_writer
codename: hr_write
description: Write operations for hr_admin (CI/CD only)
endpoint: http://localhost:8894
headers:
  X-API-Key: ${HR_SERVICE_KEY}
  Content-Type: application/json
tools:
  - name: execute
    method: POST
    path: /api/execute
    description: Execute DDL/DML
    input: |
      {
        "sql": "{{input}}",
        "params": [],
        "search_path": "hr_admin,public"
      }
EOF

cat > packages/agents/fin_writer.yaml << 'EOF'
name: finance_writer
codename: fin_write
description: Write operations for financial_ops (CI/CD only)
endpoint: http://localhost:8893
headers:
  X-API-Key: ${FIN_SERVICE_KEY}
  Content-Type: application/json
tools:
  - name: execute
    method: POST
    path: /api/execute
    description: Execute DDL/DML
    input: |
      {
        "sql": "{{input}}",
        "params": [],
        "search_path": "financial_ops,public"
      }
EOF

# 6. Create MCP Reader Start Script
cat > scripts/start-mcp-reader.sh << 'EOF'
#!/bin/bash
# Start local MCP reader for Pulser CLI

echo "🚀 Starting MCP Reader on port 8888..."
echo "Available schemas: scout_dash, hr_admin, financial_ops"
echo ""

# Check if already running
if lsof -i:8888 >/dev/null 2>&1; then
    echo "⚠️  Port 8888 already in use. Killing existing process..."
    kill $(lsof -t -i:8888) 2>/dev/null
    sleep 2
fi

# Start MCP reader with all schemas accessible
docker run -d \
  --name mcp-reader \
  -p 8888:3000 \
  -e SUPABASE_URL="${SUPABASE_URL}" \
  -e SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}" \
  -e MCP_API_KEY="${MCP_API_KEY}" \
  -e READ_ONLY=true \
  -e ALLOWED_SCHEMAS="scout_dash,hr_admin,financial_ops,public" \
  -e DEFAULT_SCHEMA="${SCHEMA:-public}" \
  ghcr.io/tbwa/mcp-server:latest

echo "✅ MCP Reader started!"
echo ""
echo "Test with:"
echo '  :scout "SELECT COUNT(*) FROM transactions"'
echo '  :hr "SELECT COUNT(*) FROM employees"'
echo '  :fin "SELECT COUNT(*) FROM invoices"'
EOF

chmod +x scripts/start-mcp-reader.sh

# 7. Create Pulser Config
cat > .pulserrc << 'EOF'
# TBWA Pulser Configuration
agents:
  # Readers (always available)
  - packages/agents/scout_reader.yaml
  - packages/agents/hr_reader.yaml
  - packages/agents/fin_reader.yaml
  - packages/agents/integrated_reader.yaml
  
  # Writers (CI/CD only - comment out for local dev)
  # - packages/agents/scout_writer.yaml
  # - packages/agents/hr_writer.yaml
  # - packages/agents/fin_writer.yaml

# Environment
env:
  SUPABASE_URL: ${SUPABASE_URL}
  SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
  MCP_API_KEY: ${MCP_API_KEY}

# Aliases for quick access
aliases:
  s: scout
  h: hr
  f: fin
  a: all
EOF

# 8. Create Usage Guide
cat > PULSER_USAGE.md << 'EOF'
# Pulser CLI Usage Guide

## 🚀 Quick Start

```bash
# Start MCP reader (once per session)
./scripts/start-mcp-reader.sh

# Load environment
direnv allow
```

## 📊 Query Examples

### Scout Dashboard (Retail Analytics)

```bash
# Natural language
:scout "show me top 10 stores by revenue this month"

# Direct SQL
:scout "SELECT store_name, SUM(total_amount) as revenue FROM transactions t JOIN stores s ON t.store_id = s.store_id WHERE date >= CURRENT_DATE - INTERVAL '30 days' GROUP BY store_name ORDER BY revenue DESC LIMIT 10"

# Quick aliases
:s "SELECT COUNT(*) FROM transactions"
```

### HR Queries

```bash
# Employee search
:hr employees "Smith"

# Department summary
:hr "SELECT d.department_name, COUNT(e.employee_id) as headcount, AVG(p.gross_pay) as avg_salary FROM departments d LEFT JOIN employees e ON d.department_id = e.department_id LEFT JOIN payroll p ON e.employee_id = p.employee_id GROUP BY d.department_name"

# Quick alias
:h "SELECT COUNT(*) FROM employees WHERE status = 'active'"
```

### Finance Queries

```bash
# Invoice lookup
:fin invoices "INV-2024-001"

# Overdue invoices
:fin "SELECT COUNT(*), SUM(amount) FROM invoices WHERE status = 'overdue'"

# Budget vs actual
:f "SELECT b.name, b.amount as budget, SUM(e.amount) as spent FROM budgets b LEFT JOIN expenses e ON b.id = e.budget_id WHERE b.fiscal_year = 2024 GROUP BY b.id, b.name, b.amount"
```

### Cross-Schema Queries

```bash
# Employee expenses by department
:all employee_expenses "dept-123"

# Store employee costs
:all "SELECT s.store_name, COUNT(DISTINCT e.employee_id) as employees, SUM(p.gross_pay) as total_payroll FROM scout_dash.stores s JOIN hr_admin.employees e ON s.cost_center = e.department_id JOIN hr_admin.payroll p ON e.employee_id = p.employee_id GROUP BY s.store_name"
```

## 🔍 Query Analysis

```bash
# Explain plan
:scout explain "SELECT * FROM transactions WHERE date > '2024-01-01'"

# With timing
:fin "EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM invoices"
```

## 📋 Formatting Output

```bash
# Pretty JSON
:scout "SELECT * FROM stores LIMIT 5" | jq .

# CSV export
:hr "SELECT * FROM employees" | jq -r '.rows[] | [.employee_id, .first_name, .last_name, .email] | @csv' > employees.csv

# Table view
:fin "SELECT * FROM invoices LIMIT 20" | jq -r '.rows[] | to_entries | map("\(.key)=\(.value)") | join(" | ")' 
```

## 🔧 Advanced Usage

### Parameterized Queries

```bash
# Set variable
export STORE_ID="store-123"

# Use in query
:scout "SELECT * FROM transactions WHERE store_id = '$STORE_ID'"
```

### Batch Operations

```bash
# Run multiple queries
cat << 'EOF' | while read query; do
  echo "Running: $query"
  :scout "$query"
done
SELECT COUNT(*) FROM transactions
SELECT COUNT(*) FROM stores
SELECT COUNT(*) FROM products
EOF
```

### Performance Testing

```bash
# Time a query
time :scout "SELECT COUNT(*) FROM transactions"

# Run multiple times
for i in {1..10}; do
  time :scout "SELECT COUNT(*) FROM transactions" 2>&1 | grep real
done
```

## 🚨 Troubleshooting

### MCP Reader Not Responding

```bash
# Check if running
docker ps | grep mcp-reader

# View logs
docker logs mcp-reader

# Restart
docker restart mcp-reader
```

### Authentication Issues

```bash
# Verify environment
env | grep -E "(SUPABASE|MCP)"

# Reload environment
direnv reload
```

### Query Errors

```bash
# Check schema exists
:all "SELECT schema_name FROM information_schema.schemata"

# Check table exists
:scout "SELECT table_name FROM information_schema.tables WHERE table_schema = 'scout_dash'"
```

## 🎯 Tips

1. Use aliases for speed: `:s`, `:h`, `:f`, `:a`
2. Natural language works well for simple queries
3. Use explain for slow queries
4. Pipe to `jq` for JSON formatting
5. Save common queries as bash aliases

## 🔐 Security Notes

- All queries are read-only
- Schema isolation is enforced
- No write operations via CLI (use CI/CD)
- API keys are managed by KeyKey
EOF

echo "✅ Pulser Supabase setup complete!"
echo ""
echo "📁 Created files:"
echo "  - packages/agents/*.yaml    (Pulser agents)"
echo "  - scripts/start-mcp-reader.sh"
echo "  - .pulserrc                 (Pulser config)"
echo "  - PULSER_USAGE.md          (Usage guide)"
echo ""
echo "🚀 Quick start:"
echo "  1. ./scripts/start-mcp-reader.sh"
echo "  2. :scout 'SELECT COUNT(*) FROM transactions'"
echo "  3. :hr 'SELECT COUNT(*) FROM employees'"
echo "  4. :fin 'SELECT COUNT(*) FROM invoices'"
echo ""
echo "💡 See PULSER_USAGE.md for more examples!"