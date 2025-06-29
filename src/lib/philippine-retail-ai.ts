// Domain-specific AI enhancement for Philippine retail market
export class PhilippineRetailAI {
  // Production knowledge base
  static readonly PHILIPPINE_CONTEXT = {
    regions: {
      'NCR': { population: 13_500_000, economic_level: 'high', urban_density: 'very_high' },
      'Region III': { population: 12_400_000, economic_level: 'medium-high', urban_density: 'medium' },
      'Region IV-A': { population: 16_200_000, economic_level: 'medium-high', urban_density: 'high' },
      'Region VII': { population: 8_100_000, economic_level: 'medium', urban_density: 'medium' },
      'Region XI': { population: 5_200_000, economic_level: 'medium', urban_density: 'low' }
    },
    
    cultural_events: [
      { name: 'Christmas Season', period: '09-01_01-31', impact: 'high', spending: '+40%' },
      { name: 'Holy Week', period: '03-25_04-10', impact: 'negative', spending: '-15%' },
      { name: 'Back to School', period: '06-01_07-31', impact: 'high', spending: '+25%' },
      { name: 'Payday Periods', period: '15th_30th', impact: 'positive', spending: '+20%' }
    ],
    
    sari_sari_dynamics: {
      avg_transaction: 47.50,
      peak_hours: ['7-9 AM', '5-7 PM'],
      popular_categories: ['Beverages', 'Snacks', 'Personal Care', 'Household'],
      payment_methods: { cash: 52.8, utang_lista: 28.1, gcash: 18.9, credit: 2.9 }
    },
    
    consumer_patterns: {
      bulk_buying: 'payday_periods',
      brand_loyalty: 'medium',
      price_sensitivity: 'high',
      promotions_effectiveness: 'very_high',
      utang_lista_prevalence: 'high'
    }
  }
  
  // Enhanced system prompts with local context
  static buildContextualPrompt(query: string, data: any): string {
    const relevantRegions = this.extractRegions(query)
    const seasonality = this.getSeasonalContext()
    const retailContext = this.getSariSariContext(data)
    
    return `You are a Philippine retail analytics AI specialist with deep knowledge of:

📍 GEOGRAPHIC CONTEXT:
${relevantRegions.map(region => 
  `- ${region}: ${this.PHILIPPINE_CONTEXT.regions[region]?.economic_level} income, ${this.PHILIPPINE_CONTEXT.regions[region]?.urban_density} density`
).join('\n')}

🗓️ SEASONAL CONTEXT:
${seasonality}

🏪 SARI-SARI STORE DYNAMICS:
- Average transaction: ₱${this.PHILIPPINE_CONTEXT.sari_sari_dynamics.avg_transaction}
- Peak hours: ${this.PHILIPPINE_CONTEXT.sari_sari_dynamics.peak_hours.join(', ')}
- Payment: ${this.PHILIPPINE_CONTEXT.sari_sari_dynamics.payment_methods.cash}% cash, ${this.PHILIPPINE_CONTEXT.sari_sari_dynamics.payment_methods.utang_lista}% utang/lista, ${this.PHILIPPINE_CONTEXT.sari_sari_dynamics.payment_methods.gcash}% GCash

💳 UTANG/LISTA INSIGHTS:
- Credit system represents 28.1% of transactions
- Shows high customer trust and loyalty
- Average credit amount higher than cash transactions
- Critical for sari-sari store cash flow management

📊 CURRENT DATA CONTEXT:
${retailContext}

🎯 RESPONSE REQUIREMENTS:
- Use Philippine Peso (₱) formatting
- Reference local market dynamics including utang/lista
- Provide actionable insights for sari-sari store operators
- Consider cultural and economic factors
- Include confidence scores for predictions
- Address payment method implications

Query: ${query}`
  }
  
  private static extractRegions(query: string): string[] {
    const regions = Object.keys(this.PHILIPPINE_CONTEXT.regions)
    return regions.filter(region => 
      new RegExp(region.replace(' ', '\\s+'), 'i').test(query)
    )
  }
  
  private static getSeasonalContext(): string {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentDay = now.getDate()
    
    const relevantEvents = this.PHILIPPINE_CONTEXT.cultural_events.filter(event => {
      const [startMonth, startDay] = event.period.split('_')[0].split('-').map(Number)
      const [endMonth, endDay] = event.period.split('_')[1].split('-').map(Number)
      
      return (currentMonth === startMonth && currentDay >= startDay) ||
             (currentMonth === endMonth && currentDay <= endDay) ||
             (currentMonth > startMonth && currentMonth < endMonth)
    })
    
    return relevantEvents.length > 0 
      ? relevantEvents.map(e => `${e.name}: ${e.impact} impact (${e.spending})`).join('\n')
      : 'Regular trading period'
  }
  
  private static getSariSariContext(data: any): string {
    if (!data) return 'No current data available'
    
    return `
- Total transactions: ${data.recent_transactions || 'N/A'}
- Average transaction: ₱${data.avg_transaction?.toFixed(2) || 'N/A'}
- Top region: ${data.top_performing_region?.region || 'N/A'}
- Recent sales: ₱${data.total_sales?.toLocaleString() || 'N/A'}
- Utang/Lista volume: ${data.credit_transactions || 'N/A'} transactions`
  }
}