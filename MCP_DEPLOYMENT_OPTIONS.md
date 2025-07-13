# 🚀 MCP Deployment - 3 Ways to Deploy

Since you're not seeing the interactive password prompt, here are 3 different ways to deploy:

## Option 1: Direct Password Method

```bash
# Run with your password as an argument
./deploy-mcp-direct.sh YOUR_DATABASE_PASSWORD_HERE

# Example:
./deploy-mcp-direct.sh MySecretPassword123
```

## Option 2: Environment Variable Method

```bash
# Set password in environment variable
export SUPABASE_DB_PASSWORD="YOUR_DATABASE_PASSWORD_HERE"

# Then run deployment
supabase db push

# Deploy functions
supabase functions deploy mcp-register-agent
supabase functions deploy mcp-store-context
supabase functions deploy mcp-execute-tool
supabase functions deploy mcp-send-message
```

## Option 3: Direct Database URL Method

```bash
# Use the full database URL with password
supabase db push --db-url "postgresql://postgres:YOUR_PASSWORD@db.baqlxgwdfjltivlfmsbr.supabase.co:5432/postgres"

# Then deploy functions
supabase functions deploy mcp-register-agent
supabase functions deploy mcp-store-context
supabase functions deploy mcp-execute-tool
supabase functions deploy mcp-send-message
```

## 🔑 Getting Your Password

1. Go to: https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/settings/database
2. Look for "Connection string" section
3. Find the password in the string: `postgres:PASSWORD@db.`
4. Copy only the PASSWORD part

## 📝 Example

If your connection string shows:
```
postgresql://postgres:abc123xyz@db.baqlxgwdfjltivlfmsbr.supabase.co:5432/postgres
```

Your password is: `abc123xyz`

Then run:
```bash
./deploy-mcp-direct.sh abc123xyz
```

## 🧪 After Deployment

Test everything works:
```bash
npx tsx src/test-mcp-integration.ts
```

## ⚠️ Security Note

Don't commit your password to git! After deployment, the password is not stored anywhere in your code.