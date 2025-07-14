# TBWA Enterprise Data Platform Architecture

## Typical Tables per Schema

### HR / Admin (schema: hr_admin)
- employees
- departments
- payroll
- benefits
- time_tracking
- performance_reviews

### Finance (schema: financial_ops)
- invoices
- budgets
- forecasts
- expense_reports
- cost_centers
- financial_statements

### Operations (schema: operations)
- projects
- resources
- tasks
- logistics
- inventory
- vendor_management

### Corporate (schema: corporate)
- policies
- compliance_records
- legal_documents
- board_resolutions
- risk_assessments
- audit_logs

## The Complete Picture

```
                        TBWA Enterprise Data Platform
┌─────────────┬──────────┬──────────────┬──────────────┬─────────────┬────────────────┐
│ Scout Dash  │ HR Admin │ Finance Ops  │ Operations   │ Corporate   │ Creative       │
│             │          │              │ Hub          │ Portal      │ Insights       │
└─────────────┴──────────┴──────────────┴──────────────┴─────────────┴────────────────┘
                                    │
                Supabase PostgreSQL (single instance, multiple schemas)
        ┌─────────────┬──────────┬──────────────┬────────────┬──────────┐
        │ scout_dash  │ hr_admin │ financial_ops│ operations │ corporate│
        └─────────────┴──────────┴──────────────┴────────────┴──────────┘
                                    │  (read-only)
                              MCP Reader :8888
                                    │
                     ┌──────────────┴──────────────┐
                     │                             │
                  Claude                        Pulser                     ChatGPT
```

This gives TBWA a complete enterprise data platform with proper separation of concerns and unified access control! 🚀