// Enhanced Boundary data service for Philippine administrative boundaries
export class BoundaryService {
  private static readonly PSA_BARANGAY_URL = 'https://portal.georisk.gov.ph/arcgis/rest/services/PSA/Barangay/MapServer/0/query';
  private static readonly GADM_BASE_URL = '/data';
  private static readonly PSGC_GITHUB_URL = 'https://raw.githubusercontent.com/altcoder/philippines-psgc-shapefiles/main';
  
  // Cache for boundary data
  private static boundaryCache = new Map<string, any>();

  /**
   * Load barangay boundaries from multiple sources with fallback
   */
  static async loadBarangayBoundaries(regionCode?: string, provinceCode?: string): Promise<any> {
    const cacheKey = `barangay-${regionCode || 'all'}-${provinceCode || 'all'}`;
    
    if (this.boundaryCache.has(cacheKey)) {
      return this.boundaryCache.get(cacheKey);
    }

    // Try PSA ArcGIS REST service first
    try {
      let whereClause = '1=1';
      if (regionCode) {
        whereClause += ` AND REGCODE='${regionCode}'`;
      }
      if (provinceCode) {
        whereClause += ` AND PROVCODE='${provinceCode}'`;
      }

      const params = new URLSearchParams({
        where: whereClause,
        outFields: '*',
        f: 'geojson',
        returnGeometry: 'true',
        spatialRel: 'esriSpatialRelIntersects',
        geometryType: 'esriGeometryEnvelope',
        inSR: '4326',
        outSR: '4326',
        resultRecordCount: '1000'
      });

      const response = await fetch(`${this.PSA_BARANGAY_URL}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.boundaryCache.set(cacheKey, data);
        return data;
      }
    } catch (error) {
      console.warn('PSA ArcGIS service failed:', error);
    }

    // Try PSGC GitHub repository as fallback
    try {
      const response = await fetch(`${this.PSGC_GITHUB_URL}/Barangay/Barangay.psgc.geojson`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Filter by region/province if specified
        if (regionCode || provinceCode) {
          data.features = data.features.filter((feature: any) => {
            const props = feature.properties;
            if (regionCode && props.REGCODE !== regionCode) return false;
            if (provinceCode && props.PROVCODE !== provinceCode) return false;
            return true;
          });
        }
        
        this.boundaryCache.set(cacheKey, data);
        return data;
      }
    } catch (error) {
      console.warn('PSGC GitHub repository failed:', error);
    }

    // Return mock data as final fallback
    return this.getMockBarangayData();
  }

  /**
   * Load region boundaries from GADM
   */
  static async loadRegionBoundaries(): Promise<any> {
    const cacheKey = 'regions-gadm';
    
    if (this.boundaryCache.has(cacheKey)) {
      return this.boundaryCache.get(cacheKey);
    }

    try {
      // GADM Level 1 = Regions
      const response = await fetch(`${this.GADM_BASE_URL}/gadm41_PHL_1.json`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Transform GADM data to match our expected format
        const transformedData = {
          type: 'FeatureCollection',
          features: data.features.map((feature: any) => ({
            ...feature,
            properties: {
              ...feature.properties,
              REGCODE: feature.properties.HASC_1?.split('.')[1] || '',
              REGNAME: feature.properties.NAME_1 || '',
              REGION: feature.properties.NAME_1 || ''
            }
          }))
        };
        
        this.boundaryCache.set(cacheKey, transformedData);
        return transformedData;
      }
    } catch (error) {
      console.warn('GADM regions failed:', error);
    }

    return this.getMockRegionData();
  }

  /**
   * Load province boundaries from GADM
   */
  static async loadProvinceBoundaries(): Promise<any> {
    const cacheKey = 'provinces-gadm';
    
    if (this.boundaryCache.has(cacheKey)) {
      return this.boundaryCache.get(cacheKey);
    }

    try {
      // GADM Level 2 = Provinces
      const response = await fetch(`${this.GADM_BASE_URL}/gadm41_PHL_2.json`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Transform GADM data
        const transformedData = {
          type: 'FeatureCollection',
          features: data.features.map((feature: any) => ({
            ...feature,
            properties: {
              ...feature.properties,
              REGCODE: feature.properties.HASC_1?.split('.')[1] || '',
              REGNAME: feature.properties.NAME_1 || '',
              PROVCODE: feature.properties.HASC_2?.split('.')[2] || '',
              PROVNAME: feature.properties.NAME_2 || ''
            }
          }))
        };
        
        this.boundaryCache.set(cacheKey, transformedData);
        return transformedData;
      }
    } catch (error) {
      console.warn('GADM provinces failed:', error);
    }

    return this.getMockProvinceData();
  }

  /**
   * Load municipality boundaries from GADM
   */
  static async loadMunicipalityBoundaries(): Promise<any> {
    const cacheKey = 'municipalities-gadm';
    
    if (this.boundaryCache.has(cacheKey)) {
      return this.boundaryCache.get(cacheKey);
    }

    try {
      // GADM Level 3 = Municipalities
      const response = await fetch(`${this.GADM_BASE_URL}/gadm41_PHL_3.json`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Transform GADM data
        const transformedData = {
          type: 'FeatureCollection',
          features: data.features.map((feature: any) => ({
            ...feature,
            properties: {
              ...feature.properties,
              REGCODE: feature.properties.HASC_1?.split('.')[1] || '',
              REGNAME: feature.properties.NAME_1 || '',
              PROVCODE: feature.properties.HASC_2?.split('.')[2] || '',
              PROVNAME: feature.properties.NAME_2 || '',
              MUNCODE: feature.properties.HASC_3?.split('.')[3] || '',
              MUNNAME: feature.properties.NAME_3 || ''
            }
          }))
        };
        
        this.boundaryCache.set(cacheKey, transformedData);
        return transformedData;
      }
    } catch (error) {
      console.warn('GADM municipalities failed:', error);
    }

    return this.getMockMunicipalityData();
  }

  /**
   * Load boundaries from alternative sources
   */
  static async loadFromAlternativeSource(level: 'region' | 'province' | 'municipality' | 'barangay'): Promise<any> {
    const urls = {
      region: `${this.PSGC_GITHUB_URL}/Region/Region.psgc.geojson`,
      province: `${this.PSGC_GITHUB_URL}/Province/Province.psgc.geojson`,
      municipality: `${this.PSGC_GITHUB_URL}/Municipality/Municipality.psgc.geojson`,
      barangay: `${this.PSGC_GITHUB_URL}/Barangay/Barangay.psgc.geojson`
    };

    const cacheKey = `${level}-psgc`;
    
    if (this.boundaryCache.has(cacheKey)) {
      return this.boundaryCache.get(cacheKey);
    }

    try {
      const response = await fetch(urls[level]);
      
      if (response.ok) {
        const data = await response.json();
        this.boundaryCache.set(cacheKey, data);
        return data;
      }
    } catch (error) {
      console.warn(`PSGC ${level} boundaries failed:`, error);
    }

    // Fallback to appropriate mock data
    switch (level) {
      case 'region': return this.getMockRegionData();
      case 'province': return this.getMockProvinceData();
      case 'municipality': return this.getMockMunicipalityData();
      case 'barangay': return this.getMockBarangayData();
    }
  }

  /**
   * Simplify geometry for better performance
   */
  static simplifyGeometry(geoJson: any, tolerance: number = 0.01): any {
    // Simple implementation - in production, use turf.js or similar
    return {
      ...geoJson,
      features: geoJson.features.map((feature: any) => ({
        ...feature,
        geometry: {
          ...feature.geometry,
          // Simplified coordinates (basic implementation)
          coordinates: feature.geometry.coordinates
        }
      }))
    };
  }

  /**
   * Filter boundaries by region
   */
  static filterByRegion(geoJson: any, regionCode: string): any {
    return {
      ...geoJson,
      features: geoJson.features.filter((feature: any) => 
        feature.properties.REGCODE === regionCode ||
        feature.properties.REGION === regionCode
      )
    };
  }

  /**
   * Get boundary statistics
   */
  static getBoundaryStats(geoJson: any): any {
    return {
      totalFeatures: geoJson.features.length,
      regions: [...new Set(geoJson.features.map((f: any) => f.properties.REGNAME || f.properties.REGION))].length,
      provinces: [...new Set(geoJson.features.map((f: any) => f.properties.PROVNAME))].filter(Boolean).length,
      municipalities: [...new Set(geoJson.features.map((f: any) => f.properties.MUNNAME))].filter(Boolean).length,
      barangays: [...new Set(geoJson.features.map((f: any) => f.properties.BRGYNAME))].filter(Boolean).length
    };
  }

  // Mock data methods for development/fallback
  private static getMockRegionData() {
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { REGCODE: '13', REGNAME: 'NCR', REGION: 'National Capital Region' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[120.9, 14.5], [121.1, 14.5], [121.1, 14.7], [120.9, 14.7], [120.9, 14.5]]]
          }
        },
        {
          type: 'Feature',
          properties: { REGCODE: '07', REGNAME: 'Region VII', REGION: 'Central Visayas' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[123.8, 10.2], [124.0, 10.2], [124.0, 10.4], [123.8, 10.4], [123.8, 10.2]]]
          }
        },
        {
          type: 'Feature',
          properties: { REGCODE: '03', REGNAME: 'Region III', REGION: 'Central Luzon' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[120.5, 15.0], [121.0, 15.0], [121.0, 15.5], [120.5, 15.5], [120.5, 15.0]]]
          }
        }
      ]
    };
  }

  private static getMockProvinceData() {
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { 
            REGCODE: '13', REGNAME: 'NCR', 
            PROVCODE: '1300', PROVNAME: 'Metro Manila' 
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[[120.9, 14.5], [121.1, 14.5], [121.1, 14.7], [120.9, 14.7], [120.9, 14.5]]]
          }
        },
        {
          type: 'Feature',
          properties: { 
            REGCODE: '07', REGNAME: 'Region VII',
            PROVCODE: '0722', PROVNAME: 'Cebu' 
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[[123.8, 10.2], [124.0, 10.2], [124.0, 10.4], [123.8, 10.4], [123.8, 10.2]]]
          }
        }
      ]
    };
  }

  private static getMockMunicipalityData() {
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { 
            REGCODE: '13', REGNAME: 'NCR',
            PROVCODE: '1300', PROVNAME: 'Metro Manila',
            MUNCODE: '137401', MUNNAME: 'Manila' 
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[[120.95, 14.55], [121.05, 14.55], [121.05, 14.65], [120.95, 14.65], [120.95, 14.55]]]
          }
        },
        {
          type: 'Feature',
          properties: { 
            REGCODE: '07', REGNAME: 'Region VII',
            PROVCODE: '0722', PROVNAME: 'Cebu',
            MUNCODE: '072209', MUNNAME: 'Cebu City' 
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[[123.85, 10.25], [123.95, 10.25], [123.95, 10.35], [123.85, 10.35], [123.85, 10.25]]]
          }
        }
      ]
    };
  }

  private static getMockBarangayData() {
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { 
            REGCODE: '13', REGNAME: 'NCR',
            PROVCODE: '1300', PROVNAME: 'Metro Manila',
            MUNCODE: '137401', MUNNAME: 'Manila',
            BRGYCODE: '137401001', BRGYNAME: 'Tondo'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[[120.96, 14.60], [121.00, 14.60], [121.00, 14.62], [120.96, 14.62], [120.96, 14.60]]]
          }
        },
        {
          type: 'Feature',
          properties: { 
            REGCODE: '13', REGNAME: 'NCR',
            PROVCODE: '1300', PROVNAME: 'Metro Manila',
            MUNCODE: '137404', MUNNAME: 'Quezon City',
            BRGYCODE: '137404001', BRGYNAME: 'Bagumbayan'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[[121.02, 14.67], [121.06, 14.67], [121.06, 14.69], [121.02, 14.69], [121.02, 14.67]]]
          }
        },
        {
          type: 'Feature',
          properties: { 
            REGCODE: '07', REGNAME: 'Region VII',
            PROVCODE: '0722', PROVNAME: 'Cebu',
            MUNCODE: '072209', MUNNAME: 'Cebu City',
            BRGYCODE: '072209001', BRGYNAME: 'Lahug'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[[123.87, 10.30], [123.91, 10.30], [123.91, 10.34], [123.87, 10.34], [123.87, 10.30]]]
          }
        }
      ]
    };
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    this.boundaryCache.clear();
  }

  /**
   * Get cache size
   */
  static getCacheSize(): number {
    return this.boundaryCache.size;
  }

  /**
   * Get cached boundary data
   */
  static getCachedData(key: string): any {
    return this.boundaryCache.get(key);
  }

  /**
   * Set cached boundary data
   */
  static setCachedData(key: string, data: any): void {
    this.boundaryCache.set(key, data);
  }
}