#!/bin/bash

# Download GADM data for Philippines (all administrative levels)
# GADM 4.1 data from geodata.ucdavis.edu

echo "Downloading GADM data for Philippines..."

# Create data directory if it doesn't exist
mkdir -p public/data

# Base URL for GADM 4.1 GeoJSON files
BASE_URL="https://geodata.ucdavis.edu/gadm/gadm4.1/json"

# Download all levels (0-3)
# Level 0: Country
# Level 1: Regions
# Level 2: Provinces
# Level 3: Municipalities/Cities

for level in 0 1 2 3; do
    filename="gadm41_PHL_${level}.json"
    url="${BASE_URL}/${filename}.zip"
    
    echo "Downloading Level ${level} (${filename})..."
    
    # Download the zip file
    curl -L -o "public/data/${filename}.zip" "$url"
    
    # Unzip the file
    cd public/data
    unzip -o "${filename}.zip"
    
    # Remove the zip file
    rm "${filename}.zip"
    
    # Compress the JSON file for faster loading (optional)
    gzip -k "${filename}"
    
    cd ../..
    
    echo "Level ${level} downloaded successfully!"
done

# Note: GADM typically doesn't include barangay level (Level 4)
# For barangay data, we need to use PSGC or other sources

echo "Download complete! GADM files are in public/data/"
echo "Files downloaded:"
echo "- gadm41_PHL_0.json (Country outline)"
echo "- gadm41_PHL_1.json (Regions)"
echo "- gadm41_PHL_2.json (Provinces)"
echo "- gadm41_PHL_3.json (Municipalities/Cities)"
echo ""
echo "Note: For barangay-level data, use PSGC data sources or PSA services."