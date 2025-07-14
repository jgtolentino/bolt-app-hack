#!/bin/bash

# Scout Analytics Desktop Build Script
# Builds the Electron app for all platforms

set -e

echo "🚀 Scout Analytics Desktop Build"
echo "==============================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the desktop directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must run from desktop directory${NC}"
    exit 1
fi

# Clean previous builds
echo -e "${YELLOW}Cleaning previous builds...${NC}"
rm -rf dist release

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Build TypeScript
echo -e "${YELLOW}Building TypeScript...${NC}"
npm run build:main

# Copy renderer build from parent project
echo -e "${YELLOW}Building renderer (React app)...${NC}"
cd ..
npm run build
cd desktop
mkdir -p dist/renderer
cp -r ../dist/* dist/renderer/

# Create required directories
mkdir -p assets

# Create placeholder icon if not exists
if [ ! -f "assets/icon.png" ]; then
    echo -e "${YELLOW}Creating placeholder icon...${NC}"
    # Create a simple 512x512 PNG using ImageMagick if available
    if command -v convert &> /dev/null; then
        convert -size 512x512 xc:blue -fill white -gravity center -pointsize 72 -annotate +0+0 'SA' assets/icon.png
        # Create other sizes
        convert assets/icon.png -resize 256x256 assets/icon@2x.png
        convert assets/icon.png -resize 128x128 assets/icon@1x.png
        # Create ICO for Windows
        convert assets/icon.png -resize 256x256 assets/icon.ico
        # Create ICNS for macOS (requires additional steps)
    else
        echo -e "${YELLOW}ImageMagick not found. Please add icon files manually.${NC}"
    fi
fi

# Platform-specific builds
if [[ "$1" == "all" ]]; then
    echo -e "${GREEN}Building for all platforms...${NC}"
    npm run dist
elif [[ "$1" == "mac" ]]; then
    echo -e "${GREEN}Building for macOS...${NC}"
    npm run dist:mac
elif [[ "$1" == "win" ]]; then
    echo -e "${GREEN}Building for Windows...${NC}"
    npm run dist:win
elif [[ "$1" == "linux" ]]; then
    echo -e "${GREEN}Building for Linux...${NC}"
    npm run dist:linux
else
    echo -e "${GREEN}Building for current platform...${NC}"
    npm run dist
fi

echo -e "${GREEN}✅ Build complete!${NC}"
echo -e "Built applications are in the ${GREEN}release${NC} directory"

# List built files
echo -e "\n${YELLOW}Built files:${NC}"
ls -la release/ 2>/dev/null || echo "No files built yet"