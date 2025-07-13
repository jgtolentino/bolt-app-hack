// Comprehensive Synthetic Data Generator for Philippine Retail
// Focus: FMCG and Tobacco with realistic transcriptions

import { 
  ComprehensiveTransaction, 
  TransactionItem, 
  CustomerProfile,
  AudioSignals,
  VideoSignals,
  TranscriptionData,
  DialogueExchange,
  CampaignData,
  EnvironmentalContext as _EnvironmentalContext,
  FMCG_SUBCATEGORIES,
  TRANSCRIPTION_TEMPLATES,
  FMCG_BRANDS
} from './comprehensiveDataDictionary';
import { subDays, addHours as _addHours, startOfDay as _startOfDay } from 'date-fns';

// Philippine store locations with coordinates
const STORE_LOCATIONS = [
  { region: 'NCR', city: 'Manila', barangays: ['Ermita', 'Malate', 'Quiapo', 'Sampaloc', 'Tondo'], lat: 14.5995, lng: 120.9842 },
  { region: 'NCR', city: 'Quezon City', barangays: ['Diliman', 'Cubao', 'Novaliches', 'Commonwealth'], lat: 14.6760, lng: 121.0437 },
  { region: 'NCR', city: 'Makati', barangays: ['Poblacion', 'Bel-Air', 'San Lorenzo', 'Legaspi'], lat: 14.5547, lng: 121.0244 },
  { region: 'Region III', city: 'Angeles', barangays: ['Balibago', 'Anunas', 'Cutcut', 'Pampang'], lat: 15.1450, lng: 120.5887 },
  { region: 'Region IV-A', city: 'Batangas City', barangays: ['Poblacion', 'Alangilan', 'Balagtas'], lat: 13.7565, lng: 121.0583 },
  { region: 'Region VII', city: 'Cebu City', barangays: ['Lahug', 'Banilad', 'IT Park', 'Fuente'], lat: 10.3157, lng: 123.8854 },
  { region: 'Region XI', city: 'Davao City', barangays: ['Poblacion', 'Buhangin', 'Matina', 'Toril'], lat: 7.1907, lng: 125.4553 }
];

// Common Filipino names for stores
const STORE_NAMES = [
  'Aling Nena Store', 'Mang Juan Sari-Sari', 'Ate Maria Store', 'Kuya Boy Store',
  'Tindahan ni Aling Rosa', 'JM Mart', 'RJ Store', 'Triple M', 'ABC Store',
  'Neighborhood Mart', 'Corner Store', 'Barangay Store', '24/7 Mart'
];

// Realistic campaign names
const CAMPAIGNS = [
  { id: 'CAMP001', name: 'Summer Refresh 2024', type: 'experiential' },
  { id: 'CAMP002', name: 'Payday Promo', type: 'below_the_line' },
  { id: 'CAMP003', name: 'New Flavor Launch', type: 'through_the_line' },
  { id: 'CAMP004', name: 'Holiday Bundle Deal', type: 'above_the_line' }
];

