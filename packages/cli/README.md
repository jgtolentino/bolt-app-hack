# Scout CLI

The official command-line interface for Scout Dashboard development, deployment, and marketplace publishing.

## Installation

```bash
npm install -g @scout/cli
```

## Quick Start

```bash
# Initialize a new dashboard project
scout init my-dashboard --template basic
cd my-dashboard

# Build the dashboard from blueprint
scout dash build dashboard.json --output ./dist

# Start development server
scout dev

# Publish to marketplace
scout dash publish ./dist --channel beta
```

## Commands

### Dashboard Management

#### `scout dash build <blueprint>`

Build a dashboard from JSON blueprint with automatic plugin/connector resolution.

```bash
# Basic build
scout dash build dashboard.json

# Specify output and target
scout dash build dashboard.json \
  --output ./dist \
  --target desktop \
  --env production

# Skip plugins and signature
scout dash build dashboard.json \
  --skip-plugins \
  --skip-signature
```

**Options:**
- `-o, --output <path>` - Output directory (default: ./dist)
- `-t, --target <target>` - Build target: desktop, web, both (default: both)
- `-e, --env <environment>` - Environment config to use
- `--skip-plugins` - Skip plugin installation
- `--skip-signature` - Skip artifact signing
- `-v, --verbose` - Verbose output

#### `scout dash publish <path>`

Publish built dashboard to Scout Marketplace.

```bash
# Publish to stable channel
scout dash publish ./dist

# Publish to beta with notes
scout dash publish ./dist \
  --channel beta \
  --notes "Q2 2024 performance improvements"

# Dry run
scout dash publish ./dist --dry-run
```

**Options:**
- `-c, --channel <channel>` - Release channel: stable, beta, alpha, dev (default: stable)
- `-n, --notes <notes>` - Release notes
- `-f, --force` - Force publish without confirmation
- `--dry-run` - Simulate publish without uploading
- `-v, --verbose` - Verbose output

### Import Tools

#### `scout import <type> <file>`

Import PowerBI/Tableau files and convert to Scout blueprints.

```bash
# Import PowerBI file to Scout format
scout import pbix sales-report.pbix --to-blueprint

# Import with custom output
scout import twbx dashboard.twbx \
  --to-blueprint \
  --output ./imported \
  --format yaml

# Interactive import
scout import pbix report.pbix --interactive
```

**Supported Types:**
- `pbix` - PowerBI Desktop files
- `pbit` - PowerBI templates
- `pbip` - PowerBI projects
- `twb` - Tableau workbooks
- `twbx` - Tableau packaged workbooks
- `hyper` - Tableau extracts

**Options:**
- `--to-blueprint` - Generate Scout blueprint JSON
- `-o, --output <path>` - Output directory (default: ./imported)
- `-f, --format <format>` - Output format: json, yaml (default: json)
- `-i, --interactive` - Interactive mode for configuration
- `-v, --verbose` - Verbose output

### Project Management

#### `scout init [directory]`

Initialize new Scout dashboard project.

```bash
# Basic dashboard
scout init my-dashboard

# With template
scout init analytics-dash --template analytics

# In current directory
scout init . --template basic
```

**Available Templates:**
- `basic` - Simple sales dashboard
- `analytics` - Advanced analytics with plugins
- `minimal` - Minimal starter template
- `enterprise` - Full-featured enterprise template

#### `scout validate <blueprint>`

Validate dashboard blueprint against schema.

```bash
scout validate dashboard.json
scout validate dashboard.json --strict
```

#### `scout dev`

Start development server with hot reload.

```bash
scout dev
scout dev --port 3001 --host 0.0.0.0
```

### Plugin Management

#### `scout plugin`

Manage dashboard plugins.

```bash
# List installed plugins
scout plugin --list

# Install plugin
scout plugin --install basket-affinity-sankey

# Update all plugins
scout plugin --update

# Uninstall plugin
scout plugin --uninstall old-plugin
```

### Connector Management

#### `scout connector`

Manage data connectors.

