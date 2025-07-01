#!/usr/bin/env bash
set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📊 SCOUT LOCAL DATABASE INSPECTOR${NC}"
echo "========================================"
echo

# Quick stats
echo -e "${YELLOW}Quick Statistics:${NC}"
PGPASSWORD='Post_gres26!' psql -h localhost -p 5432 -U postgres -d scout_local -t << 'EOF'
SELECT 'Total Transactions: ' || COUNT(*) FROM transactions
UNION ALL
SELECT 'Total Revenue: ₱' || TO_CHAR(SUM(total_amount), 'FM999,999,999.00') FROM transactions
UNION ALL
SELECT 'Unique Customers: ' || COUNT(DISTINCT customer_id) FROM transactions
UNION ALL
SELECT 'Active Stores: ' || COUNT(*) FROM stores WHERE is_active = true
UNION ALL
SELECT 'Product SKUs: ' || COUNT(*) FROM products
UNION ALL
SELECT 'TBWA Brands: ' || COUNT(*) FROM client_brands WHERE client_id = (SELECT id FROM clients WHERE client_code = 'TBWA-001');
EOF

# TBWA vs Competitor breakdown
echo -e "\n${YELLOW}TBWA vs Competitor Revenue:${NC}"
PGPASSWORD='Post_gres26!' psql -h localhost -p 5432 -U postgres -d scout_local -t << 'EOF'
WITH revenue_split AS (
  SELECT 
    CASE 
      WHEN cb.client_id IS NOT NULL THEN 'TBWA Brands'
      ELSE 'Competitors'
    END as brand_type,
    SUM(ti.quantity * ti.unit_price) as revenue
  FROM transaction_items ti
  JOIN products p ON ti.product_id = p.product_id
  JOIN brands b ON p.brand_id = b.brand_id
  LEFT JOIN client_brands cb ON b.brand_id = cb.brand_id 
    AND cb.client_id = (SELECT id FROM clients WHERE client_code = 'TBWA-001')
  GROUP BY CASE WHEN cb.client_id IS NOT NULL THEN 'TBWA Brands' ELSE 'Competitors' END
)
SELECT 
  brand_type || ': ₱' || TO_CHAR(revenue, 'FM999,999,999.00') || 
  ' (' || ROUND(revenue * 100.0 / SUM(revenue) OVER(), 1) || '%)'
FROM revenue_split
ORDER BY revenue DESC;
EOF

# Top regions
echo -e "\n${YELLOW}Top 5 Regions by Revenue:${NC}"
PGPASSWORD='Post_gres26!' psql -h localhost -p 5432 -U postgres -d scout_local -t << 'EOF'
SELECT 
  RPAD(s.region, 15) || ' | ' || 
  COUNT(DISTINCT t.id) || ' trans | ₱' || 
  TO_CHAR(SUM(t.total_amount), 'FM999,999.00')
FROM transactions t
JOIN stores s ON t.store_id = s.store_id
GROUP BY s.region
ORDER BY SUM(t.total_amount) DESC
LIMIT 5;
EOF

# Top TBWA brands
echo -e "\n${YELLOW}Top TBWA Brands:${NC}"
PGPASSWORD='Post_gres26!' psql -h localhost -p 5432 -U postgres -d scout_local -t << 'EOF'
SELECT 
  ROW_NUMBER() OVER (ORDER BY revenue DESC) || '. ' ||
  RPAD(brand_name, 20) || ' | ' || 
  units || ' units | ₱' || 
  TO_CHAR(revenue, 'FM999,999.00')
FROM (
  SELECT 
    b.brand_name,
    SUM(ti.quantity) as units,
    SUM(ti.quantity * ti.unit_price) as revenue
  FROM transaction_items ti
  JOIN products p ON ti.product_id = p.product_id
  JOIN brands b ON p.brand_id = b.brand_id
  JOIN client_brands cb ON b.brand_id = cb.brand_id
  WHERE cb.client_id = (SELECT id FROM clients WHERE client_code = 'TBWA-001')
  GROUP BY b.brand_name
  ORDER BY revenue DESC
  LIMIT 10
) top_brands;
EOF

# View status
echo -e "\n${YELLOW}Medallion Views Status:${NC}"
PGPASSWORD='Post_gres26!' psql -h localhost -p 5432 -U postgres -d scout_local -t << 'EOF'
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM silver_transactions LIMIT 1) THEN '✅'
    ELSE '❌'
  END || ' silver_transactions'
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM silver_products LIMIT 1) THEN '✅'
    ELSE '❌'
  END || ' silver_products'
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM silver_stores LIMIT 1) THEN '✅'
    ELSE '❌'
  END || ' silver_stores'
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM gold_executive_kpis LIMIT 1) THEN '✅'
    ELSE '❌'
  END || ' gold_executive_kpis'
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM gold_product_performance LIMIT 1) THEN '✅'
    ELSE '❌'
  END || ' gold_product_performance'
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM gold_store_performance LIMIT 1) THEN '✅'
    ELSE '❌'
  END || ' gold_store_performance';
EOF

echo -e "\n${GREEN}✨ Inspection complete!${NC}"