export function generateComprehensiveTransaction(
  index: number, 
  daysBack: number = 30
): ComprehensiveTransaction {
  
  // Random store selection
  const location = STORE_LOCATIONS[Math.floor(Math.random() * STORE_LOCATIONS.length)];
  const barangay = location.barangays[Math.floor(Math.random() * location.barangays.length)];
  const storeName = STORE_NAMES[Math.floor(Math.random() * STORE_NAMES.length)];
  
  // Temporal data
  const timestamp = subDays(new Date(), Math.floor(Math.random() * daysBack));
  const hour = Math.floor(Math.random() * 14) + 7; // 7 AM to 9 PM
  timestamp.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
  
  const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][timestamp.getDay()];
  const isPayday = timestamp.getDate() === 15 || timestamp.getDate() === 30;
  
  // Customer profile
  const customerProfile = generateCustomerProfile();
  
  // Generate transaction items (1-5 items per transaction)
  const numItems = Math.floor(Math.random() * 4) + 1;
  const items = Array.from({ length: numItems }, () => generateTransactionItem());
  
  // Calculate totals
  const transactionValue = items.reduce((sum, item) => sum + item.total_price, 0);
  const discountAmount = items.reduce((sum, item) => sum + item.discount_applied, 0);
  const unitsTotal = items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Generate transcription based on items and scenario
  const transcriptionData = generateTranscription(items, customerProfile);
  
  // Generate audio/video signals based on transcription
  const audioSignals = generateAudioSignals(transcriptionData, items);
  const videoSignals = generateVideoSignals(items);
  
  // Campaign influence
  const campaignData = Math.random() > 0.7 ? generateCampaignData() : {
    campaign_active: false,
    engagement_score: 0,
    influenced_by_campaign: false,
    campaign_mention_count: 0,
    control_group: true
  };
  
  // Environmental context
  const weather = ['sunny', 'cloudy', 'rainy', 'stormy'][Math.floor(Math.random() * 4)] as any;
  const storeTraffic = hour >= 17 && hour <= 20 ? 'high' : 
                       hour >= 11 && hour <= 14 ? 'medium' : 'low';
  
  return {
    transaction_id: `TX${String(index).padStart(8, '0')}`,
    timestamp,
    
    // Store info
    store_id: `ST${String(Math.floor(Math.random() * 100)).padStart(6, '0')}`,
    store_name: storeName,
    store_type: Math.random() > 0.8 ? 'convenience' : 'sari-sari',
    barangay,
    city_municipality: location.city,
    province: location.city,
    region: location.region,
    latitude: location.lat + (Math.random() - 0.5) * 0.1,
    longitude: location.lng + (Math.random() - 0.5) * 0.1,
    economic_class: ['A', 'B', 'C', 'D', 'E'][Math.floor(Math.random() * 5)] as any,
    
    // Transaction metrics
    transaction_value: transactionValue,
    discount_amount: discountAmount,
    final_amount: transactionValue - discountAmount,
    payment_method: Math.random() > 0.8 ? 'gcash' : 'cash',
    duration_seconds: Math.floor(Math.random() * 300) + 60, // 1-6 minutes
    units_total: unitsTotal,
    
    // Arrays and objects
    items,
    customer_profile: customerProfile,
    audio_signals: audioSignals,
    video_signals: videoSignals,
    transcription: transcriptionData,
    campaign_data: campaignData,
    
    // Environmental context
    context: {
      day_of_week: dayOfWeek as any,
      hour_of_day: hour,
      is_holiday: false,
      is_payday: isPayday,
      weather: weather,
      temperature: weather === 'rainy' ? 26 : 32,
      humidity: weather === 'rainy' ? 85 : 70,
      store_traffic: storeTraffic as any,
      queue_length: storeTraffic === 'high' ? Math.floor(Math.random() * 5) + 2 : Math.floor(Math.random() * 2),
      inflation_rate: 6.2,
      fuel_price_index: 102.5
    }
  };
}

function generateCustomerProfile(): CustomerProfile {
  const gender = Math.random() > 0.5 ? 'male' : 'female';
  const age = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'][Math.floor(Math.random() * 6)] as any;
  const isRegular = Math.random() > 0.6;
  
  return {
    customer_id: isRegular ? `CUST${String(Math.floor(Math.random() * 1000)).padStart(6, '0')}` : undefined,
    gender,
    age_bracket: age,
    customer_type: isRegular ? 'regular' : Math.random() > 0.5 ? 'occasional' : 'new',
    loyalty_status: isRegular && Math.random() > 0.5 ? 'member' : 'non-member',
    inferred_from: 'video',
    price_sensitivity: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as any,
    brand_loyalty: isRegular ? 'high' : 'medium',
    purchase_frequency: isRegular ? 'weekly' : 'monthly'
  };
}

function generateTransactionItem(): TransactionItem {
  // Focus on FMCG and tobacco
  const categories = ['beverages', 'snacks', 'personal_care', 'household', 'tobacco', 'confectionery', 'instant_noodles'] as const;
  const category = categories[Math.floor(Math.random() * categories.length)];
  const subcategories = FMCG_SUBCATEGORIES[category];
  const subcategory = subcategories[Math.floor(Math.random() * subcategories.length)];
  
  const brands = FMCG_BRANDS[category];
  const brand = brands[Math.floor(Math.random() * brands.length)];
  
  // Price ranges by category
  const priceRanges: Record<typeof category, [number, number]> = {
    beverages: [15, 120],
    snacks: [10, 80],
    personal_care: [20, 250],
    household: [30, 300],
    tobacco: [150, 200],
    confectionery: [5, 50],
    instant_noodles: [10, 40]
  };
  
  const [minPrice, maxPrice] = priceRanges[category];
  const unitPrice = Math.random() * (maxPrice - minPrice) + minPrice;
  const quantity = category === 'tobacco' ? 1 : Math.floor(Math.random() * 3) + 1;
  const isPromo = Math.random() > 0.8;
  const discount = isPromo ? unitPrice * 0.1 * quantity : 0;
  
  // Substitution logic
  const wasSubstituted = Math.random() > 0.85;
  
  return {
    sku_id: `SKU${String(Math.floor(Math.random() * 1000)).padStart(6, '0')}`,
    barcode: String(Math.floor(Math.random() * 9999999999999)),
    product_name: `${brand} ${subcategory.replace(/_/g, ' ')}`,
    brand,
    manufacturer: brand,
    category,
    subcategory,
    quantity,
    unit_price: unitPrice,
    total_price: unitPrice * quantity,
    discount_applied: discount,
    was_substituted: wasSubstituted,
    original_request: wasSubstituted ? `${brands[Math.floor(Math.random() * brands.length)]} ${subcategory}` : undefined,
    substituted_from: wasSubstituted ? brands[Math.floor(Math.random() * brands.length)] : undefined,
    substitution_reason: wasSubstituted ? ['out_of_stock', 'price', 'recommendation'][Math.floor(Math.random() * 3)] as any : undefined,
    is_promo: isPromo,
    is_bundle: false,
    is_tbwa_client: ['Coca-Cola', 'Pepsi', 'Marlboro', 'Philip Morris', 'Unilever', 'P&G'].includes(brand)
  };
}

