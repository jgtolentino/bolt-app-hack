# Manual Environment Variable Setup

Since the CLI tools require project linking, please add the following environment variable manually:

## Environment Variable to Add:
```
VITE_GADM_BASE_URL=https://baqlxgwdfjltivlfmsbr.supabase.co/storage/v1/object/public/geo
```

## For Netlify:

1. **Direct link**: https://app.netlify.com/sites/thunderous-jalebi-6f0dc7/settings/env
2. Click **"Add a variable"**
3. Add:
   - Key: `VITE_GADM_BASE_URL`
   - Value: `https://baqlxgwdfjltivlfmsbr.supabase.co/storage/v1/object/public/geo`
4. Click **"Save"**
5. **Redeploy**: Go to Deploys tab → **"Trigger deploy"** → **"Clear cache and deploy site"**

## For Vercel:

1. Go to https://vercel.com/dashboard
2. Find and click on your `bolt-app-hack` project
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Add:
   - Key: `VITE_GADM_BASE_URL`
   - Value: `https://baqlxgwdfjltivlfmsbr.supabase.co/storage/v1/object/public/geo`
   - Select all environments: ✓ Production, ✓ Preview, ✓ Development
6. Click **"Save"**
7. **Redeploy** from the project dashboard

## What This Fixes:

- ✅ CORS errors when loading Philippine geographic data
- ✅ Map fallback to mock data
- ✅ Geographic analytics page loading issues
- ✅ Region boundaries not displaying

## Verification:

After redeployment, visit `/geography` or `/overview` pages and check:
1. Browser console should have no CORS errors
2. Map should show actual Philippine regions (not mock rectangles)
3. Geographic data should load from Supabase CDN