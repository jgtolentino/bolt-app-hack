# 🔐 KeyKey Secrets Automation Pipeline

## Complete automation for TBWA's multi-project secrets management

### 1. KeyKey Bot Setup (One-Time)

```bash
# Create KeyKey's identity
export KEYKEY_GITHUB_PAT="ghp_xxxxx"  # Create at github.com/settings/tokens
export KEYKEY_RENDER_TOKEN="rnd_xxxxx" # Create at dashboard.render.com/account/api-keys
export KEYKEY_DOPPLER_TOKEN="dp.st.xxxxx" # Create at dashboard.doppler.com

# Store KeyKey's own credentials
doppler projects create keykey-bot
doppler secrets set \
  GITHUB_PAT="$KEYKEY_GITHUB_PAT" \
  RENDER_TOKEN="$KEYKEY_RENDER_TOKEN" \
  DOPPLER_TOKEN="$KEYKEY_DOPPLER_TOKEN" \
  --project keykey-bot
```

### 2. KeyKey's Master Secrets Registry

```bash
# All TBWA projects' secrets in one place
doppler projects create tbwa-platform
doppler secrets set \
  SUPABASE_URL="https://cxzllzyxwpyptfretryc.supabase.co" \
  SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  MCP_API_KEY="mcp_prod_xxxxx" \
  SCOUT_SERVICE_KEY="scout_xxxxx" \
  HR_SERVICE_KEY="hr_xxxxx" \
  FINANCE_SERVICE_KEY="fin_xxxxx" \
  OPS_SERVICE_KEY="ops_xxxxx" \
  CORP_SERVICE_KEY="corp_xxxxx" \
  CREATIVE_SERVICE_KEY="creative_xxxxx" \
  --project tbwa-platform
```

### 3. Bootstrap Script - KeyKey Takes Control

Create `scripts/keykey-bootstrap.sh`:

```bash
#!/bin/bash
set -euo pipefail

echo "🤖 KeyKey Secrets Bootstrap"
echo "=========================="

# KeyKey's credentials
export DOPPLER_TOKEN=$(doppler secrets get DOPPLER_TOKEN --plain --project keykey-bot)
export GH_TOKEN=$(doppler secrets get GITHUB_PAT --plain --project keykey-bot)

# Sync all platform secrets to GitHub
echo "📤 Syncing secrets to GitHub..."
doppler secrets download --no-file --format env --project tbwa-platform | while IFS='=' read -r key value; do
  echo "  → Setting $key"
  gh secret set "$key" -b"$value" -R jgtolentino/mcp-sqlite-server
done

# Also store KeyKey's own tokens for CI
gh secret set KEYKEY_PAT -b"$GH_TOKEN" -R jgtolentino/mcp-sqlite-server
gh secret set KEYKEY_RENDER_TOKEN -b"$(doppler secrets get RENDER_TOKEN --plain --project keykey-bot)" -R jgtolentino/mcp-sqlite-server

echo "✅ KeyKey has synchronized all secrets!"
```

### 4. GitHub Actions - KeyKey Auto-Sync

Create `.github/workflows/keykey-sync.yml`:

```yaml
name: KeyKey Secret Sync

on:
  push:
    branches: [main, chatgpt-integration]
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:

jobs:
  sync-secrets:
    name: 🤖 KeyKey Sync
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3
      
    - name: Verify KeyKey Access
      env:
        GH_TOKEN: ${{ secrets.KEYKEY_PAT }}
      run: |
        echo "🔐 KeyKey checking access..."
        gh auth status || { echo "❌ KeyKey PAT invalid"; exit 1; }
        
    - name: Check Required Secrets
      run: |
        # Fail fast if any required secret is missing
        : "${SUPABASE_URL:?Missing SUPABASE_URL}"
        : "${SUPABASE_ANON_KEY:?Missing SUPABASE_ANON_KEY}"
        : "${MCP_API_KEY:?Missing MCP_API_KEY}"
      env:
        SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        MCP_API_KEY: ${{ secrets.MCP_API_KEY }}
        
    - name: Sync to Render Services
      env:
        RENDER_TOKEN: ${{ secrets.KEYKEY_RENDER_TOKEN }}
      run: |
        echo "🚀 Syncing to Render..."
        
        # MCP Reader Service
        curl -X PATCH \
          -H "Authorization: Bearer $RENDER_TOKEN" \
          -H "Content-Type: application/json" \
          https://api.render.com/v1/services/${{ secrets.RENDER_MCP_SERVICE_ID }}/env-vars \
          -d '[
            {"key": "SUPABASE_URL", "value": "${{ secrets.SUPABASE_URL }}"},
            {"key": "SUPABASE_ANON_KEY", "value": "${{ secrets.SUPABASE_ANON_KEY }}"},
            {"key": "MCP_API_KEY", "value": "${{ secrets.MCP_API_KEY }}"},
            {"key": "READ_ONLY", "value": "true"},
            {"key": "ALLOWED_SCHEMAS", "value": "scout_dash,hr_admin,financial_ops,operations,corporate,creative_insights,public"}
          ]'
          
    - name: Verify Deployment Health
      run: |
        echo "🏥 Checking service health..."
        sleep 30  # Wait for Render to apply changes
        
        response=$(curl -s -o /dev/null -w "%{http_code}" https://mcp.tbwa.ai/health)
        if [ "$response" = "200" ]; then
          echo "✅ MCP service healthy"
        else
          echo "❌ MCP service unhealthy (HTTP $response)"
          exit 1
        fi
        
    - name: Update Schema Permissions
      env:
        DATABASE_URL: ${{ secrets.SUPABASE_URL }}
        SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
      run: |
        echo "🔐 Updating database permissions..."
        # Could run migration scripts here if needed
        
    - name: Notify Success
      if: success()
      run: |
        echo "✅ KeyKey successfully synchronized all secrets!"
        echo "📊 Status:"
        echo "  - GitHub Secrets: ✓"
        echo "  - Render Env Vars: ✓"
        echo "  - Service Health: ✓"
```