function generateTranscription(items: TransactionItem[], customer: CustomerProfile): TranscriptionData {
  // Select a scenario based on items
  const hasSubstitution = items.some(item => item.was_substituted);
  const hasPromo = items.some(item => item.is_promo);
  const hasTobacco = items.some(item => item.category === 'tobacco');
  
  let template;
  if (hasSubstitution) {
    template = TRANSCRIPTION_TEMPLATES.find(t => t.scenario === 'substitution_dialogue');
  } else if (hasPromo) {
    template = TRANSCRIPTION_TEMPLATES.find(t => t.scenario === 'promo_inquiry');
  } else if (hasTobacco) {
    template = TRANSCRIPTION_TEMPLATES.find(t => t.scenario === 'brand_specific_request');
  } else {
    template = TRANSCRIPTION_TEMPLATES[Math.floor(Math.random() * TRANSCRIPTION_TEMPLATES.length)];
  }
  
  // Customize template with actual product names
  const exchanges: DialogueExchange[] = template!.exchanges.map((exchange, index) => {
    let text = exchange.text;
    
    // Replace with actual brands from transaction
    if (items.length > 0) {
      text = text.replace(/Marlboro Lights|Coke Zero|Tide|Lucky Strike|shampoo/g, items[0].product_name);
    }
    
    return {
      speaker: exchange.speaker as 'customer' | 'storeowner' | 'other',
      text,
      timestamp_offset: index * 5,
      language: exchange.language,
      contains_brand_mention: text.includes(items[0]?.brand || ''),
      contains_price_mention: text.includes('Magkano') || text.includes('pesos'),
      contains_promo_mention: text.includes('promo'),
      exchange_type: (index === 0 ? 'inquiry' : 
                     index === template!.exchanges.length - 1 ? 'closing' : 'response') as 'greeting' | 'inquiry' | 'response' | 'recommendation' | 'negotiation' | 'closing'
    };
  });
  
  // Build full transcript
  const fullTranscript = exchanges.map(e => `${e.speaker}: ${e.text}`).join(' ');
  
  return {
    full_transcript: fullTranscript,
    exchanges,
    transcription_confidence: 0.85 + Math.random() * 0.15,
    background_noise_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
    audio_quality: Math.random() > 0.3 ? 'clear' : 'moderate',
    key_phrases: items.map(item => item.brand),
    sentiment_score: customer.customer_type === 'regular' ? 0.8 : 0.5,
    primary_intent: 'purchase',
    secondary_intents: hasPromo ? ['inquiry'] : []
  };
}

function generateAudioSignals(transcription: TranscriptionData, items: TransactionItem[]): AudioSignals {
  const hasBrandMention = transcription.exchanges.some(e => e.contains_brand_mention);
  const hasSubstitution = items.some(item => item.was_substituted);
  
  return {
    request_type: hasBrandMention ? 'branded' : 'generic',
    language: transcription.exchanges[0]?.language as any || 'tagalog',
    storeowner_influence: hasSubstitution ? 'high' : 'low',
    recommendation_given: hasSubstitution,
    recommendation_type: hasSubstitution ? 'substitute' : undefined,
    suggestion_accepted: hasSubstitution,
    interaction_duration: transcription.exchanges.length * 5,
    number_of_exchanges: transcription.exchanges.length,
    customer_satisfaction: transcription.sentiment_score > 0.5 ? 'positive' : 'neutral',
    product_mentions: items.map(item => item.product_name),
    brand_mentions: items.map(item => item.brand),
    price_mentions: transcription.exchanges.some(e => e.contains_price_mention),
    promo_inquiry: transcription.exchanges.some(e => e.contains_promo_mention),
    indirect_cues: []
  };
}

