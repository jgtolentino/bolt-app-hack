# Scout Desktop

**Unified Analytics Platform with AI Integration**

Scout Desktop is a comprehensive analytics platform that integrates Scout CLI, Pulser AI, and Claude Code into a single desktop application. Build dashboards, import BI files, and leverage AI for intelligent analytics - all from one unified interface.

## 🚀 Features

### 📊 **Dashboard Management**
- **Visual Dashboard Builder** - Drag-and-drop interface for creating dashboards
- **Blueprint-as-Code** - JSON-based dashboard definitions (compatible with Scout CLI)
- **Live Preview** - Real-time dashboard updates during development
- **Component Library** - Pre-built charts, KPIs, and visualizations

### 🤖 **AI Integrations**

#### **Scout CLI Integration**
- **Build Dashboards** - Generate production-ready dashboards from blueprints
- **Marketplace Publishing** - Publish to Scout Marketplace with one click
- **BI File Import** - Convert PowerBI (.pbix) and Tableau (.twbx) files to Scout format
- **Plugin Management** - Install and manage dashboard plugins

#### **Pulser AI Analytics**
- **Smart Data Analysis** - AI-powered insights and recommendations
- **Dashboard Generation** - Natural language to dashboard conversion
- **Performance Optimization** - AI-driven dashboard performance improvements
- **Chart Recommendations** - Automatic chart type suggestions based on data

#### **Claude Code Assistant**
- **Code Generation** - Generate Scout dashboard components
- **Code Analysis** - Debug and optimize existing dashboards
- **Smart Debugging** - AI-powered error diagnosis and fixes
- **Documentation** - Automatic code documentation generation

### 🛠️ **Development Tools**
- **Integrated Terminal** - Built-in terminal with Scout CLI access
- **Code Editor** - Monaco editor with TypeScript/JSON support
- **Project Management** - Multi-project workspace support
- **Version Control** - Git integration for dashboard projects

### 📈 **Data Integration**
- **Multi-Source Connectors** - Supabase, SQLite, PostgreSQL, and more
- **Real-time Updates** - Live data streaming and auto-refresh
- **Data Quality** - Built-in data validation and quality checks
- **Caching System** - Intelligent data caching for performance

## 🏗️ **Build & Install**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Python 3.8+ (for some dependencies)

### **Quick Start**

```bash
# Clone and build
git clone <repository-url>
cd scout-desktop

# Build everything (CLI + Desktop)
./build.sh

# Or step by step:
npm install
npm run build

# Run in development
npm run dev

# Package for distribution
npm run package        # Current OS
npm run package:mac    # macOS
npm run package:win    # Windows  
npm run package:linux  # Linux
```

### **Installation Options**

#### **Option 1: Build from Source**
```bash
./build.sh
# Follow prompts to package for your OS
```

