import { supabase } from '../lib/supabase';
import { format, subDays } from 'date-fns';

export interface ConsumerProfile {
  id: string;
  gender: string;
  age_bracket: string;
  estimated_age_min: number;
  estimated_age_max: number;
  location_store_id: string;
  total_transactions: number;
  total_spent: number;
  avg_basket_size: number;
  preferred_categories: string[];
  preferred_brands: string[];
}

export interface ProductRequest {
  id: string;
  transaction_id: string;
  product_id: string;
  request_type: string;
  original_request: string;
  request_method: string;
  brand_mentioned?: string;
  category_mentioned?: string;
  was_available: boolean;
  substitution_accepted?: boolean;
}

export interface ProductSubstitution {
  id: string;
  original_brand: string;
  substitute_brand: string;
  original_category: string;
  substitute_category: string;
  substitution_count: number;
  accepted_count: number;
  acceptance_rate: number;
  substitution_reason: string;
}

export interface ConsumerBehavior {
  gender: string;
  age_bracket: string;
  region: string;
  city: string;
  total_requests: number;
  branded_requests: number;
  unbranded_requests: number;
  verbal_requests: number;
  pointing_requests: number;
  total_substitutions: number;
  accepted_substitutions: number;
  avg_transaction_value: number;
  categories_purchased: string[];
  brands_purchased: string[];
}

export interface TransactionPattern {
  hour_bucket: string;
  hour_of_day: number;
  day_of_week: number;
  day_type: string;
  region: string;
  transaction_count: number;
  avg_duration_seconds: number;
  avg_transaction_value: number;
  single_item_transactions: number;
  multi_item_transactions: number;
  unique_consumers: number;
}

export interface ProductCombination {
  product1_name: string;
  product2_name: string;
  product1_category: string;
  product2_category: string;
  product1_brand: string;
  product2_brand: string;
  co_occurrence_count: number;
  confidence_percent: number;
}

