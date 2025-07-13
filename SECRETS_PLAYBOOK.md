# 🔐 Production-Grade Secrets Management Playbook

This playbook implements enterprise-level credential management across the three-module workspace (`bolt-app-hack`, `bolt-api`, `bolt-db`).

## 🎯 Quick Start

```bash
# One-time setup
./scripts/init-secret-hygiene.sh

# Daily use
./scripts/toggle-env-secure.sh local     # Local development
./scripts/toggle-env-secure.sh check     # Security audit
```

## 📊 Secret Classification Matrix

| Surface | Public Keys (Browser-Safe) | Private Keys (Server-Only) |
|---------|---------------------------|---------------------------|
| **Frontend** (`bolt-app-hack`) | `VITE_SUPABASE_ANON_KEY`<br>`VITE_MAPBOX_TOKEN` | ❌ None |
| **API** (`bolt-api`) | ❌ None | `SUPABASE_SERVICE_ROLE_KEY`<br>`OPENAI_API_KEY`<br>`ANTHROPIC_API_KEY`<br>`GROQ_API_KEY`<br>`JWT_SECRET` |
| **Database** (`bolt-db`) | ❌ None | `SUPABASE_ACCESS_TOKEN`<br>`DATABASE_URL`<br>`PGPASSWORD` |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Git Repository                     │
│                                                      │
│  ✅ .env.example     (template, committed)          │
│  ✅ secrets.enc.yaml (encrypted, committed)         │
│  ❌ .env             (active, gitignored)           │
│  ❌ .env.local       (dev secrets, gitignored)      │
│  ❌ secrets/         (raw secrets, gitignored)      │
└─────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────┐
│                 Secret Storage                       │
├─────────────────┬─────────────────┬─────────────────┤
│   Local Dev     │    CI/CD        │   Production    │
│                 │                 │                 │
│ .env.local      │ GitHub Secrets  │ Vercel Env Vars │
│ (gitignored)    │ (encrypted)     │ Render Env Vars │
│                 │                 │ (encrypted)     │
└─────────────────┴─────────────────┴─────────────────┘
```

## 🛡️ Security Layers

### 1. **Pre-commit Hooks** (First Line of Defense)
```yaml
# .pre-commit-config.yaml
- Gitleaks: Scans for 150+ secret patterns
- detect-secrets: Custom regex patterns
- git-secrets: AWS and custom patterns
```

### 2. **Encryption at Rest** (Team Sharing)
```bash
# Encrypt secrets for team sharing
sops -e secrets.yaml > secrets.enc.yaml

# Decrypt for local use
sops -d secrets.enc.yaml > .env.local
```

### 3. **Runtime Isolation** (Production Safety)
- Frontend: Only receives `VITE_` prefixed public keys
- API: Accesses service keys via environment variables
- Database: Migration scripts use separate credentials

## 📋 Implementation Guide

### Step 1: Initial Setup
```bash
# Install security tools
brew install sops age git-secrets direnv
pip3 install pre-commit detect-secrets

# Initialize
./scripts/init-secret-hygiene.sh
```

### Step 2: Configure Environments

#### Local Development (.env.local)
```bash
# Copy template
cp .env.example .env.local

# Add your keys
vim .env.local

# Use it
./scripts/toggle-env-secure.sh local
```

#### Encrypted Sharing (secrets.enc.yaml)
```bash
# Create team secrets
cat > secrets.yaml <<EOF
bolt-app-hack:
  VITE_SUPABASE_URL: https://xxx.supabase.co
  VITE_SUPABASE_ANON_KEY: eyJ...
bolt-api:
  SUPABASE_SERVICE_ROLE_KEY: eyJ...
  OPENAI_API_KEY: sk-...
EOF

# Encrypt with age
sops -e secrets.yaml > secrets.enc.yaml
git add secrets.enc.yaml
git commit -m "chore: update encrypted secrets"
```

### Step 3: Platform Configuration

#### Vercel
```bash
# Add secrets via CLI
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production

# Or via UI
# Project → Settings → Environment Variables
```

#### GitHub Actions
```bash
# Add via CLI
gh secret set SUPABASE_SERVICE_ROLE_KEY
gh secret set OPENAI_API_KEY

# Use in workflow
# ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

## 🔄 Key Rotation Process