```bash
# List available connectors
scout connector --list

# Test connection
scout connector --test supabase

# Configure connector
scout connector --configure postgres
```

### Marketplace

#### `scout marketplace`

Browse and manage marketplace content.

```bash
# List available dashboards
scout marketplace --list

# Search marketplace
scout marketplace --search "sales analytics"

# Install dashboard
scout marketplace --install "advanced-sales-dashboard"
```

## Blueprint Schema

Scout 3.0 uses an enhanced JSON schema that's backward-compatible with Dash 2.0:

```json
{
  "version": "3.0",
  "title": "My Dashboard",
  "description": "Dashboard description",
  "layout": "grid",
  "datasource": "supabase",
  
  "charts": [
    {
      "id": "kpi_sales",
      "type": "kpi.card",
      "query": "SELECT SUM(amount) FROM sales",
      "position": { "x": 0, "y": 0, "w": 3, "h": 2 }
    },
    {
      "id": "trend_chart", 
      "type": "line.basic",
      "query": "SELECT date, SUM(amount) FROM sales GROUP BY date",
      "position": { "x": 3, "y": 0, "w": 6, "h": 4 }
    },
    {
      "id": "custom_viz",
      "type": "plugin:basket-affinity-sankey",
      "query": "CALL affinity_matrix()",
      "position": { "x": 0, "y": 4, "w": 12, "h": 6 }
    }
  ],
  
  "filters": [
    {
      "field": "date",
      "component": "daterange",
      "defaultValue": ["2024-01-01", "2024-12-31"]
    }
  ]
}
```

### Key Features

- **Plugin Auto-Install**: Charts with `plugin:` prefix automatically trigger plugin installation
- **Environment Support**: Use `--env` to swap datasources and variables
- **Backward Compatibility**: Dash 2.0 blueprints are automatically migrated
- **Signed Artifacts**: Built dashboards are cryptographically signed
- **Marketplace Ready**: Built-in publishing to Scout Marketplace

## Environment Variables

```bash
# Scout CLI configuration
SCOUT_API_KEY=your_api_key
SCOUT_MARKETPLACE_URL=https://marketplace.scout.com
SCOUT_SIGNING_KEY=path/to/signing/key

# Development
SCOUT_DEV_PORT=3000
SCOUT_DEV_HOST=localhost

# Build optimization
SCOUT_CACHE_DIR=/tmp/scout-cache
SCOUT_SKIP_SIGNATURE=false
```

## Configuration File

Create `.scoutrc.json` in your project or home directory:

```json
{
  "defaultTarget": "both",
  "defaultChannel": "beta",
  "autoSign": true,
  "marketplace": {
    "url": "https://marketplace.scout.com",
    "defaultVisibility": "private"
  },
  "plugins": {
    "autoUpdate": true,
    "registry": "https://plugins.scout.com"
  }
}
```

## Migration from Dash 2.0

Scout CLI automatically detects and migrates Dash 2.0 blueprints:

```bash
# This will automatically migrate if needed
scout dash build old-dashboard.json

# Explicit migration
scout validate old-dashboard.json  # Shows migration suggestions
```

**Migration Changes:**
- `visuals` → `charts`
- Enhanced plugin support
- Simplified query syntax
- Environment configuration
- Publishing metadata

## Examples

### Basic Dashboard Build

```bash
scout init sales-dashboard --template basic
cd sales-dashboard
scout dash build dashboard.json --verbose
scout dev  # Test locally
scout dash publish ./dist --channel stable
```

### Import and Build

```bash
scout import pbix legacy-report.pbix --to-blueprint
cd imported
scout dash build dashboard.json --env production
```

### Plugin Development

```bash
scout init my-plugin --template plugin
cd my-plugin
scout plugin --install ./  # Install locally
scout dash build test-dashboard.json  # Test with plugin
```

## Support

- **Documentation**: https://scout-analytics.com/docs/cli
- **Issues**: https://github.com/scout-analytics/cli/issues
- **Community**: https://discord.gg/scout-analytics
- **Email**: cli-support@scout-analytics.com