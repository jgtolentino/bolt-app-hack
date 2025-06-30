#!/bin/bash

# Update all instances of "suki" to "Suqi" in the codebase
# This script updates file contents and filenames

echo "🔄 Updating all 'suki' references to 'Suqi'..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for changes
CHANGES=0

# Function to update file content
update_file_content() {
    local file=$1
    local temp_file="${file}.tmp"
    
    # Check if file contains suki (case insensitive)
    if grep -qi "suki" "$file"; then
        echo -e "${BLUE}Updating: $file${NC}"
        
        # Perform replacements with different case variations
        sed -e 's/SUKI/SUQI/g' \
            -e 's/Suki/Suqi/g' \
            -e 's/suki/suqi/g' \
            "$file" > "$temp_file"
        
        # Check if changes were made
        if ! cmp -s "$file" "$temp_file"; then
            mv "$temp_file" "$file"
            ((CHANGES++))
            echo -e "${GREEN}✓ Updated${NC}"
        else
            rm "$temp_file"
            echo -e "${YELLOW}No changes needed${NC}"
        fi
    fi
}

# Update TypeScript/JavaScript files
echo -e "\n${YELLOW}Updating TypeScript/JavaScript files...${NC}"
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "./node_modules/*" \
    -not -path "./.next/*" \
    -not -path "./dist/*" \
    -exec bash -c 'source scripts/update-suki-to-suqi.sh; update_file_content "$0"' {} \;

# Update SQL files
echo -e "\n${YELLOW}Updating SQL files...${NC}"
find . -type f -name "*.sql" \
    -not -path "./node_modules/*" \
    -exec bash -c 'source scripts/update-suki-to-suqi.sh; update_file_content "$0"' {} \;

# Update Markdown files
echo -e "\n${YELLOW}Updating Markdown files...${NC}"
find . -type f -name "*.md" \
    -not -path "./node_modules/*" \
    -exec bash -c 'source scripts/update-suki-to-suqi.sh; update_file_content "$0"' {} \;

# Rename files containing "suki" in the filename
echo -e "\n${YELLOW}Renaming files containing 'suki'...${NC}"
find . -type f -name "*suki*" -not -path "./node_modules/*" | while read -r file; do
    newfile=$(echo "$file" | sed 's/suki/suqi/g' | sed 's/Suki/Suqi/g' | sed 's/SUKI/SUQI/g')
    if [ "$file" != "$newfile" ]; then
        echo -e "${BLUE}Renaming: $file → $newfile${NC}"
        mv "$file" "$newfile"
        ((CHANGES++))
        echo -e "${GREEN}✓ Renamed${NC}"
    fi
done

# Special case: Update the specific migration file
if [ -f "supabase/migrations/20250629110000_suki_analytics_enhancements.sql" ]; then
    echo -e "\n${YELLOW}Renaming migration file...${NC}"
    mv "supabase/migrations/20250629110000_suki_analytics_enhancements.sql" \
       "supabase/migrations/20250629110000_suqi_analytics_enhancements.sql"
    echo -e "${GREEN}✓ Renamed migration file${NC}"
    ((CHANGES++))
fi

echo -e "\n${GREEN}✅ Update complete! Total changes: $CHANGES${NC}"

# Export the function for use with find -exec
export -f update_file_content