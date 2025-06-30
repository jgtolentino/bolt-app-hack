# Cruip Template Re-sync Implementation Plan

## Overview
Re-sync with Cruip Mosaic Lite template (Tailwind v4) while preserving Scout-specific functionality.

## Pre-Implementation Checklist

### 1. Backup Current State
```bash
# Create a backup branch
git checkout -b pre-cruip-resync-backup
git push origin pre-cruip-resync-backup
git checkout main
```

### 2. Document Current Custom Features
- [ ] List all Scout-specific routes
- [ ] Document Supabase hooks and queries
- [ ] Map AI/ML integrations
- [ ] Note custom components (KpiCard, ChartPanel, etc.)
- [ ] Record filter logic implementation

## Implementation Steps

### Phase 1: Setup Cruip as Submodule
```bash
# Add Cruip upstream
git submodule add https://github.com/cruip/tailwind-dashboard-template.git vendor/cruip
cd vendor/cruip
git checkout main  # or specific version tag
cd ../..
git add .gitmodules vendor/cruip
git commit -m "feat: add Cruip template as submodule"
```

### Phase 2: Create Folder Structure
```bash
# Create clean separation
mkdir -p src/template_sync
mkdir -p src/features/{transactions,filters,ai,dashboard}
```

### Phase 3: Sync Template Files
```bash
# Copy only presentation layer
rsync -av --delete \
  vendor/cruip/src/layouts/ \
  src/template_sync/layouts/

rsync -av --delete \
  vendor/cruip/src/partials/ \
  src/template_sync/partials/

rsync -av --delete \
  vendor/cruip/src/components/ \
  src/template_sync/components/

rsync -av --delete \
  vendor/cruip/src/css/ \
  src/template_sync/css/
```

### Phase 4: Migrate Business Logic
```bash
# Move Scout-specific code to features
mv src/services/optimizedDataService.ts src/features/transactions/
mv src/hooks/useOptimizedData.ts src/features/transactions/
mv src/stores/filterStore.ts src/features/filters/
mv src/components/ai/* src/features/ai/
```

### Phase 5: Tailwind v4 Upgrade
```bash
# Backup current config
mv tailwind.config.js tailwind.config.v3.bak

# Copy v4 config
cp vendor/cruip/tailwind.config.js .

# Update dependencies
npm install -D tailwindcss@next @tailwindcss/forms@next

# Rebuild CSS
npx tailwindcss -i ./src/index.css -o ./src/output.css --watch
```

### Phase 6: Adapter Pattern Implementation

Create adapter components that bridge Cruip charts with Scout data:

```tsx
// src/features/dashboard/adapters/SalesChartAdapter.tsx
import { LineChart01 } from '@/template_sync/components/charts/LineChart01';
import { useTransactionsTrend } from '@/features/transactions/hooks';

export function SalesChartAdapter({ filters }) {
  const { data, isLoading } = useTransactionsTrend(filters);
  
  // Transform Scout data to Cruip chart format
  const chartData = {
    labels: data?.map(d => d.date) || [],
    datasets: [{
      label: 'Sales',
      data: data?.map(d => d.sales) || [],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
    }]
  };

  return <LineChart01 data={chartData} width={389} height={128} />;
}
```

### Phase 7: Global Context Setup

```tsx
// src/features/filters/GlobalFilterContext.tsx
export const GlobalFilterContext = createContext({
  region: '',
  timeRange: 'last7days',
  // ... other filters
});

// Wrap app with provider
<GlobalFilterContext.Provider value={filters}>
  <DashboardTemplate>
    {/* Scout pages here */}
  </DashboardTemplate>
</GlobalFilterContext.Provider>
```

## Post-Implementation Tasks

### 1. Class Migration Checklist
- [ ] Replace `bg-gray-X00` → `bg-surface-X00`
- [ ] Update `text-gray-X00` → `text-content-X00`
- [ ] Fix spacing utilities (if changed in v4)
- [ ] Update component variants

### 2. Testing Protocol
```bash
# Unit tests for adapters
npm test src/features/dashboard/adapters

# E2E visual regression
npm run test:visual

# Performance benchmarks
npm run lighthouse
```

### 3. CI/CD Updates
```yaml
# .github/workflows/cruip-sync.yml
name: Cruip Template Sync Check
on:
  schedule:
    - cron: '0 0 * * MON'  # Weekly check
jobs:
  check-updates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true
      - name: Check for Cruip updates
        run: |
          cd vendor/cruip
          git fetch origin
          if [ $(git rev-parse HEAD) != $(git rev-parse origin/main) ]; then
            echo "Updates available"
            # Create PR with diff
          fi
```

## Folder Structure After Re-sync

```
src/
├── template_sync/          # Cruip template (don't modify)
│   ├── layouts/
│   ├── partials/
│   ├── components/
│   └── css/
├── features/               # Scout business logic
│   ├── transactions/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── adapters/
│   ├── filters/
│   │   └── GlobalFilterContext.tsx
│   ├── ai/
│   │   ├── components/
│   │   └── services/
│   └── dashboard/
│       └── adapters/       # Bridges Cruip + Scout
└── pages/                  # Route components
    ├── Dashboard.tsx       # Uses template + adapters
    └── TransactionAnalysis.tsx
```

## Success Criteria

1. **Visual Polish**: Dashboard matches Cruip's design quality
2. **Data Integration**: All Scout data flows through adapters
3. **Maintainability**: Can pull Cruip updates without breaking
4. **Performance**: Tailwind v4 reduces CSS bundle by ~30%
5. **Developer Experience**: Clear separation of concerns

## Rollback Plan

If issues arise:
```bash
git checkout pre-cruip-resync-backup
git checkout -b main-rollback
git push origin main-rollback --force-with-lease
```

## Timeline Estimate

- Phase 1-2: 1 hour (setup)
- Phase 3-4: 2-3 hours (file migration)
- Phase 5: 1-2 hours (Tailwind upgrade)
- Phase 6-7: 4-6 hours (adapter implementation)
- Testing: 2-3 hours

**Total: 1-2 days of focused work**