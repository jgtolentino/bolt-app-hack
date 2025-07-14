# Claude Desktop MCP Configuration Guide

## 🚀 Complete MCP Setup for Claude Desktop

This guide will help you configure MCP (Model Context Protocol) servers for Claude Desktop, including filesystem access, Supabase, and other tools.

## 1. Locate Claude Desktop Config

The configuration file is located at:
- **macOS**: `~/.config/claude-desktop/config.json`
- **Windows**: `%APPDATA%\claude-desktop\config.json`
- **Linux**: `~/.config/claude-desktop/config.json`

## 2. Complete MCP Configuration

Create or update your `config.json` with the following configuration:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-filesystem",
        "/Users/tbwa/bolt-app-hack"
      ],
      "env": {}
    },
    "git": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-git"
      ],
      "env": {}
    },
    "github": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "supabase": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-postgres",
        "${SUPABASE_CONNECTION_STRING}"
      ],
      "env": {}
    },
    "sqlite": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-sqlite",
        "--db-path", "/Users/tbwa/bolt-app-hack/data/scout.db"
      ],
      "env": {}
    },
    "puppeteer": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-puppeteer"
      ],
      "env": {}
    },
    "memory": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-memory"
      ],
      "env": {}
    }
  }
}
```

## 3. Install Required MCP Servers

Open Terminal and install the MCP servers globally:

```bash
# Core MCP servers
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-git
npm install -g @modelcontextprotocol/server-github
npm install -g @modelcontextprotocol/server-postgres
npm install -g @modelcontextprotocol/server-sqlite
npm install -g @modelcontextprotocol/server-puppeteer
npm install -g @modelcontextprotocol/server-memory

# Optional: Install all at once
npm install -g \
  @modelcontextprotocol/server-filesystem \
  @modelcontextprotocol/server-git \
  @modelcontextprotocol/server-github \
  @modelcontextprotocol/server-postgres \
  @modelcontextprotocol/server-sqlite \
  @modelcontextprotocol/server-puppeteer \
  @modelcontextprotocol/server-memory
```

## 4. Project-Specific Configuration

For your specific projects, update the paths:

```json
{
  "mcpServers": {
    "filesystem-scout": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-filesystem",
        "/Users/tbwa/bolt-app-hack"
      ],
      "env": {}
    },
    "filesystem-hris": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-filesystem",
        "/Users/tbwa/projects/hris-fris"
      ],
      "env": {}
    },
    "supabase-scout": {
      "command": "node",
      "args": [
        "/Users/tbwa/bolt-app-hack/services/mcp-server/dist/index.js"
      ],
      "env": {
        "SUPABASE_URL": "https://baqlxgwdfjltivlfmsbr.supabase.co",
        "SUPABASE_SERVICE_KEY": "${SUPABASE_ANON_KEY}",
        "READ_ONLY": "true",
        "SEARCH_PATH": "scout_dash,public",
        "ALLOWED_SCHEMAS": "scout_dash,creative_insights,financial_ops,public",
        "DEFAULT_SCHEMA": "scout_dash"
      }
    }
  }
}
```

## 5. Environment Variables Setup

Create a `.env` file in your home directory for sensitive values:

```bash
# ~/.env
export GITHUB_TOKEN="ghp_your_github_token_here"
export SUPABASE_CONNECTION_STRING="postgresql://user:pass@host:5432/db"
export SUPABASE_ANON_KEY="your_supabase_anon_key"
```

Then source it in your shell profile:

```bash
# Add to ~/.zshrc or ~/.bashrc
source ~/.env
```

## 6. Custom MCP Server for Supabase Multi-Schema

If you've built the custom Supabase MCP server from our previous guide:

```json
{
  "mcpServers": {
    "supabase-multi-schema": {
      "command": "node",
      "args": [
        "/opt/mcp-server/dist/index.js"
      ],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_SERVICE_KEY": "${SUPABASE_ANON_KEY}",
        "READ_ONLY": "true",
        "SEARCH_PATH": "scout_dash,public",
        "ALLOWED_SCHEMAS": "scout_dash,creative_insights,financial_ops,public",
        "DEFAULT_SCHEMA": "scout_dash"
      }
    }
  }
}
```

## 7. Verify Installation

After setting up, restart Claude Desktop and verify the MCP servers are loaded:

1. **Check filesystem access**: Try reading a file
   ```
   Can you read the file at /Users/tbwa/bolt-app-hack/README.md?
   ```

2. **Check git access**: Try git operations
   ```
   Can you check the git status of the current repository?
   ```

3. **Check database access**: Try a query
   ```
   Can you query the scout_dash.transactions table?
   ```

## 8. Troubleshooting

### Common Issues:

1. **"No MCP servers configured"**
   - Make sure config.json is in the correct location
   - Restart Claude Desktop after making changes

2. **"MCP server failed to start"**
   - Check that the npm packages are installed globally
   - Verify the paths in your config are correct
   - Check Terminal for error messages

3. **"Permission denied"**
   - Ensure the filesystem paths have proper read/write permissions
   - On macOS, you may need to grant Terminal/Claude Desktop disk access in System Preferences

### Debug Mode:

Add debug logging to see what's happening:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-filesystem",
        "/Users/tbwa/bolt-app-hack",
        "--verbose"
      ],
      "env": {
        "DEBUG": "mcp:*"
      }
    }
  }
}
```

## 9. Quick Setup Script

Create a setup script `setup-mcp.sh`:

```bash
#!/bin/bash

echo "🚀 Setting up MCP for Claude Desktop"

# Create config directory
mkdir -p ~/.config/claude-desktop

# Install MCP servers
echo "📦 Installing MCP servers..."
npm install -g \
  @modelcontextprotocol/server-filesystem \
  @modelcontextprotocol/server-git \
  @modelcontextprotocol/server-github \
  @modelcontextprotocol/server-postgres \
  @modelcontextprotocol/server-sqlite

# Create config file
echo "📝 Creating config.json..."
cat > ~/.config/claude-desktop/config.json << 'EOF'
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-filesystem",
        "$HOME"
      ],
      "env": {}
    },
    "git": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-git"
      ],
      "env": {}
    }
  }
}
EOF

echo "✅ MCP setup complete!"
echo "🔄 Please restart Claude Desktop"
```

Make it executable and run:
```bash
chmod +x setup-mcp.sh
./setup-mcp.sh
```

## 10. Advanced Configuration

### Multiple Project Access:

```json
{
  "mcpServers": {
    "projects": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-filesystem",
        "/Users/tbwa/projects"
      ],
      "env": {}
    },
    "home": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-filesystem",
        "/Users/tbwa"
      ],
      "env": {}
    }
  }
}
```

### Security Considerations:

1. **Limit filesystem access** to specific project directories
2. **Use read-only mode** for sensitive directories
3. **Don't expose** service keys in the config
4. **Regular audits** of what directories Claude can access

## Summary

After following this guide, you should have:
- ✅ Filesystem access to your project directories
- ✅ Git operations capability
- ✅ Database query access
- ✅ GitHub integration
- ✅ Other MCP tools as needed

The key is ensuring:
1. The config.json is in the right location
2. The MCP servers are installed globally
3. The paths in your config match your system
4. Claude Desktop is restarted after changes

Once configured, you'll see the MCP tools available in Claude Desktop, enabling direct file operations, git commands, and database queries!