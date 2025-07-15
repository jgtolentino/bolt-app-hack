# 📊 TBWA Unified Platform Database Visualization

## 🔗 Interactive ER Diagram

To visualize the complete database schema:

1. **Visit**: [dbdiagram.io](https://dbdiagram.io/)
2. **Click**: "Create new diagram"
3. **Copy & Paste**: The entire contents of `tbwa-unified-platform.dbml`
4. **View**: Interactive ER diagram with relationships

## 🎨 Key Visual Elements

### Color-Coded Modules
- **🎨 Lions Palette** (Purple): `campaigns` table
- **🛍️ Scout Analytics** (Blue): `handshake_events`, `transactions`, `stores`, `products`
- **👥 HRIS** (Green): `employees`, `attendance`, `expenses`
- **🧠 AI Insights** (Orange): `insight_correlations`, `performance_metrics`

### Relationship Types
- **One-to-Many**: Employee → Attendance, Employee → Expenses
- **Many-to-Many (Arrays)**: Campaigns ↔ Handshake Events
- **Reference Links**: Store → Transactions, Product → Transaction Items

## 📈 Performance Views

The diagram will show these materialized views:
- `campaign_performance_view` - Campaign effectiveness with cross-platform metrics
- `employee_attendance_summary_view` - Employee performance analytics
- `regional_performance_view` - Geographic business intelligence
- `product_performance_view` - Product sales analytics
- `daily_kpi_summary_view` - Daily dashboard metrics

## 🔍 Schema Statistics

```
📊 Database Overview:
├── 12 Core Tables
├── 5 Materialized Views 
├── 50+ Performance Indexes
├── 5 Enum Types
├── 8 Foreign Key Relationships
└── JSONB + Array Support
```

## 🌏 Philippine Context Features

- **18 Regional Divisions**: Full Philippine geographic coverage
- **Local Payment Methods**: Cash, GCash, Utang/Lista, Credit Cards
- **Store Types**: Sari-sari, Mall, Department, Convenience
- **Cultural Demographics**: Age groups, gender, preferences

## 🚀 Quick Commands

### Generate SQL from DBML
```bash
npm install -g @dbml/cli
dbml2sql database/tbwa-unified-platform.dbml --postgres
```

### Generate SVG Diagram
```bash
dbml2svg database/tbwa-unified-platform.dbml -o database/docs/erd.svg
```

### Validate Schema
```bash
dbml-cli validate database/tbwa-unified-platform.dbml
```

---

**Pro Tip**: The DBML file is over 300 lines and shows the complete integration of Lions Palette, Scout Analytics, and HRIS systems in a single, cohesive database design! 🎯