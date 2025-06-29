// Production-grade AI model routing for cost optimization
interface QueryComplexity {
  score: number
  factors: string[]
  recommendedModel: 'groq-fast' | 'openai-complex' | 'openai-advanced'
  confidence: number
  estimatedTokens: number
  estimatedCost: number
}

export class IntelligentModelRouter {
  // Sophisticated query analysis from production Philippine retail system
  static analyzeQuery(query: string, context?: any): QueryComplexity {
    let complexityScore = 0
    const factors: string[] = []
    
    // Simple patterns (Groq territory - fast and cheap)
    const simplePatterns = [
      /show\s+(top|best|worst|latest)\s+\d+/i,
      /count\s+(customers|transactions|sales)/i,
      /total\s+(sales|revenue|transactions)/i,
      /current\s+(status|performance)/i,
      /list\s+(products|categories|regions)/i
    ]
    
    // Complex patterns (OpenAI territory)
    const complexPatterns = [
      /analyze\s+(trends|patterns|performance)/i,
      /predict\s+(future|sales|revenue)/i,
      /forecast\s+(next|upcoming)/i,
      /compare\s+.+\s+with\s+.+/i,
      /correlation\s+between/i,
      /regression\s+analysis/i,
      /machine\s+learning/i,
      /deep\s+dive/i,
      /comprehensive\s+analysis/i
    ]
    
    // Advanced patterns (OpenAI GPT-4 territory)
    const advancedPatterns = [
      /generate\s+(report|presentation|strategy)/i,
      /create\s+(dashboard|visualization|chart)/i,
      /recommend\s+(actions|strategies|optimizations)/i,
      /business\s+(intelligence|insights|recommendations)/i,
      /competitive\s+(analysis|intelligence)/i,
      /market\s+(analysis|penetration|opportunity)/i
    ]
    
    // Philippine retail specific patterns
    const retailSpecificPatterns = [
      /sari[- ]?sari/i, /barangay/i, /ncr/i, /luzon/i, /visayas/i, /mindanao/i,
      /payday/i, /fiesta/i, /christmas\s+season/i, /holy\s+week/i,
      /fmcg/i, /cpg/i, /competitor/i, /market\s+share/i, /utang/i, /lista/i
    ]
    
    // Calculate complexity score
    simplePatterns.forEach(pattern => {
      if (pattern.test(query)) {
        complexityScore -= 2
        factors.push('Simple query pattern')
      }
    })
    
    complexPatterns.forEach(pattern => {
      if (pattern.test(query)) {
        complexityScore += 3
        factors.push('Complex analysis required')
      }
    })
    
    advancedPatterns.forEach(pattern => {
      if (pattern.test(query)) {
        complexityScore += 5
        factors.push('Advanced analytics required')
      }
    })
    
    retailSpecificPatterns.forEach(pattern => {
      if (pattern.test(query)) {
        complexityScore += 1
        factors.push('Philippine retail context')
      }
    })
    
    // Word count and question analysis
    const wordCount = query.split(/\s+/).length
    if (wordCount > 20) {
      complexityScore += 2
      factors.push('Long query detected')
    }
    
    const questionWords = ['how', 'why', 'what', 'when', 'where', 'which']
    const questionCount = questionWords.filter(word => 
      new RegExp(`\\b${word}\\b`, 'i').test(query)
    ).length
    
    if (questionCount >= 2) {
      complexityScore += 2
      factors.push('Multiple questions detected')
    }
    
    // Context complexity
    if (context?.requiresFunctionCalling) {
      complexityScore += 4
      factors.push('Function calling required')
    }
    
    if (context?.multipleDataSources) {
      complexityScore += 3
      factors.push('Multiple data sources')
    }
    
    // Determine model and costs
    let recommendedModel: 'groq-fast' | 'openai-complex' | 'openai-advanced'
    let estimatedTokens: number
    let estimatedCost: number
    
    if (complexityScore <= 0) {
      recommendedModel = 'groq-fast'
      estimatedTokens = 150
      estimatedCost = 0.00009  // Groq pricing
    } else if (complexityScore <= 4) {
      recommendedModel = 'openai-complex'
      estimatedTokens = 500
      estimatedCost = 0.01     // OpenAI GPT-3.5
    } else {
      recommendedModel = 'openai-advanced'
      estimatedTokens = 1000
      estimatedCost = 0.03     // OpenAI GPT-4
    }
    
    const confidence = Math.min(Math.max((Math.abs(complexityScore) / 10) * 100, 60), 95)
    
    return {
      score: complexityScore,
      factors,
      recommendedModel,
      confidence,
      estimatedTokens,
      estimatedCost
    }
  }
  
  // Cost tracking and optimization
  static trackUsage(model: string, tokens: number, cost: number) {
    const usage = JSON.parse(localStorage.getItem('ai_usage') || '{}')
    const today = new Date().toISOString().split('T')[0]
    
    if (!usage[today]) {
      usage[today] = { groq: 0, openai: 0, cost: 0, tokens: 0, queries: 0 }
    }
    
    usage[today][model === 'groq-fast' ? 'groq' : 'openai'] += 1
    usage[today].cost += cost
    usage[today].tokens += tokens
    usage[today].queries += 1
    
    localStorage.setItem('ai_usage', JSON.stringify(usage))
    
    console.log(`📊 AI Usage Today: ${JSON.stringify(usage[today])}`)
  }
}