#!/bin/bash
set -euo pipefail

# Scaffold for hris-fris (HR + Finance Combined System)

echo "👥💰 Scaffolding hris-fris (HR + Finance System)..."

# Setup directory (assuming we're in the agency-databank location)
cd "/Users/tbwa/Library/CloudStorage/GoogleDrive-jgtolentino.rn@gmail.com/My Drive/GitHub/GitHub/databank"
mkdir -p hris-fris
cd hris-fris

# Initialize git
git init

# Create the complete structure
mkdir -p apps/{web,api}/{src,public}
mkdir -p services/mcp-writer/{src,config}
mkdir -p prisma/migrations/{hr_admin,financial_ops}
mkdir -p openapi
mkdir -p ci
mkdir -p infra
mkdir -p .github/workflows
mkdir -p scripts

# Create README
cat > README.md << 'EOF'
# HRIS-FRIS - HR & Finance Integrated System

Enterprise HR and Finance management system using `hr_admin` and `financial_ops` schemas in TBWA Platform.

## 🚀 Quick Start

```bash
# Setup environment
direnv allow

# Install dependencies
pnpm install

# Start development
pnpm dev
```

## 📊 Database Schemas

This project uses TWO schemas in the TBWA Supabase cluster:

### HR Admin (`hr_admin`)
- **Read Access**: Via MCP reader with `hr_anon` role
- **Write Access**: CI/CD only via writer MCP (port 8894)
- **Tables**: employees, departments, payroll, benefits, time_tracking

### Financial Operations (`financial_ops`)
- **Read Access**: Via MCP reader with `fin_anon` role  
- **Write Access**: CI/CD only via writer MCP (port 8893)
- **Tables**: invoices, budgets, expenses, payments, forecasts

Both schemas are accessible via the shared MCP reader at https://mcp.tbwa.ai

## 🔐 Security

- All secrets managed by KeyKey
- LLMs have read-only access to both schemas
- Writes restricted to CI/CD pipeline
- Cross-schema queries supported for integrated reporting

## 🎯 Features

### HR Module
- Employee management
- Payroll processing
- Benefits administration
- Time tracking
- Performance reviews
- Org chart visualization

### Finance Module
- Invoice management
- Budget tracking
- Expense reporting
- Financial forecasting
- Payment processing
- FP&A dashboards

### Integrated Features
- Payroll-to-GL integration
- Department budget tracking
- Employee expense management
- Cost center reporting
- Headcount planning

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│            Supabase Cluster                  │
│  ┌─────────────────┬─────────────────────┐  │
│  │   hr_admin      │   financial_ops     │  │
│  │  - employees    │  - invoices         │  │
│  │  - departments  │  - budgets          │  │
│  │  - payroll      │  - expenses         │  │
│  │  - benefits     │  - payments         │  │
│  │  - time_tracking│  - forecasts        │  │
│  └─────────────────┴─────────────────────┘  │
└─────────────────────────────────────────────┘
            ↑ Read Only (Both Schemas)
