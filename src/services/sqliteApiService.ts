/**
 * SQLite API Service for Scout v4.0
 * Connects to the SQLite API Bridge server to access real database data
 */

export interface DashboardFilters {
  timeOfDay?: string;
  region?: string;
  barangay?: string;
  weekVsWeekend?: 'week' | 'weekend' | 'all' | 'weekdays' | 'weekends';
  category?: string;
  brand?: string;
  gender?: string;
  ageGroup?: string;
  startDate?: string;
  endDate?: string;
}

export interface SubstitutionData {
  originalProduct: string;
  substitutedProduct: string;
  count: number;
  originalBrand: string;
  substitutedBrand: string;
}

export interface RegionData {
  id: string;
  name: string;
  value: number;
  transactions: number;
  customers: number;
  avgBasketSize: number;
  latitude?: number;
  longitude?: number;
}

class SQLiteApiService {
  private baseUrl: string;
  
  constructor() {
    // Use environment variable for API URL, with fallback to localhost
    // In production, this should be set to your deployed API server
    this.baseUrl = import.meta.env.VITE_SQLITE_API_URL || 
      (import.meta.env.PROD ? 'https://mcp-sqlite-server.onrender.com' : 'http://localhost:3001');
  }

  private async fetchApi(endpoint: string, params?: Record<string, any>): Promise<any> {
    try {
      const url = new URL(`${this.baseUrl}${endpoint}`);
      
      // Add query parameters
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            url.searchParams.append(key, String(value));
          }
        });
      }
      
      console.log('🔍 SQLite API Request:', url.toString());
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ SQLite API Response:', `${endpoint} returned ${Array.isArray(data) ? data.length : 'object'} items`);
      
      return data;
      
    } catch (error) {
      console.error('❌ SQLite API Error:', error);
      throw error;
    }
  }

  // Get transaction trends with filters
  async getTransactionTrends(filters: DashboardFilters = {}) {
    const params: Record<string, any> = {};
    
    if (filters.region) params.region = filters.region;
    if (filters.barangay) params.barangay = filters.barangay;
    if (filters.category) params.category = filters.category;
    if (filters.weekVsWeekend && filters.weekVsWeekend !== 'all') {
      params.weekVsWeekend = filters.weekVsWeekend;
    }
    
    return await this.fetchApi('/api/transactions', params);
  }

  // Get substitution data for Sankey diagram
  async getSubstitutionData(filters: DashboardFilters = {}): Promise<SubstitutionData[]> {
    return await this.fetchApi('/api/substitutions');
  }

  // Get geographic data for heatmap
  async getGeographicData(filters: DashboardFilters = {}): Promise<RegionData[]> {
    return await this.fetchApi('/api/geographic');
  }

  // Get hourly patterns
  async getHourlyPatterns(filters: DashboardFilters = {}) {
    return await this.fetchApi('/api/hourly-patterns');
  }

  // Get filter options
  async getFilterOptions() {
    return await this.fetchApi('/api/filter-options');
  }

  // Get database statistics
  async getStats() {
    return await this.fetchApi('/api/stats');
  }

  // Health check
  async healthCheck() {
    return await this.fetchApi('/health');
  }
}

export const sqliteApiService = new SQLiteApiService();