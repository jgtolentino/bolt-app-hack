# 🔑 Supabase Database Password Guide

## Where to Find Your Database Password

### Step 1: Go to Database Settings
1. Open: https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/settings/database
2. You'll see a page with "Database Settings"

### Step 2: Look for "Connection String" Section
Look for a section that shows:
- **Connection string** 
- **Connection pooling**
- **Direct connection**

### Step 3: Find the Password
The password is shown in the connection string. It will look something like:
```
postgresql://postgres:[YOUR-PASSWORD-HERE]@db.baqlxgwdfjltivlfmsbr.supabase.co:5432/postgres
```

The password is the part between `postgres:` and `@db.`

**Alternative**: There might be a "Reset Database Password" button if you can't see it.

## How to Use the Password

### When Running Deployment Script:

```bash
./scripts/deploy-mcp-server.sh
```

When you see:
```
Enter your database password:
```

Type (or paste) your password and press Enter. 
**Note**: The password won't show on screen as you type (for security).

### When Running Supabase DB Push:

```bash
supabase db push
```

You'll see:
```
Enter your database password:
```

Paste your password and press Enter.

## 🚨 Common Issues

### "I don't see a password"
- Look for a "Reveal" or "Show" button next to the connection string
- Or use the "Reset Database Password" option to create a new one

### "Password authentication failed"
- Make sure you're copying ONLY the password part
- Don't include the `:` or `@` symbols
- Remove any spaces before/after

### "Connection string is hidden"
Some browsers hide passwords. Try:
- Click the "eye" icon to reveal
- Or copy the entire connection string and extract the password

## 📝 Example

If your connection string is:
```
postgresql://postgres:MySecretPass123@db.baqlxgwdfjltivlfmsbr.supabase.co:5432/postgres
```

Your password is: `MySecretPass123`

## 🔄 Alternative: Reset Password

If you can't find the password:
1. Go to Database Settings
2. Click "Reset Database Password"
3. Save the new password somewhere safe
4. Use the new password for deployment

## Need More Help?

The password is specifically for the PostgreSQL database, not your Supabase dashboard login. It's usually a long, random string for security.