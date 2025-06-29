// Advanced AI features for Philippine retail analytics
export class AIFeatures {
  // Sales performance analysis with confidence
  static generateSalesInsights(data: any[]): {
    insights: string[]
    recommendations: string[]
    confidence_scores: { [key: string]: number }
  } {
    const insights: string[] = []
    const recommendations: string[] = []
    const confidence_scores: { [key: string]: number } = {}
    
    // Top performing analysis
    const sortedData = [...data].sort((a, b) => b.total_sales - a.total_sales)
    const topPerformer = sortedData[0]
    const avgSales = data.reduce((sum, item) => sum + item.total_sales, 0) / data.length
    
    if (topPerformer.total_sales > avgSales * 1.5) {
      insights.push(`${topPerformer.region || topPerformer.category || topPerformer.name} significantly outperforms average by ${((topPerformer.total_sales / avgSales - 1) * 100).toFixed(1)}%`)
      recommendations.push(`Scale successful strategies from ${topPerformer.region || topPerformer.category || topPerformer.name} to underperforming areas`)
      confidence_scores['top_performer_analysis'] = 0.92
    }
    
    // Underperformer identification
    const underperformers = data.filter(item => item.total_sales < avgSales * 0.7)
    if (underperformers.length > 0) {
      insights.push(`${underperformers.length} locations/categories performing below 70% of average`)
      recommendations.push(`Focus intervention on bottom ${underperformers.length} performers with targeted promotions`)
      confidence_scores['underperformer_analysis'] = 0.88
    }
    
    // Utang/Lista analysis
    const utangListaData = data.find(item => item.payment_method === 'Utang/Lista')
    if (utangListaData) {
      insights.push(`Utang/Lista credit system represents ${utangListaData.percentage || 28.1}% of transactions, showing strong community trust`)
      recommendations.push(`Implement digital tracking for Utang/Lista to improve collection rates`)
      confidence_scores['utang_lista_analysis'] = 0.95
    }
    
    // Regional insights
    const regions = data.filter(item => item.region)
    if (regions.length > 0) {
      const regionNames = regions.map(r => r.region).join(', ')
      insights.push(`Regional performance varies significantly across ${regionNames}`)
      recommendations.push(`Tailor product mix to regional preferences for optimal sales`)
      confidence_scores['regional_analysis'] = 0.85
    }
    
    // Seasonal insights
    const now = new Date()
    const currentMonth = now.getMonth()
    
    if (currentMonth >= 8 && currentMonth <= 11) { // Sept-Dec
      insights.push(`Christmas season (Sept-Jan) typically shows 40% sales increase`)
      recommendations.push(`Increase inventory of gift items and high-demand products for holiday season`)
      confidence_scores['seasonal_analysis'] = 0.90
    } else if (currentMonth >= 2 && currentMonth <= 3) { // Mar-Apr
      insights.push(`Holy Week period typically shows 15% sales decrease`)
      recommendations.push(`Plan inventory reduction and promotions before Holy Week slowdown`)
      confidence_scores['seasonal_analysis'] = 0.87
    } else if (currentMonth >= 5 && currentMonth <= 6) { // Jun-Jul
      insights.push(`Back-to-school season typically shows 25% sales increase`)
      recommendations.push(`Stock school supplies and student-focused products`)
      confidence_scores['seasonal_analysis'] = 0.89
    }
    
    // Payment method insights
    insights.push(`Payment method distribution reflects Filipino retail patterns: Cash (52.8%), Utang/Lista (28.1%), GCash (18.9%)`)
    recommendations.push(`Consider GCash integration to capture growing digital payment trend`)
    confidence_scores['payment_method_analysis'] = 0.93
    
    return { insights, recommendations, confidence_scores }
  }
  
  // Anomaly detection with severity classification
  static detectAnomalies(data: any[], threshold: number = 2.0): {
    anomalies: { item: any; type: 'spike' | 'drop' | 'pattern'; severity: 'low' | 'medium' | 'high'; suggested_action: string }[]
    baseline_metrics: { mean: number; std_dev: number; threshold_used: number }
  } {
    const values = data.map(item => item.total_sales || item.value || 0)
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    const std_dev = Math.sqrt(variance)
    
    const anomalies = data.map((item, index) => {
      const value = item.total_sales || item.value || 0
      const z_score = Math.abs((value - mean) / std_dev)
      
      if (z_score > threshold) {
        const isSpike = value > mean
        const severity = z_score > 3 ? 'high' : z_score > 2.5 ? 'medium' : 'low'
        
        return {
          item,
          type: isSpike ? 'spike' : 'drop' as 'spike' | 'drop' | 'pattern',
          severity: severity as 'low' | 'medium' | 'high',
          suggested_action: isSpike 
            ? `Investigate positive drivers in ${item.region || item.category || item.name}` 
            : `Urgent attention needed for ${item.region || item.category || item.name}`
        }
      }
      return null
    }).filter(Boolean) as any[]
    
    return {
      anomalies,
      baseline_metrics: { mean, std_dev, threshold_used: threshold }
    }
  }
  
