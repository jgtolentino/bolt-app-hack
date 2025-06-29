import { supabase } from '../lib/supabase';

export interface ValidationResult {
  section: string;
  data: any[];
  error?: string;
}

export class DatabaseValidator {
  static async validateKPIMetrics(): Promise<ValidationResult> {
    try {
      // Get total sales and transaction count for last 30 days
      const { data: salesData, error: salesError } = await supabase
        .from('transactions')
        .select('total_amount, datetime')
        .gte('datetime', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (salesError) throw salesError;

      const totalSales = salesData?.reduce((sum, t) => sum + t.total_amount, 0) || 0;
      const transactionCount = salesData?.length || 0;
      const avgBasket = transactionCount > 0 ? totalSales / transactionCount : 0;

      // Get store count
      const { data: storeData, error: storeError } = await supabase
        .from('geography')
        .select('id');

      if (storeError) throw storeError;

      const activeOutlets = storeData?.length || 0;

      return {
        section: 'KPI Metrics',
        data: [{
          total_sales: totalSales,
          transaction_count: transactionCount,
          avg_basket: avgBasket,
          active_outlets: activeOutlets,
          growth_rate: 14.7 // Mock growth rate for now
        }]
      };
    } catch (error) {
      return {
        section: 'KPI Metrics',
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async validateRegionalPerformance(): Promise<ValidationResult> {
    try {
      const { data, error } = await supabase
        .from('v_geographic_performance')
        .select('*')
        .order('total_sales', { ascending: false })
        .limit(10);

      if (error) throw error;

      return {
        section: 'Regional Performance',
        data: data || []
      };
    } catch (error) {
      return {
        section: 'Regional Performance',
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async validatePaymentMethods(): Promise<ValidationResult> {
    try {
      const { data, error } = await supabase
        .from('v_payment_method_analysis')
        .select('*')
        .order('transaction_count', { ascending: false });

      if (error) throw error;

      return {
        section: 'Payment Methods',
        data: data || []
      };
    } catch (error) {
      return {
        section: 'Payment Methods',
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async validateTopProducts(): Promise<ValidationResult> {
    try {
      const { data, error } = await supabase
        .from('v_product_performance')
        .select('*')
        .order('total_sales', { ascending: false })
        .limit(10);

      if (error) throw error;

      return {
        section: 'Top Products',
        data: data || []
      };
    } catch (error) {
      return {
        section: 'Top Products',
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async validateRecentTransactions(): Promise<ValidationResult> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          geography:geography_id(region, city_municipality, store_name),
          organization:organization_id(brand, sku, category)
        `)
        .order('datetime', { ascending: false })
        .limit(10);

      if (error) throw error;

      return {
        section: 'Recent Transactions',
        data: data || []
      };
    } catch (error) {
      return {
        section: 'Recent Transactions',
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async validateDataCounts(): Promise<ValidationResult> {
    try {
      const [geographyResult, organizationResult, transactionResult] = await Promise.all([
        supabase.from('geography').select('id', { count: 'exact', head: true }),
        supabase.from('organization').select('id', { count: 'exact', head: true }),
        supabase.from('transactions').select('id', { count: 'exact', head: true })
      ]);

      return {
        section: 'Data Counts',
        data: [{
          geography_count: geographyResult.count || 0,
          organization_count: organizationResult.count || 0,
          transaction_count: transactionResult.count || 0
        }]
      };
    } catch (error) {
      return {
        section: 'Data Counts',
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async runFullValidation(): Promise<ValidationResult[]> {
    console.log('🔍 Starting database validation...');
    
    const results = await Promise.all([
      this.validateDataCounts(),
      this.validateKPIMetrics(),
      this.validateRegionalPerformance(),
      this.validatePaymentMethods(),
      this.validateTopProducts(),
      this.validateRecentTransactions()
    ]);

    console.log('✅ Database validation complete');
    return results;
  }

  static formatValidationResults(results: ValidationResult[]): string {
    let output = '='.repeat(80) + '\n';
    output += 'SUKI ANALYTICS DATABASE VALIDATION REPORT\n';
    output += '='.repeat(80) + '\n\n';

    results.forEach(result => {
      output += `📊 ${result.section.toUpperCase()}\n`;
      output += '-'.repeat(40) + '\n';
      
      if (result.error) {
        output += `❌ Error: ${result.error}\n\n`;
        return;
      }

      if (result.data.length === 0) {
        output += '⚠️  No data found\n\n';
        return;
      }

      // Format data based on section
      if (result.section === 'KPI Metrics') {
        const kpi = result.data[0];
        output += `Total Sales: ₱${kpi.total_sales?.toLocaleString() || 0}\n`;
        output += `Transactions: ${kpi.transaction_count?.toLocaleString() || 0}\n`;
        output += `Avg Basket: ₱${kpi.avg_basket?.toFixed(2) || 0}\n`;
        output += `Active Outlets: ${kpi.active_outlets || 0}\n`;
        output += `Growth Rate: ${kpi.growth_rate}%\n`;
      } else if (result.section === 'Data Counts') {
        const counts = result.data[0];
        output += `Geography Records: ${counts.geography_count}\n`;
        output += `Organization Records: ${counts.organization_count}\n`;
        output += `Transaction Records: ${counts.transaction_count}\n`;
      } else if (result.section === 'Regional Performance') {
        result.data.slice(0, 5).forEach((region, index) => {
          output += `${index + 1}. ${region.region} - ₱${region.total_sales?.toLocaleString() || 0}\n`;
        });
      } else if (result.section === 'Payment Methods') {
        result.data.forEach(method => {
          output += `${method.payment_method}: ${method.percentage_of_transactions}% (${method.transaction_count} transactions)\n`;
        });
      } else if (result.section === 'Top Products') {
        result.data.slice(0, 5).forEach((product, index) => {
          output += `${index + 1}. ${product.sku} - ₱${product.total_sales?.toLocaleString() || 0}\n`;
        });
      } else if (result.section === 'Recent Transactions') {
        output += `Latest ${result.data.length} transactions found\n`;
        result.data.slice(0, 3).forEach(transaction => {
          output += `- ₱${transaction.total_amount} at ${(transaction as any).geography?.store_name || 'Unknown Store'}\n`;
        });
      }
      
      output += '\n';
    });

    return output;
  }
}