```bash
# Quarterly rotation
./scripts/rotate-keys.sh

# Follow prompts to:
1. Generate new keys in provider dashboards
2. Update encrypted secrets
3. Deploy to all environments
4. Verify functionality
5. Revoke old keys
```

## 🚨 Common Pitfalls & Solutions

| Problem | Solution |
|---------|----------|
| Committed `.env` file | `git rm --cached .env && git commit` |
| API key in error message | Wrap in try-catch, log generic error |
| Service key in frontend | Move to API layer, use RPC |
| Hardcoded in Dockerfile | Use runtime ENV, not build ARG |
| Visible in browser DevTools | Only use `VITE_` prefix for public |

## 🧪 Security Verification

```bash
# Check current environment
./scripts/toggle-env-secure.sh check

# Scan entire repository
git secrets --scan
detect-secrets scan

# Test pre-commit hooks
echo "sk-1234567890abcdef" > test.txt
git add test.txt  # Should fail
```

## 📚 Module-Specific Notes

### bolt-app-hack (Frontend)
- ✅ Can have: `VITE_SUPABASE_ANON_KEY`
- ❌ Never have: Service role keys, API secrets
- Use: Supabase client with anon key only

### bolt-api (Backend)
- ✅ Has all service keys
- ❌ Never expose via API responses
- Use: Environment variables, not files

### bolt-db (Migrations)
- ✅ Admin credentials for migrations
- ❌ Never in application code
- Use: CI/CD secrets only

## 🎯 Best Practices Checklist

- [ ] Never commit `.env` files
- [ ] Use different keys per environment
- [ ] Rotate keys every 90 days
- [ ] Audit access logs monthly
- [ ] Keep service keys server-side only
- [ ] Use least-privilege principle
- [ ] Enable MFA on all providers
- [ ] Monitor for exposed keys (GitHub alerts)
- [ ] Document key purposes
- [ ] Test disaster recovery

## 🔑 Age Key Custody & Recovery

### Key Holders
The `age` private key (`~/.config/age/keys.txt`) is critical for decrypting team secrets.

**Primary Key Holder**: Team Lead / DevOps Engineer
**Backup Key Holders**: 
- CTO / Engineering Manager
- Senior Backend Engineer

### Key Storage
1. **Primary**: Password manager (1Password/Bitwarden team vault)
2. **Backup**: Encrypted USB drive in office safe
3. **Recovery**: Split key using Shamir's Secret Sharing (3-of-5 threshold)

### Recovery Process
If the primary age key is lost:
1. Retrieve from password manager backup
2. If unavailable, collect 3 of 5 key shares from holders
3. Reconstruct using: `ssss-combine -t 3`
4. Re-encrypt all secrets with new age key
5. Distribute new public key to team

### Key Rotation
- Age keys should be rotated annually
- Update `.sops.yaml` with new public key
- Re-encrypt all `secrets.enc.yaml` files
- Archive old keys for 90 days (for rollback)

## 🐳 Docker Secret Management

### Development (docker-compose.dev.yml)
```yaml
version: '3.8'

secrets:
  supabase_service_key:
    file: ./secrets/SUPABASE_SERVICE_ROLE_KEY
  openai_key:
    file: ./secrets/OPENAI_API_KEY

services:
  api:
    build: .
    secrets:
      - supabase_service_key
      - openai_key
    environment:
      SUPABASE_SERVICE_ROLE_KEY_FILE: /run/secrets/supabase_service_key
      OPENAI_API_KEY_FILE: /run/secrets/openai_key
```

### Production (Dockerfile)
```dockerfile
# Runtime secrets - NEVER in build args
FROM node:20-alpine
WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist

# Runtime reads secrets from mounted files
ENTRYPOINT ["node", "dist/index.js"]
# Expects: /run/secrets/supabase_service_key at runtime
```

### Verify No Secrets in Layers
```bash
# Check Docker image history
docker history your-image:latest --no-trunc | grep -E "(SECRET|KEY|PASSWORD)"

# Should return empty - no secrets in layers
```

## 🆘 Emergency Response

If a key is exposed:
1. **Rotate immediately** via provider dashboard
2. **Check logs** for unauthorized usage
3. **Update** all environments
4. **Notify** team and affected users
5. **Post-mortem** to prevent recurrence

---

Remember: **Security is a process, not a product.** Stay vigilant! 🛡️