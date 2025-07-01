/**
 * Cigarette Sales Summary Query Generator
 * Provides comprehensive analysis of cigarette category for the past 30 days
 */

export const generateCigaretteSummaryQuery = () => {
  const queries = {
    // Overall cigarette sales summary
    overallSummary: `
      SELECT 
        COUNT(DISTINCT t.id) as total_transactions,
        COUNT(DISTINCT t.store_id) as active_stores,
        COUNT(DISTINCT ti.product_id) as unique_skus,
        SUM(ti.quantity) as total_units_sold,
        SUM(ti.total_price) as total_revenue,
        AVG(ti.total_price) as avg_transaction_value,
        COUNT(DISTINCT DATE(t.timestamp)) as days_with_sales
      FROM transactions t
      JOIN transaction_items ti ON t.id = ti.transaction_id
      JOIN products p ON ti.product_id = p.id
      WHERE p.category = 'cigarettes'
        AND t.timestamp >= CURRENT_DATE - INTERVAL '30 days'
    `,

    // Brand performance breakdown
    brandPerformance: `
      SELECT 
        p.brand,
        COUNT(DISTINCT ti.transaction_id) as transactions,
        SUM(ti.quantity) as units_sold,
        SUM(ti.total_price) as revenue,
        ROUND(SUM(ti.total_price) * 100.0 / SUM(SUM(ti.total_price)) OVER(), 2) as market_share_pct,
        AVG(ti.unit_price) as avg_price_per_unit,
        COUNT(DISTINCT p.sku) as sku_count
      FROM transaction_items ti
      JOIN products p ON ti.product_id = p.id
      JOIN transactions t ON ti.transaction_id = t.id
      WHERE p.category = 'cigarettes'
        AND t.timestamp >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY p.brand
      ORDER BY revenue DESC
      LIMIT 10
    `,

    // Regional distribution
    regionalBreakdown: `
      SELECT 
        s.region,
        COUNT(DISTINCT t.id) as transactions,
        SUM(ti.quantity) as units_sold,
        SUM(ti.total_price) as revenue,
        COUNT(DISTINCT s.id) as stores_selling,
        AVG(ti.total_price) as avg_transaction_value
      FROM transactions t
      JOIN transaction_items ti ON t.id = ti.transaction_id
      JOIN products p ON ti.product_id = p.id
      JOIN stores s ON t.store_id = s.id
      WHERE p.category = 'cigarettes'
        AND t.timestamp >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY s.region
      ORDER BY revenue DESC
    `,

    // Top selling SKUs
    topProducts: `
      SELECT 
        p.name as product_name,
        p.brand,
        p.sku,
        SUM(ti.quantity) as units_sold,
        SUM(ti.total_price) as revenue,
        COUNT(DISTINCT ti.transaction_id) as purchase_frequency,
        AVG(ti.unit_price) as avg_unit_price
      FROM transaction_items ti
      JOIN products p ON ti.product_id = p.id
      JOIN transactions t ON ti.transaction_id = t.id
      WHERE p.category = 'cigarettes'
        AND t.timestamp >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY p.id, p.name, p.brand, p.sku
      ORDER BY revenue DESC
      LIMIT 20
    `,

    // Daily trend analysis
    dailyTrend: `
      SELECT 
        DATE(t.timestamp) as sale_date,
        COUNT(DISTINCT t.id) as transactions,
        SUM(ti.quantity) as units_sold,
        SUM(ti.total_price) as daily_revenue,
        COUNT(DISTINCT p.brand) as brands_sold
      FROM transactions t
      JOIN transaction_items ti ON t.id = ti.transaction_id
      JOIN products p ON ti.product_id = p.id
      WHERE p.category = 'cigarettes'
        AND t.timestamp >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(t.timestamp)
      ORDER BY sale_date DESC
    `,

    // Substitution patterns
    substitutionAnalysis: `
      SELECT 
        p.brand as original_brand,
        COUNT(CASE WHEN ti.is_substitution THEN 1 END) as substitution_count,
        COUNT(*) as total_sales,
        ROUND(COUNT(CASE WHEN ti.is_substitution THEN 1 END) * 100.0 / COUNT(*), 2) as substitution_rate
      FROM transaction_items ti
      JOIN products p ON ti.product_id = p.id
      JOIN transactions t ON ti.transaction_id = t.id
      WHERE p.category = 'cigarettes'
        AND t.timestamp >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY p.brand
      HAVING COUNT(*) > 50
      ORDER BY substitution_rate DESC
    `,

    // Peak hours analysis
    peakHours: `
      SELECT 
        EXTRACT(HOUR FROM t.timestamp) as hour_of_day,
        COUNT(DISTINCT t.id) as transactions,
        SUM(ti.quantity) as units_sold,
        SUM(ti.total_price) as revenue,
        AVG(ti.total_price) as avg_transaction_value
      FROM transactions t
      JOIN transaction_items ti ON t.id = ti.transaction_id
      JOIN products p ON ti.product_id = p.id
      WHERE p.category = 'cigarettes'
        AND t.timestamp >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY EXTRACT(HOUR FROM t.timestamp)
      ORDER BY hour_of_day
    `,

    // Customer demographics
    customerDemographics: `
      SELECT 
        t.customer_age_group,
        COUNT(DISTINCT t.id) as transactions,
        SUM(ti.quantity) as units_purchased,
        SUM(ti.total_price) as revenue,
        AVG(ti.total_price) as avg_spend,
        COUNT(DISTINCT p.brand) as brands_purchased
      FROM transactions t
      JOIN transaction_items ti ON t.id = ti.transaction_id
      JOIN products p ON ti.product_id = p.id
      WHERE p.category = 'cigarettes'
        AND t.timestamp >= CURRENT_DATE - INTERVAL '30 days'
        AND t.customer_age_group IS NOT NULL
      GROUP BY t.customer_age_group
      ORDER BY revenue DESC
    `,

    // Payment method preferences
    paymentMethods: `
      SELECT 
        t.payment_method,
        COUNT(DISTINCT t.id) as transactions,
        SUM(ti.total_price) as revenue,
        AVG(ti.total_price) as avg_transaction_value,
        ROUND(COUNT(DISTINCT t.id) * 100.0 / SUM(COUNT(DISTINCT t.id)) OVER(), 2) as pct_of_transactions
      FROM transactions t
      JOIN transaction_items ti ON t.id = ti.transaction_id
      JOIN products p ON ti.product_id = p.id
      WHERE p.category = 'cigarettes'
        AND t.timestamp >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY t.payment_method
      ORDER BY transactions DESC
    `
  };

  return queries;
};

