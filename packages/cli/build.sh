#!/bin/bash

# Scout CLI Build Script
# Builds and optionally installs the CLI globally

set -e

echo "🏗️  Building Scout CLI..."

# Clean previous build
rm -rf dist/

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build TypeScript
echo "🔨 Compiling TypeScript..."
npx tsc

# Make CLI executable
chmod +x dist/cli.js

# Add shebang to built file if missing
if ! head -1 dist/cli.js | grep -q "#!/usr/bin/env node"; then
    echo "#!/usr/bin/env node" | cat - dist/cli.js > temp && mv temp dist/cli.js
fi

echo "✅ Build completed!"

# Ask if user wants to install globally
echo ""
read -p "📦 Install globally with 'npm link'? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔗 Linking globally..."
    npm link
    echo "✅ Scout CLI installed! Try: scout --help"
else
    echo "💡 To install manually:"
    echo "   npm link"
    echo "   or"
    echo "   npm install -g ."
fi

echo ""
echo "🚀 To test the CLI:"
echo "   ./dist/cli.js --help"
echo "   or if linked: scout --help"