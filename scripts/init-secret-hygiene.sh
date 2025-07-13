#!/usr/bin/env bash
set -euo pipefail

# Production-grade secret management setup script
# Run this once to set up proper credential hygiene

echo "🔐 Initializing Secret Management System..."

# 1. Install dependencies
echo "📦 Installing security tools..."

# Check OS and install accordingly
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    brew install sops age git-secrets direnv
    pip3 install pre-commit detect-secrets
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    # Install age
    wget -O age.tar.gz https://github.com/FiloSottile/age/releases/latest/download/age-v1.1.1-linux-amd64.tar.gz
    tar -xzf age.tar.gz
    sudo mv age/age /usr/local/bin/
    rm -rf age age.tar.gz
    
    # Install sops
    wget -O sops https://github.com/mozilla/sops/releases/latest/download/sops-v3.8.1.linux.amd64
    chmod +x sops
    sudo mv sops /usr/local/bin/
    
    pip3 install pre-commit detect-secrets
fi

# 2. Set up age encryption
echo "🔑 Setting up age encryption..."
if [ ! -f "$HOME/.config/age/keys.txt" ]; then
    mkdir -p "$HOME/.config/age"
    age-keygen -o "$HOME/.config/age/keys.txt"
    echo "✅ Age key generated at ~/.config/age/keys.txt"
    echo "⚠️  BACKUP THIS KEY SECURELY!"
else
    echo "✅ Age key already exists"
fi

export SOPS_AGE_KEY_FILE="$HOME/.config/age/keys.txt"
AGE_PUBLIC_KEY=$(grep -oP "public key: \K.*" "$HOME/.config/age/keys.txt")

# 3. Create directory structure
echo "📁 Creating secure directory structure..."
mkdir -p secrets
mkdir -p .github/workflows

# 4. Set up git-secrets
echo "🚫 Setting up git-secrets..."
git secrets --install
git secrets --register-aws
# Add custom patterns for common API keys
git secrets --add 'sk-[a-zA-Z0-9]{48}'  # OpenAI
git secrets --add 'sk-ant-[a-zA-Z0-9-]{95}'  # Anthropic
git secrets --add 'gsk_[a-zA-Z0-9]{52}'  # Groq
git secrets --add 'sbp_[a-zA-Z0-9]{40}'  # Supabase
git secrets --add 'eyJ[a-zA-Z0-9_-]{100,}'  # JWT tokens

# 5. Initialize pre-commit
echo "🪝 Setting up pre-commit hooks..."
pre-commit install
pre-commit autoupdate

# 6. Create example encrypted secrets file
echo "🔐 Creating example encrypted secrets..."
cat > secrets.yaml <<'EOF'
# Example secrets structure
bolt-app-hack:
  # Frontend only needs public keys
  VITE_SUPABASE_URL: https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY: your-anon-key
  VITE_MAPBOX_TOKEN: pk.your-token

bolt-api:
  # Server-side secrets
  SUPABASE_SERVICE_ROLE_KEY: your-service-key
  OPENAI_API_KEY: sk-your-key
  ANTHROPIC_API_KEY: sk-ant-your-key
  GROQ_API_KEY: gsk_your-key
  JWT_SECRET: your-jwt-secret
  DATABASE_URL: postgresql://user:pass@host/db

bolt-db:
  # Migration secrets
  SUPABASE_ACCESS_TOKEN: sbp_your-token
  SUPABASE_PROJECT_REF: your-project-ref
  DATABASE_ADMIN_URL: postgresql://admin:pass@host/db
EOF

# Encrypt the file
sops -e --age "$AGE_PUBLIC_KEY" secrets.yaml > secrets.enc.yaml
rm secrets.yaml

# 7. Create helper scripts
echo "📝 Creating helper scripts..."

# Decrypt script
cat > scripts/decrypt-secrets.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
export SOPS_AGE_KEY_FILE="$HOME/.config/age/keys.txt"
sops -d secrets.enc.yaml > secrets.yaml
echo "✅ Secrets decrypted to secrets.yaml"
EOF
chmod +x scripts/decrypt-secrets.sh

# Encrypt script
cat > scripts/encrypt-secrets.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
export SOPS_AGE_KEY_FILE="$HOME/.config/age/keys.txt"
AGE_PUBLIC_KEY=$(grep -oP "public key: \K.*" "$HOME/.config/age/keys.txt")
sops -e --age "$AGE_PUBLIC_KEY" secrets.yaml > secrets.enc.yaml
echo "✅ Secrets encrypted to secrets.enc.yaml"
EOF
chmod +x scripts/encrypt-secrets.sh

# Load secrets script
cat > scripts/load-secrets.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
MODULE="${1:-bolt-app-hack}"
export SOPS_AGE_KEY_FILE="$HOME/.config/age/keys.txt"

# Decrypt and extract module secrets
sops -d secrets.enc.yaml | yq eval ".$MODULE" - > .env.local
echo "✅ Loaded $MODULE secrets to .env.local"
EOF
chmod +x scripts/load-secrets.sh

# 8. Create GitHub workflow for secret validation
cat > .github/workflows/secret-scan.yml <<'EOF'
name: Secret Scanning

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  secret-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
    
    - name: Gitleaks Scan
      uses: zricethezav/gitleaks-action@v2
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Detect Secrets
      uses: reviewdog/action-detect-secrets@v0.20
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
EOF

# 9. Update package.json scripts
echo "📦 Updating package.json scripts..."
if command -v jq &> /dev/null; then
    jq '.scripts += {
        "secrets:decrypt": "./scripts/decrypt-secrets.sh",
        "secrets:encrypt": "./scripts/encrypt-secrets.sh",
        "secrets:load": "./scripts/load-secrets.sh",
        "security:scan": "git secrets --scan && detect-secrets scan",
        "security:audit": "npm audit && pre-commit run --all-files"
    }' package.json > package.json.tmp && mv package.json.tmp package.json
fi

# 10. Create documentation
cat > SECRETS_MANAGEMENT.md <<'EOF'
# Secret Management Guide

## Overview
This project uses a multi-layered approach to protect secrets:
- **sops + age** for encrypting secrets in the repo
- **git-secrets** to prevent accidental commits
- **pre-commit hooks** for automated scanning
- **Environment separation** between modules

## Quick Start

### 1. Load secrets for development
```bash
npm run secrets:load
```

### 2. Add a new secret
```bash
# Decrypt
npm run secrets:decrypt
# Edit secrets.yaml
# Encrypt
npm run secrets:encrypt
```

### 3. Rotate keys
See `scripts/rotate-keys.sh`

## Secret Storage by Environment

| Environment | Storage Method | Access |
|------------|---------------|---------|
| Local Dev | `.env.local` (gitignored) | Direct |
| CI/CD | GitHub Secrets | `${{ secrets.NAME }}` |
| Production | Platform env vars | UI/CLI |
| Team Share | `secrets.enc.yaml` | sops + age |

## Security Checklist
- [ ] Never commit `.env` files
- [ ] Use different keys per environment
- [ ] Rotate keys quarterly
- [ ] Audit access logs monthly
- [ ] Keep service keys server-side only
EOF

echo "✅ Secret management system initialized!"
echo ""
echo "📋 Next steps:"
echo "1. Backup your age key: cat ~/.config/age/keys.txt"
echo "2. Share the public key with your team"
echo "3. Run: npm run secrets:load"
echo "4. Commit the encrypted secrets.enc.yaml"
echo ""
echo "🔑 Your age public key:"
echo "$AGE_PUBLIC_KEY"