  // Generate mock responses for demo purposes
  static generateMockResponse(query: string, context: any): string {
    const lowerQuery = query.toLowerCase()
    
    // Performance analysis response
    if (lowerQuery.includes('performance') || lowerQuery.includes('analysis')) {
      return `📊 **Performance Analysis Results**

Based on your Philippine retail data, I've identified several key insights:

**Regional Performance:**
• NCR leads with ₱850,000 in sales (35.4% of total)
• Region VII shows highest growth at 22.1%
• Region XI (Davao) presents greatest expansion opportunity with 25.4% growth

**Product Categories:**
• Beverages category dominates with 28.5% growth rate
• Snacks category shows strong performance in Visayas regions
• Personal Care underperforming in Region III (-5.2% vs target)

**Utang/Lista System:**
• 28.1% of transactions use Utang/Lista credit system
• Average credit amount (₱217) higher than cash transactions (₱165)
• Collection rate varies by region (NCR: 72%, Visayas: 65%)

**Recommendations:**
1. Expand beverage offerings in NCR (+15% potential growth)
2. Implement digital Utang/Lista tracking to improve collection rates
3. Target Region XI for expansion with localized product mix

*Confidence score: 92% based on current data patterns*`
    }
    
    // Forecast/prediction response
    if (lowerQuery.includes('forecast') || lowerQuery.includes('predict')) {
      return `🔮 **Philippine Retail Forecast**

Based on historical patterns and current trends, here's my forecast for the next quarter:

**Sales Projections:**
• Overall growth: +15.2% (±2.5%)
• NCR: +18.7% (high confidence)
• Region VII: +22.1% (medium confidence)
• Region III: +12.8% (high confidence)

**Seasonal Factors:**
${new Date().getMonth() >= 8 ? 
  `• Christmas season impact: +40% expected sales increase
• Peak weeks: December 15-30 (historically highest volume)
• Gift categories projected to grow 65%` :
  new Date().getMonth() >= 5 ?
  `• Back-to-school impact: +25% expected sales increase
• Peak weeks: June 1-15 (historically highest volume)
• School supplies projected to grow 45%` :
  `• Regular season with payday spikes (+20%) on 15th and 30th
• Weekend sales expected to be 35% higher than weekdays
• Promotional effectiveness increases 25% during paydays`
}

**Payment Method Trends:**
• Cash remains dominant: 52.8% of transactions
• Utang/Lista stable at 28.1% with seasonal variations
• GCash adoption increasing: projected to reach 22% by next quarter

**Confidence: 87%** based on 3-year historical data patterns and current economic indicators.`
    }
    
    // Utang/Lista specific response
    if (lowerQuery.includes('utang') || lowerQuery.includes('lista') || lowerQuery.includes('credit')) {
      return `💳 **Utang/Lista Credit System Analysis**

**Current Performance:**
• Credit volume: ₱${(context.total_sales * 0.281).toLocaleString()} (28.1% of total sales)
• Active accounts: ${context.credit_transactions || 125} customers
• Average credit amount: ₱217 (higher than cash average of ₱165)
• Collection rate: 68.5% overall (varies by region)

**Risk Assessment:**
• **Low Risk:** Strong community trust indicates reliable customer base
• **Medium Risk:** 28.1% credit exposure requires monitoring
• **Opportunity:** Higher transaction values suggest customer loyalty

**Regional Variations:**
• NCR: 72% collection rate (best performing)
• Visayas: 65% collection rate (needs improvement)
• Mindanao: 70% collection rate (improving trend)

**Strategic Recommendations:**
1. Implement digital tracking system for better credit management
2. Set credit limits based on customer payment history
3. Offer small incentives for early payment (5% discount)
4. Monitor seasonal patterns in credit usage

**Cultural Context:**
Utang/Lista represents deep community trust and is essential for sari-sari store success in Philippine retail.

*Confidence score: 95% based on extensive Philippine retail data*`
    }
    
    // Anomaly detection response
    if (lowerQuery.includes('anomaly') || lowerQuery.includes('unusual')) {
      return `⚠️ **Anomaly Detection Results**

I've analyzed your transaction data and identified these significant anomalies:

**Sales Spikes:**
• Region VII: +45.2% above expected range on March 15-16
  → Coincides with local festival, likely normal seasonal pattern
• Beverages category: +38.7% spike on weekends
  → Consistent pattern, suggests opportunity for weekend promotions

**Concerning Drops:**
• NCR stores: -22.3% below expected range last Tuesday
  → Requires investigation, possible inventory issues
• Personal Care: -18.5% below trend in Region III
  → Competitor activity detected, recommend price matching

**Utang/Lista Patterns:**
• Collection rate dropped to 52% in Mindanao stores (normally 70%)
  → Immediate attention required, possible economic factors
• Credit limit utilization increased 15% in last 30 days
  → Monitor closely, may indicate economic pressure

**Recommended Actions:**
1. Investigate NCR sales drop with store managers
2. Review Personal Care pricing strategy in Region III
3. Implement stricter credit controls in Mindanao temporarily
4. Capitalize on weekend beverage sales with targeted promotions

*Anomaly detection confidence: 89% based on 6-month baseline*`
    }
    
    // Default response for other queries
    return `📊 **Philippine Retail Analysis**

Based on your query about "${query}", here's what I can tell you from the current data:

**Key Metrics:**
• Total sales: ₱${context.total_sales?.toLocaleString() || '2,450,000'}
• Recent transactions: ${context.recent_transactions || '8,547'}
• Average transaction: ₱${context.avg_transaction?.toFixed(2) || '287.00'}

**Regional Insights:**
• NCR leads with 35.4% market share
• Region VII showing strongest growth at 22.1%
• Region XI (Davao) presents expansion opportunity

**Product Performance:**
• Beverages category dominates with 28.5% growth
• Snacks category strong in Visayas regions
• Top SKU: Coca-Cola 355ml (₱180K sales)

**Payment Methods:**
• Cash: 52.8% of transactions
• Utang/Lista: 28.1% (showing strong community trust)
• GCash: 18.9% (growing digital adoption)

**Recommendations:**
1. Focus expansion on high-growth Region XI
2. Optimize inventory for seasonal patterns
3. Implement digital tracking for Utang/Lista system

*Confidence score: 90% based on current data patterns*`
  }
}