function generateVideoSignals(items: TransactionItem[]): VideoSignals {
  const objectsDetected = [
    'customer', 'store_owner', 'counter', 'shelf', 'refrigerator',
    ...items.map(item => item.brand.toLowerCase() + '_product')
  ];
  
  return {
    objects_detected: objectsDetected,
    people_count: Math.floor(Math.random() * 3) + 1,
    products_visible: items.map(item => item.product_name),
    shelf_visibility: 'full',
    promo_materials_visible: items.filter(item => item.is_promo).map(item => `${item.brand} poster`),
    browsing_duration: Math.floor(Math.random() * 60) + 10,
    products_touched: items.length,
    decision_time: Math.floor(Math.random() * 30) + 5,
    lighting_quality: 'good',
    store_organization: 'organized'
  };
}

function generateCampaignData(): CampaignData {
  const campaign = CAMPAIGNS[Math.floor(Math.random() * CAMPAIGNS.length)];
  
  return {
    campaign_id: campaign.id,
    campaign_name: campaign.name,
    campaign_type: campaign.type as any,
    campaign_active: true,
    touchpoint_type: ['poster', 'standee', 'shelf_talker'][Math.floor(Math.random() * 3)] as any,
    engagement_score: Math.floor(Math.random() * 40) + 60,
    influenced_by_campaign: Math.random() > 0.4,
    campaign_mention_count: Math.floor(Math.random() * 3),
    variant_exposed: 'A',
    control_group: false
  };
}

// Generate full dataset
export function generateFullDataset(numTransactions: number = 10000): ComprehensiveTransaction[] {
  console.log(`🏪 Generating ${numTransactions} comprehensive transactions...`);
  
  const transactions: ComprehensiveTransaction[] = [];
  
  for (let i = 0; i < numTransactions; i++) {
    transactions.push(generateComprehensiveTransaction(i));
    
    if ((i + 1) % 1000 === 0) {
      console.log(`   Generated ${i + 1} transactions...`);
    }
  }
  
  console.log(`✅ Generated ${numTransactions} transactions successfully!`);
  return transactions;
}

// Export to CSV format
export function exportToCSV(transactions: ComprehensiveTransaction[]): string {
  // Flatten the complex structure for CSV
  const headers = [
    'transaction_id', 'timestamp', 'store_id', 'store_name', 'store_type',
    'barangay', 'city_municipality', 'province', 'region', 'latitude', 'longitude',
    'economic_class', 'transaction_value', 'discount_amount', 'final_amount',
    'payment_method', 'duration_seconds', 'units_total',
    // Flattened customer profile
    'customer_gender', 'customer_age', 'customer_type', 'loyalty_status',
    // Flattened audio signals
    'request_type', 'language', 'storeowner_influence', 'suggestion_accepted',
    // Transcription summary
    'full_transcript', 'sentiment_score',
    // Environmental
    'day_of_week', 'hour_of_day', 'weather', 'is_payday',
    // Items summary (first item details for simplicity)
    'first_item_sku', 'first_item_brand', 'first_item_product', 'first_item_category',
    'first_item_quantity', 'first_item_price', 'was_substituted',
    // Campaign
    'campaign_id', 'campaign_name', 'influenced_by_campaign'
  ];
  
  const rows = transactions.map(t => {
    const firstItem = t.items[0];
    return [
      t.transaction_id,
      t.timestamp.toISOString(),
      t.store_id,
      t.store_name,
      t.store_type,
      t.barangay,
      t.city_municipality,
      t.province,
      t.region,
      t.latitude,
      t.longitude,
      t.economic_class,
      t.transaction_value.toFixed(2),
      t.discount_amount.toFixed(2),
      t.final_amount.toFixed(2),
      t.payment_method,
      t.duration_seconds,
      t.units_total,
      t.customer_profile.gender,
      t.customer_profile.age_bracket,
      t.customer_profile.customer_type,
      t.customer_profile.loyalty_status,
      t.audio_signals.request_type,
      t.audio_signals.language,
      t.audio_signals.storeowner_influence,
      t.audio_signals.suggestion_accepted,
      `"${t.transcription.full_transcript.replace(/"/g, '""')}"`,
      t.transcription.sentiment_score.toFixed(2),
      t.context.day_of_week,
      t.context.hour_of_day,
      t.context.weather,
      t.context.is_payday,
      firstItem?.sku_id || '',
      firstItem?.brand || '',
      firstItem?.product_name || '',
      firstItem?.category || '',
      firstItem?.quantity || 0,
      firstItem?.total_price.toFixed(2) || '0',
      firstItem?.was_substituted || false,
      t.campaign_data.campaign_id || '',
      t.campaign_data.campaign_name || '',
      t.campaign_data.influenced_by_campaign
    ].join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
}