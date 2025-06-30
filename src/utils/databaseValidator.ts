import { supabase } from '../lib/supabase';

export interface ValidationResult {
  section: string;
  data: any[];
  error?: string;
}

export class DatabaseValidator {
  static async validateKPIMetrics(): Promise<ValidationResult> {
    try {
      // Get ALL transactions for total metrics
      const { data: allTransactions, error: allError, count: totalCount } = await supabase
        .from('transactions')
        .select('total_amount', { count: 'exact' });

      if (allError) throw allError;

      const totalSales = allTransactions?.reduce((sum, t) => sum + t.total_amount, 0) || 0;
      const transactionCount = totalCount || 0;
      const avgBasket = transactionCount > 0 ? totalSales / transactionCount : 0;

      // Get last 30 days data for comparison
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentData, error: recentError } = await supabase
        .from('transactions')
        .select('total_amount')
        .gte('datetime', thirtyDaysAgo);

      if (recentError) throw recentError;

      const recentSales = recentData?.reduce((sum, t) => sum + t.total_amount, 0) || 0;
      const recentCount = recentData?.length || 0;

      // Get store count
      const { data: storeData, error: storeError } = await supabase
        .from('geography')
        .select('id');

      if (storeError) throw storeError;

      const activeOutlets = storeData?.length || 0;

      // Calculate growth rate (comparing last 30 days to previous 30 days)
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
      const { data: previousData } = await supabase
        .from('transactions')
        .select('total_amount')
        .gte('datetime', sixtyDaysAgo)
        .lt('datetime', thirtyDaysAgo);

      const previousSales = previousData?.reduce((sum, t) => sum + t.total_amount, 0) || 0;
      const growthRate = previousSales > 0 ? ((recentSales - previousSales) / previousSales) * 100 : 0;

      return {
        section: 'KPI Metrics',
        data: [{
          total_sales: totalSales,
          transaction_count: transactionCount,
          avg_basket: avgBasket,
          active_outlets: activeOutlets,
          growth_rate: growthRate,
          recent_sales: recentSales,
          recent_count: recentCount,
          time_period: 'all_time',
          comparison_period: 'last_30_days'
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
      // Get transactions aggregated by region
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select(`
          total_amount,
          geography!inner(region)
        `);

      if (transError) throw transError;

      // Aggregate by region
      const regionMap = new Map();
      transactions?.forEach(t => {
        const region = t.geography.region;
        if (!regionMap.has(region)) {
          regionMap.set(region, { 
            region, 
            total_sales: 0, 
            transaction_count: 0 
          });
        }
        const data = regionMap.get(region);
        data.total_sales += t.total_amount;
        data.transaction_count += 1;
      });

      // Convert to array and sort by sales
      const regionData = Array.from(regionMap.values())
        .sort((a, b) => b.total_sales - a.total_sales);

      return {
        section: 'Regional Performance',
        data: regionData
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
      // Get date range of transactions
      const { data: dateRange } = await supabase
        .from('transactions')
        .select('datetime')
        .order('datetime', { ascending: true })
        .limit(1);
      
      const { data: latestDate } = await supabase
        .from('transactions')
        .select('datetime')
        .order('datetime', { ascending: false })
        .limit(1);

      const [geographyResult, organizationResult, transactionResult] = await Promise.all([
        supabase.from('geography').select('id', { count: 'exact', head: true }),
        supabase.from('organization').select('id', { count: 'exact', head: true }),
        supabase.from('transactions').select('id', { count: 'exact', head: true })
      ]);

      const firstDate = dateRange?.[0]?.datetime ? new Date(dateRange[0].datetime) : null;
      const lastDate = latestDate?.[0]?.datetime ? new Date(latestDate[0].datetime) : null;
      const daysCovered = firstDate && lastDate ? Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0;

      return {
        section: 'Data Counts',
        data: [{
          geography_count: geographyResult.count || 0,
          organization_count: organizationResult.count || 0,
          transaction_count: transactionResult.count || 0,
          date_range: {
            first_date: firstDate,
            last_date: lastDate,
            days_covered: daysCovered
          }
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
    output += 'SUQI ANALYTICS DATABASE VALIDATION REPORT\n';
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