/**
 * Generate a comprehensive summary from query results
 */
export const generateCigaretteSummary = (results: Record<string, any[]>) => {
  const summary = {
    overview: {
      totalRevenue: 0,
      totalTransactions: 0,
      totalUnits: 0,
      activeStores: 0,
      uniqueSKUs: 0,
      avgTransactionValue: 0
    },
    topBrands: [],
    topRegions: [],
    insights: [],
    recommendations: []
  };

  // Process overall summary
  if (results.overallSummary && results.overallSummary[0]) {
    const overall = results.overallSummary[0];
    summary.overview = {
      totalRevenue: overall.total_revenue || 0,
      totalTransactions: overall.total_transactions || 0,
      totalUnits: overall.total_units_sold || 0,
      activeStores: overall.active_stores || 0,
      uniqueSKUs: overall.unique_skus || 0,
      avgTransactionValue: overall.avg_transaction_value || 0
    };
  }

  // Process brand performance
  if (results.brandPerformance) {
    summary.topBrands = results.brandPerformance.slice(0, 5).map(brand => ({
      name: brand.brand,
      revenue: brand.revenue,
      marketShare: brand.market_share_pct,
      units: brand.units_sold
    }));
  }

  // Process regional data
  if (results.regionalBreakdown) {
    summary.topRegions = results.regionalBreakdown.slice(0, 5).map(region => ({
      name: region.region,
      revenue: region.revenue,
      transactions: region.transactions,
      stores: region.stores_selling
    }));
  }

  // Generate insights
  summary.insights = generateInsights(results);
  summary.recommendations = generateRecommendations(results);

  return summary;
};

/**
 * Generate business insights from the data
 */
const generateInsights = (results: Record<string, any[]>) => {
  const insights = [];

  // Brand concentration insight
  if (results.brandPerformance && results.brandPerformance[0]) {
    const topBrand = results.brandPerformance[0];
    if (topBrand.market_share_pct > 30) {
      insights.push({
        type: 'market_dominance',
        message: `${topBrand.brand} dominates with ${topBrand.market_share_pct}% market share`,
        severity: 'info'
      });
    }
  }

  // Substitution rate insight
  if (results.substitutionAnalysis && results.substitutionAnalysis[0]) {
    const highSubstitution = results.substitutionAnalysis.find(s => s.substitution_rate > 15);
    if (highSubstitution) {
      insights.push({
        type: 'substitution_alert',
        message: `High substitution rate for ${highSubstitution.original_brand} (${highSubstitution.substitution_rate}%)`,
        severity: 'warning'
      });
    }
  }

  // Peak hour insight
  if (results.peakHours) {
    const peakHour = results.peakHours.reduce((max, hour) => 
      hour.revenue > (max?.revenue || 0) ? hour : max, null);
    if (peakHour) {
      insights.push({
        type: 'peak_sales',
        message: `Peak cigarette sales at ${peakHour.hour_of_day}:00 (₱${peakHour.revenue.toLocaleString()})`,
        severity: 'info'
      });
    }
  }

  return insights;
};

/**
 * Generate business recommendations
 */
const generateRecommendations = (results: Record<string, any[]>) => {
  const recommendations = [];

  // Stock optimization
  if (results.topProducts && results.topProducts.length > 0) {
    const topSKUs = results.topProducts.slice(0, 3).map(p => p.product_name).join(', ');
    recommendations.push({
      action: 'Optimize inventory for top SKUs',
      details: `Focus on maintaining stock for: ${topSKUs}`,
      priority: 'high'
    });
  }

  // Regional expansion
  if (results.regionalBreakdown && results.regionalBreakdown.length > 3) {
    const underperforming = results.regionalBreakdown.slice(-2);
    if (underperforming[0].revenue < results.regionalBreakdown[0].revenue * 0.3) {
      recommendations.push({
        action: 'Consider regional strategy review',
        details: `${underperforming.map(r => r.region).join(' and ')} showing low performance`,
        priority: 'medium'
      });
    }
  }

  // Payment method optimization
  if (results.paymentMethods) {
    const digitalPayments = results.paymentMethods
      .filter(p => ['gcash', 'card', 'bank_transfer'].includes(p.payment_method))
      .reduce((sum, p) => sum + (p.pct_of_transactions || 0), 0);
    
    if (digitalPayments < 30) {
      recommendations.push({
        action: 'Promote digital payment adoption',
        details: `Only ${digitalPayments.toFixed(1)}% using digital payments`,
        priority: 'medium'
      });
    }
  }

  return recommendations;
};