#!/bin/bash

# Scout Desktop Build Script
# Builds the complete desktop application with all integrations

set -e

echo "🏗️  Building Scout Desktop with CLI Integration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the scout-desktop directory."
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
npm install

# Build Scout CLI first (dependency)
print_status "Building Scout CLI..."
cd ../../packages/cli
if [ ! -f "package.json" ]; then
    print_error "Scout CLI package.json not found at packages/cli/"
    exit 1
fi

npm install
npm run build

if [ ! -f "dist/cli.js" ]; then
    print_error "Scout CLI build failed - cli.js not found"
    exit 1
fi

print_success "Scout CLI built successfully"

# Return to desktop directory
cd ../../desktop/scout-desktop

# Build renderer (React app)
print_status "Building renderer process..."
npm run build:renderer

if [ ! -d "dist/renderer" ]; then
    print_error "Renderer build failed"
    exit 1
fi

print_success "Renderer built successfully"

# Build main process (Electron)
print_status "Building main process..."
npm run build:electron

if [ ! -f "dist/main.js" ]; then
    print_error "Main process build failed"
    exit 1
fi

print_success "Main process built successfully"

# Copy CLI to resources
print_status "Copying Scout CLI to resources..."
mkdir -p dist/resources/cli
cp -r ../../packages/cli/dist/* dist/resources/cli/
cp ../../packages/cli/package.json dist/resources/cli/

print_success "Scout CLI copied to resources"

# Copy assets
print_status "Copying assets..."
if [ -d "assets" ]; then
    cp -r assets dist/
fi

# Create package info
print_status "Creating package info..."
cat > dist/package-info.json << EOF
{
  "name": "Scout Desktop",
  "version": "$(node -p "require('./package.json').version")",
  "build": "$(date -u +%Y%m%d%H%M%S)",
  "integrations": {
    "scoutCLI": true,
    "pulser": true,
    "claudeCode": true
  },
  "features": [
    "Dashboard Creation",
    "BI File Import", 
    "Marketplace Publishing",
    "AI-Powered Analytics",
    "Code Generation",
    "Terminal Integration"
  ]
}
EOF

print_success "Build completed successfully!"

echo ""
echo "📦 Build Output:"
echo "  📂 dist/main.js           - Electron main process"
echo "  📂 dist/renderer/         - React renderer app"  
echo "  📂 dist/resources/cli/    - Scout CLI integration"
echo "  📂 dist/assets/           - Application assets"
echo ""

# Check if user wants to package
echo "🚀 Next steps:"
echo "  1. Test locally:      npm run dev"
echo "  2. Package app:       npm run package"
echo "  3. Package for OS:    npm run package:mac|win|linux"
echo ""

read -p "📦 Would you like to package the application now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Packaging application..."
    
    # Detect OS and package accordingly
    case "$(uname -s)" in
        Darwin)
            print_status "Packaging for macOS..."
            npm run package:mac
            ;;
        Linux)
            print_status "Packaging for Linux..."
            npm run package:linux
            ;;
        MINGW*|CYGWIN*|MSYS*)
            print_status "Packaging for Windows..."
            npm run package:win
            ;;
        *)
            print_warning "Unknown OS, using default packaging..."
            npm run package
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        print_success "Application packaged successfully!"
        echo ""
        echo "📱 Packaged app available in:"
        echo "  📂 release/"
        echo ""
        echo "🎉 Scout Desktop is ready to use!"
        echo ""
        echo "Features included:"
        echo "  ✅ Scout CLI integration"
        echo "  ✅ Pulser AI analytics"  
        echo "  ✅ Claude Code assistance"
        echo "  ✅ Dashboard builder"
        echo "  ✅ BI file import"
        echo "  ✅ Marketplace publishing"
        echo "  ✅ Terminal integration"
    else
        print_error "Packaging failed"
        exit 1
    fi
else
    echo ""
    print_success "Build complete! Run 'npm run dev' to test locally."
fi