┌─────────────────────────────────────────────┐
│      MCP Reader (port 8888)                  │
│   Can query both schemas with proper roles  │
└─────────────────────────────────────────────┘
```

## 📖 Documentation

See [TBWA Platform Docs](https://github.com/jgtolentino/mcp-sqlite-server/tree/chatgpt-integration/docs)
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnpm-store/

# Environment
.env
.env.local
.env.*.local
!.env.template

# Build outputs
dist/
build/
.next/
out/

# Database
*.db
*.sqlite
prisma/migrations/dev/

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*

# Testing
coverage/

# Misc
.turbo/
.vercel/
EOF

# Create .env.template
cat > .env.template << 'EOF'
# Database Configuration
SUPABASE_URL=https://cxzllzyxwpyptfretryc.supabase.co

# HR Schema Keys
HR_ANON_KEY=<hr_anon_key>
HR_SERVICE_KEY=<hr_service_key>

# Finance Schema Keys
FIN_ANON_KEY=<fin_anon_key>
FIN_SERVICE_KEY=<fin_service_key>

# MCP Configuration
MCP_READER_URL=https://mcp.tbwa.ai
MCP_API_KEY=<mcp_api_key>

# Writer Ports (CI/CD only)
HR_WRITER_PORT=8894
FIN_WRITER_PORT=8893

# Schemas
HR_SCHEMA=hr_admin
FIN_SCHEMA=financial_ops

# API Configuration
API_PORT=3001
NODE_ENV=development

# Application
NEXT_PUBLIC_APP_NAME="HRIS-FRIS"
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF

# Create package.json
cat > package.json << 'EOF'
{
  "name": "hris-fris",
  "version": "0.1.0",
  "private": true,
  "description": "TBWA HR & Finance System using hr_admin and financial_ops schemas",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "start": "turbo run start",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "db:migrate:hr": "prisma migrate dev --schema=./prisma/hr.schema.prisma",
    "db:migrate:fin": "prisma migrate dev --schema=./prisma/finance.schema.prisma",
    "db:generate": "prisma generate --schema=./prisma/hr.schema.prisma && prisma generate --schema=./prisma/finance.schema.prisma",
    "db:studio:hr": "prisma studio --schema=./prisma/hr.schema.prisma",
    "db:studio:fin": "prisma studio --schema=./prisma/finance.schema.prisma",
    "keykey:sync": "gh workflow run keykey-sync.yml"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "prisma": "^5.0.0",
    "tsx": "^4.0.0",
    "turbo": "^1.10.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "@supabase/supabase-js": "^2.39.0",
    "zod": "^3.22.0"
  },
  "workspaces": [
    "apps/*",
    "services/*"
  ]
}
EOF

# Create Prisma schema for HR
cat > prisma/hr.schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/@prisma/client/hr"
  previewFeatures = ["multiSchema"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL_HR")
  schemas  = ["hr_admin", "public"]
}

// HR Admin Models

model Employee {
  employee_id     String   @id @default(uuid())
  employee_number String   @unique
  first_name      String
  last_name       String
  email           String   @unique
  department_id   String
  position        String
  hire_date       DateTime
  status          String   @default("active")
  manager_id      String?
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  department      Department @relation(fields: [department_id], references: [department_id])
  manager         Employee?  @relation("ManagerRelation", fields: [manager_id], references: [employee_id])
  subordinates    Employee[] @relation("ManagerRelation")
  payroll_records Payroll[]
  benefits        EmployeeBenefit[]
  time_records    TimeTracking[]
  reviews         PerformanceReview[]
  
  @@schema("hr_admin")
}

model Department {
  department_id   String   @id @default(uuid())
  department_name String   @unique
  parent_id       String?
  manager_id      String?
  cost_center     String
  status          String   @default("active")
  created_at      DateTime @default(now())
  
  employees       Employee[]
  parent          Department? @relation("DepartmentHierarchy", fields: [parent_id], references: [department_id])
  children        Department[] @relation("DepartmentHierarchy")
  
  @@schema("hr_admin")
}

model Payroll {
  payroll_id      String   @id @default(uuid())
  employee_id     String
  pay_period_start DateTime
  pay_period_end   DateTime
  gross_pay       Decimal  @db.Decimal(10, 2)
  net_pay         Decimal  @db.Decimal(10, 2)
  status          String   @default("pending")
  payment_date    DateTime?
  created_at      DateTime @default(now())
  
  employee        Employee @relation(fields: [employee_id], references: [employee_id])
  deductions      PayrollDeduction[]
  
  @@schema("hr_admin")
}

model PayrollDeduction {
  deduction_id    String   @id @default(uuid())
  payroll_id      String
  deduction_type  String   // tax, insurance, retirement, etc.
  amount          Decimal  @db.Decimal(10, 2)
  
  payroll         Payroll  @relation(fields: [payroll_id], references: [payroll_id])
  
  @@schema("hr_admin")
}

model Benefit {
  benefit_id      String   @id @default(uuid())
  benefit_name    String
  benefit_type    String   // health, dental, vision, retirement
  provider        String
  status          String   @default("active")
  
  employee_benefits EmployeeBenefit[]
  
  @@schema("hr_admin")
}

model EmployeeBenefit {
  id              String   @id @default(uuid())
  employee_id     String
  benefit_id      String
  enrollment_date DateTime
  end_date        DateTime?
  employee_cost   Decimal  @db.Decimal(10, 2)
  employer_cost   Decimal  @db.Decimal(10, 2)
  
  employee        Employee @relation(fields: [employee_id], references: [employee_id])
  benefit         Benefit  @relation(fields: [benefit_id], references: [benefit_id])
  
  @@schema("hr_admin")
}

model TimeTracking {
  time_id         String   @id @default(uuid())
  employee_id     String
  date            DateTime
  clock_in        DateTime
  clock_out       DateTime?
  hours_worked    Decimal? @db.Decimal(5, 2)
  overtime_hours  Decimal? @db.Decimal(5, 2)
  status          String   @default("pending")
  
  employee        Employee @relation(fields: [employee_id], references: [employee_id])
  
  @@index([date])
  @@schema("hr_admin")
}

model PerformanceReview {
  review_id       String   @id @default(uuid())
  employee_id     String
  reviewer_id     String
  review_period   String
  overall_rating  Int      // 1-5
  status          String   @default("draft")
  review_date     DateTime
  created_at      DateTime @default(now())
  
  employee        Employee @relation(fields: [employee_id], references: [employee_id])
  
  @@schema("hr_admin")
}
EOF

# Create Prisma schema for Finance
cat > prisma/finance.schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/@prisma/client/finance"
  previewFeatures = ["multiSchema"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL_FIN")
  schemas  = ["financial_ops", "public"]
}

// Financial Operations Models (same as before)

model Invoice {
  id              String   @id @default(uuid())
  invoice_number  String   @unique
  customer_id     String
  amount          Decimal  @db.Decimal(10, 2)
  currency        String   @default("USD")
  status          String   @default("pending")
  due_date        DateTime
  paid_date       DateTime?
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  line_items      InvoiceLineItem[]
  payments        Payment[]
  
  @@schema("financial_ops")
}

model InvoiceLineItem {
  id          String   @id @default(uuid())
  invoice_id  String
  description String
  quantity    Decimal  @db.Decimal(10, 2)
  unit_price  Decimal  @db.Decimal(10, 2)
  amount      Decimal  @db.Decimal(10, 2)
  
  invoice     Invoice  @relation(fields: [invoice_id], references: [id])
  
  @@schema("financial_ops")
}

model Budget {
  id              String   @id @default(uuid())
  name            String
  fiscal_year     Int
  fiscal_quarter  Int?
  department      String   // Links to hr_admin.departments.cost_center
  amount          Decimal  @db.Decimal(12, 2)
  currency        String   @default("USD")
  status          String   @default("active")
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  expenses        Expense[]
  
  @@schema("financial_ops")
}

model Expense {
  id              String   @id @default(uuid())
  budget_id       String?
  category        String
  description     String
  amount          Decimal  @db.Decimal(10, 2)
  currency        String   @default("USD")
  expense_date    DateTime
  employee_id     String?  // Links to hr_admin.employees.employee_id
  approved_by     String?
  status          String   @default("pending")
  created_at      DateTime @default(now())
  
  budget          Budget?  @relation(fields: [budget_id], references: [id])
  
  @@schema("financial_ops")
}

model Payment {
  id              String   @id @default(uuid())
  invoice_id      String
  amount          Decimal  @db.Decimal(10, 2)
  currency        String   @default("USD")
  payment_date    DateTime @default(now())
  payment_method  String
  reference       String?
  
  invoice         Invoice  @relation(fields: [invoice_id], references: [id])
  
  @@schema("financial_ops")
}

model Forecast {
  id              String   @id @default(uuid())
  name            String
  type            String   // revenue, expense, cashflow, headcount
  period_start    DateTime
  period_end      DateTime
  amount          Decimal  @db.Decimal(12, 2)
  confidence      Int      // 0-100
  department      String?  // Links to hr_admin.departments.cost_center
  notes           String?
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  @@schema("financial_ops")
}
EOF

# Create HR migration
cat > prisma/migrations/hr_admin/001_init_hr.sql << 'EOF'
-- Initial schema setup for hr_admin
-- This runs in CI/CD via writer MCP

-- Ensure schema exists
CREATE SCHEMA IF NOT EXISTS hr_admin;

-- Set search path
SET search_path TO hr_admin, public;

-- Create roles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'hr_anon') THEN
    CREATE ROLE hr_anon;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'hr_service_role') THEN
    CREATE ROLE hr_service_role;
  END IF;
END $$;

-- Grant permissions
GRANT USAGE ON SCHEMA hr_admin TO hr_anon, mcp_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA hr_admin TO hr_anon, mcp_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA hr_admin 
  GRANT SELECT ON TABLES TO hr_anon, mcp_reader;

GRANT ALL PRIVILEGES ON SCHEMA hr_admin TO hr_service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA hr_admin TO hr_service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA hr_admin 
  GRANT ALL PRIVILEGES ON TABLES TO hr_service_role;

-- Enable RLS
ALTER TABLE hr_admin.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_admin.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_admin.payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_admin.benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_admin.employee_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_admin.time_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_admin.performance_reviews ENABLE ROW LEVEL SECURITY;

-- Create read policies
CREATE POLICY "Read access" ON hr_admin.employees
  FOR SELECT TO hr_anon, mcp_reader USING (true);
CREATE POLICY "Read access" ON hr_admin.departments
  FOR SELECT TO hr_anon, mcp_reader USING (true);
-- Add more policies...

-- Create indexes
CREATE INDEX idx_employees_department ON hr_admin.employees(department_id);
CREATE INDEX idx_employees_manager ON hr_admin.employees(manager_id);
CREATE INDEX idx_payroll_employee ON hr_admin.payroll(employee_id);
CREATE INDEX idx_time_tracking_date ON hr_admin.time_tracking(date);
EOF

# Create Finance migration
cat > prisma/migrations/financial_ops/001_init_finance.sql << 'EOF'
-- Initial schema setup for financial_ops
-- This runs in CI/CD via writer MCP

-- Ensure schema exists
CREATE SCHEMA IF NOT EXISTS financial_ops;

-- Set search path
SET search_path TO financial_ops, public;

-- Create roles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'fin_anon') THEN
    CREATE ROLE fin_anon;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'fin_service_role') THEN
    CREATE ROLE fin_service_role;
  END IF;
END $$;

-- Grant permissions
GRANT USAGE ON SCHEMA financial_ops TO fin_anon, mcp_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA financial_ops TO fin_anon, mcp_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA financial_ops 
  GRANT SELECT ON TABLES TO fin_anon, mcp_reader;

GRANT ALL PRIVILEGES ON SCHEMA financial_ops TO fin_service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA financial_ops TO fin_service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA financial_ops 
  GRANT ALL PRIVILEGES ON TABLES TO fin_service_role;

-- Create cross-schema view for integrated reporting
CREATE OR REPLACE VIEW financial_ops.employee_expenses AS
SELECT 
  e.expense_id,
  e.employee_id,
  e.amount,
  e.expense_date,
  e.category,
  e.status
FROM financial_ops.expenses e
WHERE e.employee_id IS NOT NULL;

GRANT SELECT ON financial_ops.employee_expenses TO fin_anon, hr_anon, mcp_reader;
EOF

# Create OpenAPI spec
cat > openapi/hris-fris-reader.yaml << 'EOF'
openapi: 3.0.0
info:
  title: HRIS-FRIS MCP Reader
  version: 1.0.0
  description: Read-only access to hr_admin and financial_ops schemas
servers:
  - url: https://mcp.tbwa.ai
    description: Production MCP Reader (port 8888)
security:
  - apiKey: []
paths:
  /api/query/hr:
    post:
      operationId: queryHR
      summary: Query HR data (read-only)
      x-search-path: "hr_admin,public"
      x-required-role: "hr_anon"
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/QueryRequest'
      responses:
        '200':
          description: Query results
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/QueryResponse'
                
  /api/query/finance:
    post:
      operationId: queryFinance
      summary: Query Finance data (read-only)
      x-search-path: "financial_ops,public"
      x-required-role: "fin_anon"
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/QueryRequest'
      responses:
        '200':
          description: Query results
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/QueryResponse'
                
  /api/query/integrated:
    post:
      operationId: queryIntegrated
      summary: Query across HR and Finance schemas
      x-search-path: "hr_admin,financial_ops,public"
      x-required-roles: ["hr_anon", "fin_anon"]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                sql:
                  type: string
                  description: |
                    Cross-schema queries allowed. Example:
                    SELECT 
                      e.first_name, 
                      e.last_name,
                      SUM(exp.amount) as total_expenses
                    FROM hr_admin.employees e
                    LEFT JOIN financial_ops.expenses exp 
                      ON e.employee_id = exp.employee_id
                    GROUP BY e.employee_id, e.first_name, e.last_name
                params:
                  type: array
                  items:
                    type: string
      responses:
        '200':
          description: Query results

components:
  schemas:
    QueryRequest:
      type: object
      required:
        - sql
      properties:
        sql:
          type: string
        params:
          type: array
          items:
            type: string
            
    QueryResponse:
      type: object
      properties:
        rows:
          type: array
          items:
            type: object
        rowCount:
          type: integer
        fields:
          type: array
          
  securitySchemes:
    apiKey:
      type: apiKey
      in: header
      name: X-API-Key
EOF

# Create GitHub Actions workflow
cat > .github/workflows/main.yml << 'EOF'
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-test:
    name: Lint & Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
          
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test

  migrate-hr:
    name: HR Database Migration
    needs: lint-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Start HR Writer MCP
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.HR_SERVICE_KEY }}
        run: |
          echo "🚀 Starting writer MCP for hr_admin..."
          
          docker run -d \
            -e SUPABASE_URL=$SUPABASE_URL \
            -e SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY \
            -e SCHEMA_NAME=hr_admin \
            -e SEARCH_PATH=hr_admin,public \
            -e READ_ONLY=false \
            -p 8894:3000 \
            --name mcp-writer-hr \
            ghcr.io/tbwa/mcp-server:latest
          
          sleep 10
          
      - name: Run HR Migrations
        run: |
          for migration in prisma/migrations/hr_admin/*.sql; do
            echo "Running $migration..."
            curl -X POST http://localhost:8894/api/execute \
              -H "Content-Type: application/json" \
              -H "X-API-Key: ${{ secrets.MCP_API_KEY }}" \
              -d "{\"sql\": \"$(cat $migration | jq -Rs .)\"}"
          done

  migrate-finance:
    name: Finance Database Migration
    needs: lint-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Start Finance Writer MCP
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.FIN_SERVICE_KEY }}
        run: |
          echo "🚀 Starting writer MCP for financial_ops..."
          
          docker run -d \
            -e SUPABASE_URL=$SUPABASE_URL \
            -e SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY \
            -e SCHEMA_NAME=financial_ops \
            -e SEARCH_PATH=financial_ops,public \
            -e READ_ONLY=false \
            -p 8893:3000 \
            --name mcp-writer-fin \
            ghcr.io/tbwa/mcp-server:latest
          
          sleep 10
          
      - name: Run Finance Migrations
        run: |
          for migration in prisma/migrations/financial_ops/*.sql; do
            echo "Running $migration..."
            curl -X POST http://localhost:8893/api/execute \
              -H "Content-Type: application/json" \
              -H "X-API-Key: ${{ secrets.MCP_API_KEY }}" \
              -d "{\"sql\": \"$(cat $migration | jq -Rs .)\"}"
          done

  deploy:
    name: Deploy
    needs: [migrate-hr, migrate-finance]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Applications
        run: |
          pnpm install --frozen-lockfile
          pnpm build
      
      - name: Deploy to Render
        env:
          RENDER_API_KEY: ${{ secrets.KEYKEY_RENDER_TOKEN }}
          SERVICE_ID: ${{ secrets.RENDER_SERVICE_ID_HRIS }}
        run: |
          curl -X POST \
            -H "Authorization: Bearer $RENDER_API_KEY" \
            https://api.render.com/v1/services/$SERVICE_ID/deploys

  keykey-sync:
    name: 🤖 KeyKey Secret Sync
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Trigger KeyKey Sync
        env:
          GH_TOKEN: ${{ secrets.KEYKEY_PAT }}
        run: |
          gh workflow run keykey-sync.yml -R jgtolentino/mcp-sqlite-server
EOF

# Create direnv file
cat > .envrc << 'EOF'
# Auto-load environment for HRIS-FRIS
echo "👥💰 Loading HRIS-FRIS environment..."

if [ -f .env.local ]; then
  set -a
  source .env.local
  set +a
  echo "✅ Loaded hr_admin + financial_ops environment"
else
  echo "⚠️  No .env.local found"
  echo "   Run: cp .env.template .env.local"
  echo "   Then fill in the values from KeyKey"
fi

# Set DATABASE URLs for Prisma
if [ -n "$SUPABASE_URL" ]; then
  # Extract host from Supabase URL
  SUPABASE_HOST=$(echo $SUPABASE_URL | sed 's|https://||' | cut -d'.' -f1)
  
  # HR Database URL
  if [ -n "$HR_SERVICE_KEY" ]; then
    export DATABASE_URL_HR="postgresql://postgres:${HR_SERVICE_KEY}@${SUPABASE_HOST}.pooler.supabase.com:6543/postgres?schema=hr_admin"
  fi
  
  # Finance Database URL
  if [ -n "$FIN_SERVICE_KEY" ]; then
    export DATABASE_URL_FIN="postgresql://postgres:${FIN_SERVICE_KEY}@${SUPABASE_HOST}.pooler.supabase.com:6543/postgres?schema=financial_ops"
  fi
fi
EOF

# Create turbo.json
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "typecheck": {},
    "test": {}
  }
}
EOF

# Create pnpm-workspace.yaml
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'services/*'
EOF

echo "✅ Scaffolded hris-fris (HR + Finance System)!"
echo ""
echo "Next steps:"
echo "1. git add ."
echo "2. git commit -m 'feat: Initial scaffold for hr_admin + financial_ops schemas'"
echo "3. git remote add origin https://github.com/jgtolentino/agency-databank.git"
echo "4. git push -u origin main"
echo ""
echo "Add these to KeyKey's Doppler:"
echo "- HR_SERVICE_KEY"
echo "- HR_ANON_KEY"
echo "- FIN_SERVICE_KEY"
echo "- FIN_ANON_KEY"
echo "- RENDER_SERVICE_ID_HRIS"