class RetailAnalyticsService {
  // Get consumer behavior analytics
  async getConsumerBehavior(filters?: {
    gender?: string;
    age_bracket?: string;
    region?: string;
  }) {
    try {
      let query = supabase
        .from('mv_consumer_behavior')
        .select('*');

      if (filters?.gender) {
        query = query.eq('gender', filters.gender);
      }
      if (filters?.age_bracket) {
        query = query.eq('age_bracket', filters.age_bracket);
      }
      if (filters?.region) {
        query = query.eq('region', filters.region);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data as ConsumerBehavior[];
    } catch (error) {
      console.error('Error fetching consumer behavior:', error);
      throw error;
    }
  }

  // Get product substitution patterns
  async getSubstitutionPatterns(minOccurrences: number = 5) {
    try {
      const { data, error } = await supabase
        .from('mv_substitution_patterns')
        .select('*')
        .gte('substitution_count', minOccurrences)
        .order('acceptance_rate', { ascending: false });

      if (error) throw error;

      return data as ProductSubstitution[];
    } catch (error) {
      console.error('Error fetching substitution patterns:', error);
      throw error;
    }
  }

  // Get transaction patterns by time and location
  async getTransactionPatterns(filters?: {
    region?: string;
    day_type?: string;
    start_date?: Date;
    end_date?: Date;
  }) {
    try {
      let query = supabase
        .from('mv_transaction_patterns')
        .select('*');

      if (filters?.region) {
        query = query.eq('region', filters.region);
      }
      if (filters?.day_type) {
        query = query.eq('day_type', filters.day_type);
      }
      if (filters?.start_date) {
        query = query.gte('hour_bucket', format(filters.start_date, 'yyyy-MM-dd HH:mm:ss'));
      }
      if (filters?.end_date) {
        query = query.lte('hour_bucket', format(filters.end_date, 'yyyy-MM-dd HH:mm:ss'));
      }

      const { data, error } = await query
        .order('hour_bucket', { ascending: true });

      if (error) throw error;

      return data as TransactionPattern[];
    } catch (error) {
      console.error('Error fetching transaction patterns:', error);
      throw error;
    }
  }

  // Get frequently bought together products
  async getProductCombinations(minCoOccurrence: number = 10) {
    try {
      const { data, error } = await supabase
        .from('mv_product_combinations')
        .select('*')
        .gte('co_occurrence_count', minCoOccurrence)
        .order('co_occurrence_count', { ascending: false })
        .limit(50);

      if (error) throw error;

      return data as ProductCombination[];
    } catch (error) {
      console.error('Error fetching product combinations:', error);
      throw error;
    }
  }

  // Get product request patterns
  async getProductRequestPatterns(dateRange?: { start: Date; end: Date }) {
    try {
      let query = supabase
        .from('product_requests')
        .select(`
          request_type,
          request_method,
          was_available,
          substitution_accepted,
          brand_mentioned,
          category_mentioned
        `);

      if (dateRange) {
        query = query
          .gte('created_at', format(dateRange.start, 'yyyy-MM-dd'))
          .lte('created_at', format(dateRange.end, 'yyyy-MM-dd'));
      }

      const { data, error } = await query;
      if (error) throw error;

      // Aggregate the data
      const patterns = {
        byType: {},
        byMethod: {},
        availability: { available: 0, unavailable: 0 },
        substitutionAcceptance: { accepted: 0, rejected: 0 },
        brandedRequests: 0,
        unbrandedRequests: 0
      };

      data?.forEach(request => {
        // Count by type
        patterns.byType[request.request_type] = (patterns.byType[request.request_type] || 0) + 1;
        
        // Count by method
        patterns.byMethod[request.request_method] = (patterns.byMethod[request.request_method] || 0) + 1;
        
        // Availability
        if (request.was_available) {
          patterns.availability.available++;
        } else {
          patterns.availability.unavailable++;
        }
        
        // Substitution acceptance
        if (request.substitution_accepted !== null) {
          if (request.substitution_accepted) {
            patterns.substitutionAcceptance.accepted++;
          } else {
            patterns.substitutionAcceptance.rejected++;
          }
        }
        
        // Branded vs unbranded
        if (request.brand_mentioned) {
          patterns.brandedRequests++;
        } else {
          patterns.unbrandedRequests++;
        }
      });

      return patterns;
    } catch (error) {
      console.error('Error fetching product request patterns:', error);
      throw error;
    }
  }

  // Get payment method distribution
  async getPaymentMethodDistribution(dateRange?: { start: Date; end: Date }) {
    try {
      let query = supabase
        .from('transactions')
        .select(`
          payment_method_id,
          payment_methods!inner(method_name, method_type),
          total_amount
        `);

      if (dateRange) {
        query = query
          .gte('transaction_date', format(dateRange.start, 'yyyy-MM-dd'))
          .lte('transaction_date', format(dateRange.end, 'yyyy-MM-dd'));
      }

      const { data, error } = await query;
      if (error) throw error;

      // Aggregate by payment method
      const distribution = data?.reduce((acc: any, transaction: any) => {
        const methodName = transaction.payment_methods?.method_name || 'Unknown';
        const methodType = transaction.payment_methods?.method_type || 'unknown';
        
        if (!acc[methodName]) {
          acc[methodName] = {
            name: methodName,
            type: methodType,
            count: 0,
            totalAmount: 0,
            percentage: 0
          };
        }
        
        acc[methodName].count++;
        acc[methodName].totalAmount += transaction.total_amount || 0;
        
        return acc;
      }, {});

      // Calculate percentages
      const totalAmount = Object.values(distribution || {}).reduce((sum: number, method: any) => sum + method.totalAmount, 0);
      Object.values(distribution || {}).forEach((method: any) => {
        method.percentage = totalAmount > 0 ? (method.totalAmount / totalAmount) * 100 : 0;
      });

      return Object.values(distribution || {});
    } catch (error) {
      console.error('Error fetching payment method distribution:', error);
      throw error;
    }
  }

  // Get consumer demographics summary
  async getConsumerDemographics() {
    try {
      const { data, error } = await supabase
        .from('consumer_profiles')
        .select('gender, age_bracket')
        .not('gender', 'is', null);

      if (error) throw error;

      // Aggregate demographics
      const demographics = {
        byGender: {},
        byAge: {},
        total: data?.length || 0
      };

      data?.forEach(profile => {
        // Count by gender
        demographics.byGender[profile.gender] = (demographics.byGender[profile.gender] || 0) + 1;
        
        // Count by age bracket
        demographics.byAge[profile.age_bracket] = (demographics.byAge[profile.age_bracket] || 0) + 1;
      });

      // Convert to percentages
      Object.keys(demographics.byGender).forEach(gender => {
        demographics.byGender[gender] = {
          count: demographics.byGender[gender],
          percentage: (demographics.byGender[gender] / demographics.total) * 100
        };
      });

      Object.keys(demographics.byAge).forEach(age => {
        demographics.byAge[age] = {
          count: demographics.byAge[age],
          percentage: (demographics.byAge[age] / demographics.total) * 100
        };
      });

      return demographics;
    } catch (error) {
      console.error('Error fetching consumer demographics:', error);
      throw error;
    }
  }

  // Get store intervention effectiveness
  async getStoreInterventionMetrics(dateRange?: { start: Date; end: Date }) {
    try {
      let query = supabase
        .from('store_suggestions')
        .select(`
          suggestion_reason,
          accepted,
          stores!inner(region, city)
        `);

      if (dateRange) {
        query = query
          .gte('created_at', format(dateRange.start, 'yyyy-MM-dd'))
          .lte('created_at', format(dateRange.end, 'yyyy-MM-dd'));
      }

      const { data, error } = await query;
      if (error) throw error;

      // Aggregate intervention metrics
      const metrics = {
        byReason: {},
        byRegion: {},
        overall: {
          total: data?.length || 0,
          accepted: 0,
          acceptanceRate: 0
        }
      };

      data?.forEach(suggestion => {
        // Count by reason
        if (!metrics.byReason[suggestion.suggestion_reason]) {
          metrics.byReason[suggestion.suggestion_reason] = {
            total: 0,
            accepted: 0,
            acceptanceRate: 0
          };
        }
        metrics.byReason[suggestion.suggestion_reason].total++;
        
        // Count by region
        const region = suggestion.stores?.region || 'Unknown';
        if (!metrics.byRegion[region]) {
          metrics.byRegion[region] = {
            total: 0,
            accepted: 0,
            acceptanceRate: 0
          };
        }
        metrics.byRegion[region].total++;
        
        // Count acceptances
        if (suggestion.accepted) {
          metrics.overall.accepted++;
          metrics.byReason[suggestion.suggestion_reason].accepted++;
          metrics.byRegion[region].accepted++;
        }
      });

      // Calculate acceptance rates
      metrics.overall.acceptanceRate = metrics.overall.total > 0 
        ? (metrics.overall.accepted / metrics.overall.total) * 100 
        : 0;

      Object.values(metrics.byReason).forEach((reason: any) => {
        reason.acceptanceRate = reason.total > 0 
          ? (reason.accepted / reason.total) * 100 
          : 0;
      });

      Object.values(metrics.byRegion).forEach((region: any) => {
        region.acceptanceRate = region.total > 0 
          ? (region.accepted / region.total) * 100 
          : 0;
      });

      return metrics;
    } catch (error) {
      console.error('Error fetching store intervention metrics:', error);
      throw error;
    }
  }
}

export const retailAnalyticsService = new RetailAnalyticsService();