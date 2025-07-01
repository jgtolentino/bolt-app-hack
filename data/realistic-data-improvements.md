# Realistic Data Improvements for JTI Sample

## 1. Market Share Adjustments
```javascript
// More realistic market shares
const marketShares = {
  "Philip Morris": 52,    // Marlboro, Fortune
  "JTI": 18,             // Winston, Mevius, Camel, Mighty
  "Local Brands": 25,     // Hope, More, Champion
  "Others": 5
};
```

## 2. Add Real-World Noise
```javascript
// Price variations by location
const priceMultipliers = {
  "NCR": 1.15,           // Higher prices in Metro Manila
  "BARMM": 0.85,         // Lower prices in conflict areas
  "CAR": 0.90,           // Mountain provinces
  "Tourist_Areas": 1.25   // Boracay, Palawan markup
};

// Stockout scenarios
const stockoutProbability = {
  "Premium_Brands": 0.05,  // 5% chance
  "Regular_Brands": 0.02,  // 2% chance
  "During_Typhoon": 0.25,  // 25% during disasters
  "Remote_Areas": 0.15     // 15% in far-flung areas
};
```

## 3. Behavioral Patterns
```javascript
// Sin tax announcement effects
const sinTaxPatterns = {
  "announcement_day": 3.5,    // 350% normal volume
  "week_before_implementation": 2.8,
  "day_of_implementation": 0.4,  // 40% drop
  "week_after": 0.7            // Gradual recovery
};

// Festival/Holiday spikes
const seasonalMultipliers = {
  "Christmas_Season": 1.4,
  "New_Year": 1.6,
  "Fiesta_Season": 1.3,
  "Holy_Week": 0.6,        // Lower during religious periods
  "Undas": 1.2             // All Saints Day
};
```

## 4. Competitive Dynamics
```javascript
// Competitor responses
const competitiveActions = {
  "Marlboro_Promo": {
    impact_on_jti: -0.15,  // 15% sales drop
    duration_days: 14
  },
  "Fortune_Price_Cut": {
    impact_on_winston: -0.20,
    customer_switching_rate: 0.08
  }
};
```

## 5. Data Quality Issues (Realistic)
```javascript
// Common data issues in Philippine retail
const dataQualityIssues = {
  "missing_sku": 0.03,        // 3% transactions
  "wrong_price_entry": 0.02,  // 2% human error
  "duplicate_entry": 0.01,    // 1% POS glitches
  "missing_timestamp": 0.005,  // 0.5% system errors
  "corrupted_barcode": 0.02   // 2% scanner issues
};
```

## 6. Regulatory Impacts
```javascript
// Philippine tobacco regulations
const regulatoryEffects = {
  "graphic_warnings_update": -0.05,  // 5% drop
  "sin_tax_increase_10%": -0.12,     // 12% volume drop
  "smoking_ban_expansion": -0.08,    // 8% impact
  "plain_packaging_rumor": -0.03     // 3% uncertainty effect
};
```

## 7. Channel-Specific Behaviors
```javascript
// Sari-sari store patterns
const sariSariPatterns = {
  "credit_purchases": 0.35,      // 35% on credit (listahan)
  "single_stick_sales": 0.65,    // 65% sell per stick
  "morning_rush": 2.5,           // 6-8 AM multiplier
  "payday_spike": 3.2,           // 15th/30th of month
  "brownout_impact": -0.40       // 40% drop during outages
};
```

## 8. Geographic Realities
```javascript
// Location-based factors
const geoFactors = {
  "typhoon_belt_regions": {
    seasonal_disruption: 0.25,   // Q3-Q4 impact
    logistics_delay_days: 3-7
  },
  "conflict_areas": {
    distribution_gaps: 0.30,     // 30% fewer deliveries
    price_premium: 1.35          // 35% markup
  },
  "island_provinces": {
    shipping_delays: 2-5,        // Days
    stockout_frequency: 1.8      // vs mainland
  }
};
```

## Implementation Suggestions

1. **Add Randomness**
   ```javascript
   // Don't make every pattern perfect
   const addNoise = (value, variance = 0.1) => {
     return value * (1 + (Math.random() - 0.5) * variance);
   };
   ```

2. **Temporal Anomalies**
   - Random POS system downtime (no data for 2-3 hours)
   - End-of-month bulk purchases
   - Weekend vs weekday patterns

3. **Customer Segments**
   - Price-sensitive switchers (Fortune ↔ Winston)
   - Brand loyalists (always Marlboro)
   - Opportunists (whatever's on promo)

4. **Supply Chain Realities**
   - Typhoon disruptions
   - Port congestion delays
   - Regional allocation biases

This would create a dataset that better reflects the messy reality of Philippine retail tobacco market.