#### **Option 2: Pre-built Releases**
Download from the [Releases](https://github.com/scout-analytics/scout-desktop/releases) page.

#### **Option 3: Package Managers**
```bash
# macOS (Homebrew)
brew install scout-desktop

# Windows (Chocolatey)
choco install scout-desktop

# Linux (Snap)
snap install scout-desktop
```

## 🎯 **Quick Tour**

### **1. Create Your First Dashboard**

```bash
# From integrated terminal or Scout CLI
scout init my-dashboard --template analytics
scout dash build dashboard.json --target desktop
```

### **2. Import Existing BI Files**

1. **File → Import BI File**
2. Select your `.pbix` or `.twbx` file
3. Review the auto-generated Scout blueprint
4. **Build → Generate Dashboard**

### **3. AI-Powered Analytics**

1. **Open Pulser AI tab**
2. Upload your data (CSV/JSON)
3. Ask questions: *"What are the key trends in this sales data?"*
4. Generate dashboards: *"Create a executive sales dashboard"*

### **4. Code with AI Assistance**

1. **Open Claude Analysis tab**
2. Paste your dashboard code
3. Ask for help: *"Optimize this component for performance"*
4. Get instant code improvements and explanations

## 📁 **Project Structure**

```
scout-desktop/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── main.ts             # Application entry point
│   │   ├── integrations/       # AI service integrations
│   │   │   ├── ScoutCLIIntegration.ts
│   │   │   ├── PulserIntegration.ts
│   │   │   └── ClaudeCodeIntegration.ts
│   │   └── managers/           # Resource managers
│   └── renderer/               # React frontend
│       ├── App.tsx            # Main app component  
│       ├── pages/             # Application pages
│       ├── components/        # Reusable components
│       └── context/           # React context providers
├── packages/cli/              # Scout CLI (shared dependency)
├── assets/                    # Application assets
└── build/                     # Build configuration
```

## 🔧 **Configuration**

### **Environment Variables**

```bash
# Scout CLI
SCOUT_API_KEY=your_api_key
SCOUT_MARKETPLACE_URL=https://marketplace.scout.com

# Pulser AI  
PULSER_API_KEY=your_anthropic_key
PULSER_MODEL=claude-3-5-sonnet

# Claude Code
CLAUDE_API_KEY=your_anthropic_key
CLAUDE_WORKSPACE=~/.claude-code

# Development
NODE_ENV=development
ELECTRON_IS_DEV=true
```

### **Application Settings**

Settings are stored in:
- **macOS**: `~/Library/Application Support/Scout Desktop/`
- **Windows**: `%APPDATA%/Scout Desktop/`  
- **Linux**: `~/.config/scout-desktop/`

## 🎮 **Usage Examples**

### **Dashboard Creation Workflow**

```javascript
// 1. Create blueprint via UI or CLI
const blueprint = {
  title: "Sales Dashboard",
  charts: [
    {
      type: "kpi.card",
      query: "SELECT SUM(revenue) FROM sales"
    },
    {
      type: "line.basic", 
      query: "SELECT date, SUM(revenue) FROM sales GROUP BY date"
    }
  ]
};

// 2. Build with Scout CLI integration
await window.electronAPI.scout.build('dashboard.json', {
  target: 'desktop',
  output: './dist'
});

// 3. AI optimization with Pulser
const optimized = await window.electronAPI.pulser.execute({
  type: 'optimize',
  input: 'Improve dashboard performance',
  context: { blueprint }
});
```

### **BI File Import**

```javascript
// Import PowerBI file
const result = await window.electronAPI.scout.import(
  'pbix', 
  './sales-report.pbix',
  { toBlueprint: true, output: './imported' }
);

// Convert to Scout dashboard
if (result.success) {
  await window.electronAPI.scout.build('./imported/dashboard.json');
}
```

### **AI-Powered Analysis**

```javascript
// Analyze data with Pulser AI
const insights = await window.electronAPI.pulser.execute({
  type: 'analyze',
  input: 'Find trends and anomalies in this sales data',
  context: { data: salesData },
  options: { generateInsights: true }
});

// Generate dashboard with Claude Code
const dashboard = await window.electronAPI.claude.generateCode({
  prompt: 'Create a React dashboard component for sales analytics',
  language: 'typescript',
  framework: 'scout-dash-2.0'
});
```

## 🔌 **Plugin Development**

Scout Desktop supports plugins for extending functionality:

```typescript
// Example plugin structure
export interface ScoutPlugin {
  name: string;
  version: string;
  activate(context: PluginContext): void;
  deactivate(): void;
}

// Register visual component
context.registerVisual('custom-chart', CustomChartComponent);

// Add menu item
context.addMenuItem('Tools', 'My Plugin', () => {
  // Plugin action
});
```

## 🚀 **Deployment**

### **Auto-Updates**

Scout Desktop includes automatic updates:

```typescript
// Update configuration in main.ts
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'scout-analytics',
  repo: 'scout-desktop'
});
```

### **Enterprise Distribution**

For enterprise deployments:

1. **Code Signing** - Sign with your organization's certificate
2. **Custom Marketplace** - Point to your internal marketplace
3. **Configuration Management** - Deploy with pre-configured settings
4. **Plugin Restrictions** - Control which plugins can be installed

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests: `npm test`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### **Development Setup**

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Type check
npm run typecheck
```

## 📋 **Requirements**

### **System Requirements**
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 2GB free space
- **Display**: 1366x768 minimum resolution
- **Network**: Internet connection for AI features and marketplace

### **Supported Platforms**
- **macOS**: 10.14+ (Mojave)
- **Windows**: 10/11 (64-bit)
- **Linux**: Ubuntu 18.04+, CentOS 7+

## 🆘 **Support**

- **Documentation**: https://scout-analytics.com/docs/desktop
- **Community Forum**: https://community.scout-analytics.com
- **Discord**: https://discord.gg/scout-analytics
- **GitHub Issues**: https://github.com/scout-analytics/scout-desktop/issues
- **Email Support**: desktop-support@scout-analytics.com

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details.

---

**Scout Desktop** - Bringing AI-powered analytics to your desktop. Built with ❤️ by the Scout Analytics team.