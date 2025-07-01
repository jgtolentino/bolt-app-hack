#!/usr/bin/env bash
set -euo pipefail

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🌱 SCOUT DATA SEEDER${NC}"
echo "========================================"
echo
echo -e "${YELLOW}This will:${NC}"
echo "1. Wipe all existing transaction data"
echo "2. Create stores across all 18 Philippine regions"
echo "3. Generate 5000 transactions"
echo "4. Ensure 70% TBWA brands, 30% competitors"
echo
read -p "Continue? (y/N) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Cancelled${NC}"
    exit 1
fi

cd "$(dirname "$0")/.."

echo -e "\n${YELLOW}🚀 Running data seeder...${NC}\n"

if node scripts/seed-data.js; then
    echo -e "\n${GREEN}✨ Seeding completed successfully!${NC}"
    echo
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Check your Supabase dashboard for the new data"
    echo "2. Run the application to see the populated analytics"
    echo "3. All 18 regions should now have transaction data"
    echo "4. TBWA brands (Alaska, Oishi, Del Monte, etc.) should dominate"
else
    echo -e "\n${RED}❌ Seeding failed - check the errors above${NC}"
    exit 1
fi