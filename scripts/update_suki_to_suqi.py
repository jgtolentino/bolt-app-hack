#!/usr/bin/env python3
"""
Update all instances of 'suki' to 'Suqi' in the codebase
Handles different case variations and file types
"""

import os
import re
import sys
from pathlib import Path

# Define the root directory
ROOT_DIR = Path(__file__).parent.parent

# File extensions to process
EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.sql', '.md', '.json', '.yaml', '.yml']

# Directories to skip
SKIP_DIRS = {'node_modules', '.next', 'dist', '.git', '__pycache__', '.venv'}

# Counter for changes
changes_made = 0
files_updated = 0

def update_content(content):
    """Update all variations of suki to Suqi"""
    global changes_made
    
    # Count original occurrences
    original_count = len(re.findall(r'suki|Suki|SUKI', content, re.IGNORECASE))
    
    # Replace all variations
    updated = content
    updated = re.sub(r'SUKI', 'SUQI', updated)
    updated = re.sub(r'Suki', 'Suqi', updated)
    updated = re.sub(r'suki', 'suqi', updated)
    
    # Count changes
    if updated != content:
        changes_made += original_count
        return updated
    
    return None

def process_file(file_path):
    """Process a single file"""
    global files_updated
    
    try:
        # Read file
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Update content
        updated_content = update_content(content)
        
        if updated_content:
            # Write updated content
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            
            files_updated += 1
            print(f"✓ Updated: {file_path.relative_to(ROOT_DIR)}")
            return True
            
    except Exception as e:
        print(f"⚠️  Error processing {file_path}: {e}")
    
    return False

def rename_file_if_needed(file_path):
    """Rename file if it contains 'suki' in the name"""
    file_name = file_path.name
    
    if 'suki' in file_name.lower():
        new_name = file_name
        new_name = re.sub(r'SUKI', 'SUQI', new_name)
        new_name = re.sub(r'Suki', 'Suqi', new_name)
        new_name = re.sub(r'suki', 'suqi', new_name)
        
        if new_name != file_name:
            new_path = file_path.parent / new_name
            file_path.rename(new_path)
            print(f"📁 Renamed: {file_path.name} → {new_name}")
            return new_path
    
    return file_path

def main():
    print("🔄 Updating all 'suki' references to 'Suqi'...\n")
    
    # Walk through all files
    for root, dirs, files in os.walk(ROOT_DIR):
        # Skip directories
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        
        root_path = Path(root)
        
        for file in files:
            file_path = root_path / file
            
            # Check if file should be processed
            if file_path.suffix in EXTENSIONS:
                # Process file content
                process_file(file_path)
                
                # Rename file if needed
                rename_file_if_needed(file_path)
    
    # Special handling for the migration file
    migration_file = ROOT_DIR / "supabase/migrations/20250629110000_suki_analytics_enhancements.sql"
    if migration_file.exists():
        new_migration = ROOT_DIR / "supabase/migrations/20250629110000_suqi_analytics_enhancements.sql"
        migration_file.rename(new_migration)
        print(f"\n📁 Renamed migration: {migration_file.name} → {new_migration.name}")
    
    print(f"\n✅ Update complete!")
    print(f"   Files updated: {files_updated}")
    print(f"   Total changes: {changes_made}")

if __name__ == "__main__":
    main()