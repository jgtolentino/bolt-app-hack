#!/usr/bin/env bash
set -euo pipefail

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 SCOUT ANALYTICS LOCAL SETUP${NC}"
echo "========================================"
echo
echo "This script will:"
echo "1. Start PostgreSQL in Docker"
echo "2. Apply the complete migration"
echo "3. Seed 5000 transactions with TBWA brands"
echo "4. Verify the setup"
echo

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker Desktop first"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ psql is not installed${NC}"
    echo "Install with: brew install postgresql"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}\n"

# Step 1: Start Docker
echo -e "${BLUE}1. Starting PostgreSQL in Docker...${NC}"
docker compose down 2>/dev/null || true
docker compose up -d

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
for i in {1..30}; do
    if docker compose exec -T postgres pg_isready -U postgres &>/dev/null; then
        echo -e "${GREEN}✅ PostgreSQL is ready${NC}\n"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ PostgreSQL failed to start${NC}"
        exit 1
    fi
    sleep 1
done

# Step 2: Apply migration
echo -e "${BLUE}2. Applying complete migration...${NC}"
if PGPASSWORD='Post_gres26!' psql -h localhost -p 5432 -U postgres -d scout_local -f migrations/20250701_complete_clean_migration.sql > /tmp/migration.log 2>&1; then
    echo -e "${GREEN}✅ Migration applied successfully${NC}"
    
    # Show summary
    PGPASSWORD='Post_gres26!' psql -h localhost -p 5432 -U postgres -d scout_local -t << EOF
SELECT 
    'Brands: ' || COUNT(*) FROM brands
UNION ALL
SELECT 'Products: ' || COUNT(*) FROM products
UNION ALL
SELECT 'Categories: ' || COUNT(*) FROM categories
UNION ALL
SELECT 'TBWA Brands: ' || COUNT(*) FROM client_brands WHERE client_id = (SELECT id FROM clients WHERE client_code = 'TBWA-001');
EOF
else
    echo -e "${RED}❌ Migration failed${NC}"
    echo "Check /tmp/migration.log for details"
    exit 1
fi

# Step 3: Create .env.local if needed
if [ ! -f .env.local ]; then
    echo -e "\n${YELLOW}Creating .env.local...${NC}"
    cp .env.local.example .env.local
    echo -e "${GREEN}✅ Created .env.local${NC}"
fi

# Step 4: Seed data
echo -e "\n${BLUE}3. Seeding 5000 transactions...${NC}"
echo "This will take a few minutes..."

if node scripts/seed-data-local.js; then
    echo -e "${GREEN}✅ Data seeding completed${NC}"
else
    echo -e "${RED}❌ Seeding failed${NC}"
    exit 1
fi

# Step 5: Verify setup
echo -e "\n${BLUE}4. Verifying setup...${NC}"

echo -e "\n${YELLOW}Database Statistics:${NC}"
PGPASSWORD='Post_gres26!' psql -h localhost -p 5432 -U postgres -d scout_local << EOF
SELECT 
    'Transactions' as entity,
    COUNT(*) as count,
    MIN(datetime)::date as oldest,
    MAX(datetime)::date as newest
FROM transactions
UNION ALL
SELECT 
    'Transaction Items',
    COUNT(*),
    NULL,
    NULL
FROM transaction_items
UNION ALL
SELECT 
    'Active Stores',
    COUNT(*),
    NULL,
    NULL
FROM stores WHERE is_active = true;

-- Regional distribution
SELECT 
    region,
    COUNT(DISTINCT store_id) as stores,
    COUNT(*) as transactions
FROM transactions t
JOIN stores s ON t.store_id = s.store_id
GROUP BY region
ORDER BY transactions DESC
LIMIT 5;
EOF

echo -e "\n${GREEN}✨ LOCAL SETUP COMPLETE!${NC}"
echo
echo -e "${BLUE}Next steps:${NC}"
echo "1. Connect to database: psql postgresql://postgres:Post_gres26!@localhost:5432/scout_local"
echo "2. View in TablePlus/DBeaver: localhost:5432, user: postgres, pass: Post_gres26!"
echo "3. Update your app's .env to use DATABASE_URL from .env.local"
echo
echo -e "${YELLOW}Useful commands:${NC}"
echo "• Stop database: docker compose down"
echo "• View logs: docker compose logs -f postgres"
echo "• Reset and restart: docker compose down -v && ./scripts/setup-local.sh"
echo
echo -e "${GREEN}Your local Scout Analytics database is ready with 5000 transactions! 🎉${NC}"