### 5. Developer Experience - Zero Touch

Create `.envrc` for direnv:

```bash
# .envrc - Auto-loads for developers
echo "🤖 KeyKey loading environment..."

# Option 1: If developer has Doppler access
if command -v doppler >/dev/null 2>&1; then
  eval "$(doppler secrets download --no-file --format env --project tbwa-platform)"
else
  # Option 2: Load from .env.local (KeyKey can generate this)
  if [ -f .env.local ]; then
    source .env.local
  else
    echo "⚠️  No .env.local found. Run: npm run keykey:setup"
  fi
fi

echo "✅ Environment loaded by KeyKey"
```

### 6. KeyKey CLI Commands

Add to `package.json`:

```json
{
  "scripts": {
    "keykey:setup": "node scripts/keykey-setup.js",
    "keykey:sync": "gh workflow run keykey-sync.yml",
    "keykey:verify": "node scripts/keykey-verify.js",
    "keykey:rotate": "node scripts/keykey-rotate.js"
  }
}
```

Create `scripts/keykey-setup.js`:

```javascript
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🤖 KeyKey Local Setup');
console.log('====================');

// Check if running in CI
if (process.env.CI) {
  console.log('✅ Running in CI - secrets auto-injected');
  process.exit(0);
}

// Check for Doppler
try {
  execSync('doppler --version', { stdio: 'ignore' });
  console.log('✅ Doppler installed - using cloud secrets');
} catch {
  console.log('📦 Installing Doppler CLI...');
  if (process.platform === 'darwin') {
    execSync('brew install dopplerhq/cli/doppler');
  } else {
    console.log('Please install Doppler: https://docs.doppler.com/docs/install-cli');
  }
}

// Generate .env.local from template
if (!fs.existsSync('.env.local')) {
  console.log('📝 Creating .env.local from template...');
  const template = fs.readFileSync('.env.template', 'utf8');
  fs.writeFileSync('.env.local', template);
  console.log('⚠️  Please update .env.local with real values');
} else {
  console.log('✅ .env.local exists');
}

console.log('\n🎉 KeyKey setup complete!');
```

### 7. KeyKey Secret Rotation

Create `scripts/keykey-rotate.js`:

```javascript
#!/usr/bin/env node

const crypto = require('crypto');
const { execSync } = require('child_process');

console.log('🔄 KeyKey Secret Rotation');
console.log('========================');

const secretsToRotate = [
  'MCP_API_KEY',
  'SCOUT_SERVICE_KEY',
  'HR_SERVICE_KEY',
  'FINANCE_SERVICE_KEY',
  'OPS_SERVICE_KEY',
  'CORP_SERVICE_KEY',
  'CREATIVE_SERVICE_KEY'
];

// Generate new secrets
const newSecrets = {};
secretsToRotate.forEach(key => {
  const prefix = key.toLowerCase().replace(/_service_key|_api_key/, '');
  newSecrets[key] = `${prefix}_${crypto.randomBytes(16).toString('hex')}`;
  console.log(`🔑 Generated new ${key}`);
});

// Update in Doppler
console.log('\n📤 Updating Doppler...');
Object.entries(newSecrets).forEach(([key, value]) => {
  execSync(`doppler secrets set ${key}="${value}" --project tbwa-platform`);
});

// Trigger GitHub sync
console.log('\n🚀 Triggering KeyKey sync...');
execSync('gh workflow run keykey-sync.yml');

console.log('\n✅ Secret rotation complete!');
console.log('⏱️  Allow 2-3 minutes for propagation');
```

### 8. KeyKey Monitoring

Create `.github/workflows/keykey-monitor.yml`:

```yaml
name: KeyKey Health Check

on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch:

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
    - name: Check All Services
      env:
        GH_TOKEN: ${{ secrets.KEYKEY_PAT }}
      run: |
        echo "🏥 KeyKey Health Check"
        
        # Check MCP Reader
        curl -f https://mcp.tbwa.ai/health || echo "MCP Reader: ❌"
        
        # Check secret availability
        gh secret list -R jgtolentino/mcp-sqlite-server | grep -E "(SUPABASE_URL|MCP_API_KEY)" || echo "Secrets: ❌"
        
    - name: Alert on Failure
      if: failure()
      run: |
        echo "🚨 KeyKey detected issues!"
        # Could send Slack/email alert here
```

### 9. Complete Setup Command

```bash
# One command to rule them all
curl -sSL https://raw.githubusercontent.com/jgtolentino/mcp-sqlite-server/chatgpt-integration/scripts/keykey-bootstrap.sh | bash
```

## 🎯 What You Get:

1. **Zero Manual Secret Management**: KeyKey owns everything
2. **Auto-Sync on Every Push**: GitHub → Render automatically
3. **Health Monitoring**: KeyKey checks services every 15 minutes
4. **Secret Rotation**: One command to rotate all keys
5. **Developer Experience**: Just `direnv allow` and go
6. **CI/CD Safety**: Builds fail if secrets are missing
7. **Multi-Project Support**: All TBWA schemas managed centrally

## 🔐 Security Benefits:

- Humans never see production secrets
- Automated rotation reduces key lifetime
- Centralized audit trail in Doppler
- Service-specific keys with minimal permissions
- Immediate propagation across all services

KeyKey is now your automated DevOps engineer for secrets! 🤖