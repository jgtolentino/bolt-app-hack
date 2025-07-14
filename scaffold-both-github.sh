#!/bin/bash
set -euo pipefail

# Corrected scaffold script - Both projects are on GitHub

echo "🚀 TBWA GitHub Projects Scaffolder"
echo "================================="
echo ""
echo "Setting up both GitHub repositories:"
echo "1. suqi-db-app (Scout Dashboard) - scout_dash schema"
echo "2. hris-fris (HR + Finance) - hr_admin + financial_ops schemas"
echo ""

# Function to scaffold Scout Dashboard
scaffold_scout() {
    echo "🏪 Scaffolding suqi-db-app (Scout Dashboard)..."
    
    cd /Users/tbwa
    
    # Clone or update
    if [ -d "suqi-db-app" ]; then
        echo "Repository exists, updating..."
        cd suqi-db-app
        git pull origin main || true
    else
        git clone https://github.com/jgtolentino/suqi-db-app.git
        cd suqi-db-app
    fi
    
    # Run the scaffold script
    bash /Users/tbwa/bolt-app-hack/scaffold-suqi-scout.sh
    
    echo "✅ Scout Dashboard scaffolded!"
}

# Function to scaffold HRIS-FRIS
scaffold_hris() {
    echo "👥💰 Scaffolding hris-fris (HR + Finance)..."
    
    cd /Users/tbwa
    
    # Clone or update the agency-databank repo
    if [ -d "agency-databank" ]; then
        echo "Repository exists, updating..."
        cd agency-databank
        git pull origin main || true
    else
        git clone https://github.com/jgtolentino/agency-databank.git
        cd agency-databank
    fi
    
    # Create hris-fris subdirectory if needed
    mkdir -p hris-fris
    cd hris-fris
    
    # Run the scaffold script
    bash /Users/tbwa/bolt-app-hack/scaffold-hris-fris.sh
    
    echo "✅ HRIS-FRIS scaffolded!"
}

# Main execution
echo "Starting scaffold process..."
echo ""

# Scaffold Scout Dashboard
scaffold_scout

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Scaffold HRIS-FRIS
scaffold_hris

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Summary
echo "🎉 Both projects scaffolded successfully!"
echo ""
echo "📋 Project Summary:"
echo ""
echo "┌─────────────────┬────────────────────┬──────────────────┬─────────────────────────────────┐"
echo "│ Project         │ Schema(s)          │ Writer Port(s)   │ GitHub Repository               │"
echo "├─────────────────┼────────────────────┼──────────────────┼─────────────────────────────────┤"
echo "│ suqi-db-app     │ scout_dash         │ 8891            │ jgtolentino/suqi-db-app         │"
echo "│ hris-fris       │ hr_admin           │ 8894            │ jgtolentino/agency-databank     │"
echo "│                 │ financial_ops      │ 8893            │ (in hris-fris subdirectory)     │"
echo "└─────────────────┴────────────────────┴──────────────────┴─────────────────────────────────┘"
echo ""
echo "📍 Local Paths:"
echo "- Scout: /Users/tbwa/suqi-db-app"
echo "- HRIS:  /Users/tbwa/agency-databank/hris-fris"
echo ""
echo "🔐 Required Secrets for KeyKey (add to Doppler):"
echo ""
echo "Global:"
echo "  - SUPABASE_URL"
echo "  - MCP_API_KEY"
echo ""
echo "Scout Dashboard:"
echo "  - SCOUT_SERVICE_KEY"
echo "  - SCOUT_ANON_KEY"
echo "  - RENDER_SERVICE_ID_SCOUT"
echo ""
echo "HRIS-FRIS:"
echo "  - HR_SERVICE_KEY"
echo "  - HR_ANON_KEY"
echo "  - FIN_SERVICE_KEY"
echo "  - FIN_ANON_KEY"
echo "  - RENDER_SERVICE_ID_HRIS"
echo ""
echo "📝 Next Steps:"
echo "1. cd into each project directory"
echo "2. Review the generated files"
echo "3. git add . && git commit -m 'feat: Initial scaffold'"
echo "4. git push origin main"
echo "5. Add secrets to KeyKey/Doppler"
echo "6. Deploy to Render"