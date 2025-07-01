# Claude Assistant Guidelines

## Make Links Clickable

**IMPORTANT**: Always make links clickable for the user by using markdown link syntax:
- ❌ Bad: `https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/sql`
- ✅ Good: [Open Supabase SQL Editor](https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/sql)

This makes it easier for users to click directly instead of copy-pasting URLs.

## Console Error Verification

**IMPORTANT**: Always verify console errors before claiming success. Follow these guidelines:

### 1. Check Browser Console
Before declaring any feature or fix as "complete" or "successful":
- Open browser developer tools (F12)
- Check the Console tab for errors
- Look for:
  - Red error messages
  - Failed network requests (404, 500, etc.)
  - JavaScript runtime errors
  - React warnings or errors

### 2. Common Error Types to Watch For

#### Network/API Errors
```
Failed to load resource: the server responded with a status of 404 ()
Failed to load resource: the server responded with a status of 400 ()
```
These indicate missing endpoints or incorrect API calls.

#### Supabase Errors
```
Supabase request failed Object
Query [name] failed: Object
```
These indicate database queries are failing.

#### React Errors
```
Cannot read properties of undefined
Cannot access before initialization
```
These indicate component logic errors.

### 3. Verification Checklist
Before claiming success:
- [ ] No red errors in console
- [ ] All network requests return 200/201/204 status
- [ ] No React warnings (yellow messages)
- [ ] Data is actually displaying in the UI
- [ ] Interactive elements are clickable and functional

### 4. If Errors Exist
1. **Don't claim success** - be honest about remaining issues
2. **Identify the root cause** - check error stack traces
3. **Fix systematically** - address errors one by one
4. **Test the fix** - refresh and check console again
5. **Only claim success after verification** - when console is clean

### 5. Example Response Format

❌ **Bad**: "✅ Successfully fixed all errors!"

✅ **Good**: 
```
I've implemented a fix for the data fetching errors. Let me verify:

Console Status:
- ❌ Still seeing 404 errors for materialized views
- ❌ Supabase queries failing
- ✅ React Router warnings resolved

The dashboard still has data fetching issues. Let me fix these...
```

## Project-Specific Context

### Current Known Issues
1. **Materialized Views**: Many don't exist in the database
   - `mv_hourly_patterns`
   - `mv_daily_sales`
   - `mv_product_performance`
   - `mv_product_mix`
   - RPC function `get_kpi_metrics`

2. **Fallback Strategy**: Use direct table queries when views are missing
   - Query `transactions` table directly
   - Join with `stores`, `products`, `transaction_items` as needed
   - Calculate aggregations in JavaScript

### Database Schema
- Main tables: `transactions`, `stores`, `products`, `transaction_items`
- Regions: 18 Philippine regions
- Branding: Use "Suqi" not "suki"

### Design System
- Golden ratio implemented (φ ≈ 1.618)
- 12-column grid system
- Widget components: KpiCard, ChartPanel, InsightCard, RankedList
- Central formatters for consistency

## Development Workflow

1. **Make changes**
2. **Check console for errors**
3. **Fix any errors found**
4. **Verify fix in console**
5. **Only then commit and push**

Remember: Users trust accurate status reports. Always verify before claiming success!