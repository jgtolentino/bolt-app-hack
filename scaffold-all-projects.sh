#!/bin/bash
set -euo pipefail

# Master scaffold script for all TBWA projects

echo "🚀 TBWA Project Scaffolder"
echo "========================="
echo ""
echo "This will scaffold:"
echo "1. suqi-db-app (Scout Dashboard) - scout_dash schema"
echo "2. hris-fris (HR + Finance) - hr_admin + financial_ops schemas"
echo ""

# Make individual scripts executable
chmod +x /Users/tbwa/bolt-app-hack/scaffold-suqi-scout.sh
chmod +x /Users/tbwa/bolt-app-hack/scaffold-hris-fris.sh

# Option to scaffold projects
PS3="Select project to scaffold: "
options=("Scout Dashboard (suqi-db-app)" "HR+Finance (hris-fris)" "Both Projects" "Quit")

select opt in "${options[@]}"
do
    case $opt in
        "Scout Dashboard (suqi-db-app)")
            echo "📊 Scaffolding Scout Dashboard..."
            /Users/tbwa/bolt-app-hack/scaffold-suqi-scout.sh
            break
            ;;
        "HR+Finance (hris-fris)")
            echo "👥💰 Scaffolding HRIS-FRIS..."
            /Users/tbwa/bolt-app-hack/scaffold-hris-fris.sh
            break
            ;;
        "Both Projects")
            echo "🎯 Scaffolding both projects..."
            echo ""
            echo "1️⃣ Scout Dashboard first..."
            /Users/tbwa/bolt-app-hack/scaffold-suqi-scout.sh
            echo ""
            echo "2️⃣ Now HRIS-FRIS..."
            /Users/tbwa/bolt-app-hack/scaffold-hris-fris.sh
            break
            ;;
        "Quit")
            break
            ;;
        *) echo "Invalid option $REPLY";;
    esac
done

echo ""
echo "🎉 Scaffolding complete!"
echo ""
echo "📋 Project Summary:"
echo ""
echo "┌─────────────────┬────────────────┬──────────────────┬──────────┐"
echo "│ Project         │ Schema(s)      │ Writer Port(s)   │ Repo     │"
echo "├─────────────────┼────────────────┼──────────────────┼──────────┤"
echo "│ suqi-db-app     │ scout_dash     │ 8891            │ GitHub   │"
echo "│ hris-fris       │ hr_admin       │ 8894            │ Google   │"
echo "│                 │ financial_ops  │ 8893            │ Drive    │"
echo "└─────────────────┴────────────────┴──────────────────┴──────────┘"
echo ""
echo "🔐 Required Secrets for KeyKey:"
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
echo "🤖 Add these to Doppler project: tbwa-platform"