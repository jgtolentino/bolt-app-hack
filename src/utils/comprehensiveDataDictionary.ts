// Comprehensive Data Dictionary for Philippine Retail Analytics
// Focus: FMCG and Tobacco Categories with Transcription Data

export interface ComprehensiveTransaction {
  // Transaction Identifiers
  transaction_id: string;
  timestamp: Date;
  
  // Store Information
  store_id: string;
  store_name: string;
  store_type: 'sari-sari' | 'convenience' | 'mini-mart' | 'wholesale';
  barangay: string;
  city_municipality: string;
  province: string;
  region: string;
  latitude: number;
  longitude: number;
  economic_class: 'A' | 'B' | 'C' | 'D' | 'E';
  
  // Transaction Metrics
  transaction_value: number;
  discount_amount: number;
  final_amount: number;
  payment_method: 'cash' | 'gcash' | 'maya' | 'credit' | 'utang';
  duration_seconds: number;
  units_total: number;
  
  // Transaction Items (array)
  items: TransactionItem[];
  
  // Customer Profile
  customer_profile: CustomerProfile;
  
  // Audio/Video Signals
  audio_signals: AudioSignals;
  video_signals: VideoSignals;
  
  // Transcription Data
  transcription: TranscriptionData;
  
  // Campaign & Marketing
  campaign_data: CampaignData;
  
  // Environmental Context
  context: EnvironmentalContext;
}

export interface TransactionItem {
  // Product Identification
  sku_id: string;
  barcode: string;
  product_name: string;
  brand: string;
  manufacturer: string;
  
  // FMCG Categories
  category: 'beverages' | 'snacks' | 'personal_care' | 'household' | 'tobacco' | 'confectionery' | 'dairy' | 'canned_goods' | 'condiments' | 'instant_noodles';
  subcategory: string;
  
  // Transaction Details
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_applied: number;
  
  // Substitution Tracking
  was_substituted: boolean;
  original_request?: string;
  substituted_from?: string;
  substitution_reason?: 'out_of_stock' | 'price' | 'recommendation' | 'preference';
  
  // Product Attributes
  is_promo: boolean;
  is_bundle: boolean;
  bundle_items?: string[];
  expiry_date?: Date;
  
  // Client Tracking
  is_tbwa_client: boolean;
  client_name?: string;
}

export interface CustomerProfile {
  customer_id?: string;
  gender: 'male' | 'female' | 'unknown';
  age_bracket: '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+' | 'unknown';
  customer_type: 'regular' | 'new' | 'occasional' | 'tourist';
  loyalty_status: 'member' | 'non-member';
  inferred_from: 'video' | 'audio' | 'transaction_pattern' | 'direct_input';
  
  // Behavioral Attributes
  price_sensitivity: 'high' | 'medium' | 'low';
  brand_loyalty: 'high' | 'medium' | 'low';
  purchase_frequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
}

export interface AudioSignals {
  // Request Analysis
  request_type: 'branded' | 'unbranded' | 'generic' | 'specific';
  language: 'tagalog' | 'english' | 'bisaya' | 'mixed' | 'other';
  dialect?: string;
  
  // Store Interaction
  storeowner_influence: 'high' | 'medium' | 'low' | 'none';
  recommendation_given: boolean;
  recommendation_type?: 'upsell' | 'cross-sell' | 'substitute' | 'new_product';
  suggestion_accepted: boolean;
  
  // Conversation Metrics
  interaction_duration: number;
  number_of_exchanges: number;
  customer_satisfaction: 'positive' | 'neutral' | 'negative';
  
  // Keywords & Phrases
  product_mentions: string[];
  brand_mentions: string[];
  price_mentions: boolean;
  promo_inquiry: boolean;
  indirect_cues: string[];
}

export interface VideoSignals {
  // Object Detection
  objects_detected: string[];
  people_count: number;
  
  // Product Visibility
  products_visible: string[];
  shelf_visibility: 'full' | 'partial' | 'empty';
  promo_materials_visible: string[];
  
  // Customer Behavior
  browsing_duration: number;
  products_touched: number;
  decision_time: number;
  
  // Store Conditions
  lighting_quality: 'good' | 'moderate' | 'poor';
  store_organization: 'organized' | 'moderate' | 'cluttered';
}

export interface TranscriptionData {
  // Raw Transcription
  full_transcript: string;
  
  // Structured Dialogue
  exchanges: DialogueExchange[];
  
  // Transcription Metadata
  transcription_confidence: number;
  background_noise_level: 'low' | 'medium' | 'high';
  audio_quality: 'clear' | 'moderate' | 'poor';
  
  // Key Phrases Extracted
  key_phrases: string[];
  sentiment_score: number; // -1 to 1
  
  // Intent Classification
  primary_intent: 'purchase' | 'inquiry' | 'complaint' | 'browsing' | 'return';
  secondary_intents: string[];
}

export interface DialogueExchange {
  speaker: 'customer' | 'storeowner' | 'other';
  text: string;
  timestamp_offset: number; // seconds from transaction start
  language: string;
  
  // Linguistic Analysis
  contains_brand_mention: boolean;
  contains_price_mention: boolean;
  contains_promo_mention: boolean;
  
  // Intent
  exchange_type: 'greeting' | 'inquiry' | 'response' | 'recommendation' | 'negotiation' | 'closing';
}

export interface CampaignData {
  // Campaign Identification
  campaign_id?: string;
  campaign_name?: string;
  campaign_type?: 'above_the_line' | 'below_the_line' | 'through_the_line' | 'experiential' | 'digital';
  
  // Campaign Metrics
  campaign_active: boolean;
  touchpoint_type?: 'poster' | 'standee' | 'shelf_talker' | 'audio_announcement' | 'promo_pack';
  engagement_score: number; // 0-100
  
  // Attribution
  influenced_by_campaign: boolean;
  campaign_mention_count: number;
  
  // A/B Testing
  variant_exposed?: string;
  control_group: boolean;
}

export interface EnvironmentalContext {
  // Temporal
  day_of_week: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  hour_of_day: number; // 0-23
  is_holiday: boolean;
  holiday_name?: string;
  is_payday: boolean;
  
  // Weather
  weather: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
  temperature: number; // Celsius
  humidity: number; // Percentage
  
  // Store Context
  store_traffic: 'low' | 'medium' | 'high';
  queue_length: number;
  
  // Economic Context
  inflation_rate?: number;
  fuel_price_index?: number;
  
  // Local Events
  local_event?: string;
  event_type?: 'fiesta' | 'sports' | 'political' | 'religious' | 'school';
}

// FMCG Category Definitions
export const FMCG_SUBCATEGORIES = {
  beverages: [
    'carbonated_soft_drinks',
    'juice',
    'water',
    'energy_drinks',
    'coffee',
    'tea',
    'milk_drinks',
    'alcoholic_beer',
    'alcoholic_spirits'
  ],
  snacks: [
    'chips',
    'crackers',
    'nuts',
    'dried_fruits',
    'popcorn',
    'pretzels'
  ],
  personal_care: [
    'shampoo',
    'soap',
    'toothpaste',
    'deodorant',
    'lotion',
    'face_wash',
    'hair_gel'
  ],
  household: [
    'detergent',
    'fabric_softener',
    'dishwashing',
    'floor_cleaner',
    'toilet_cleaner',
    'air_freshener'
  ],
  tobacco: [
    'cigarettes_premium',
    'cigarettes_value',
    'cigarettes_menthol',
    'e_cigarettes',
    'vape_products'
  ],
  confectionery: [
    'chocolate',
    'candy',
    'gum',
    'mints'
  ],
  dairy: [
    'fresh_milk',
    'powdered_milk',
    'yogurt',
    'cheese',
    'butter'
  ],
  canned_goods: [
    'meat',
    'fish',
    'vegetables',
    'fruits',
    'soup'
  ],
  condiments: [
    'soy_sauce',
    'vinegar',
    'ketchup',
    'hot_sauce',
    'mayonnaise',
    'fish_sauce'
  ],
  instant_noodles: [
    'cup_noodles',
    'pack_noodles',
    'premium_noodles',
    'local_noodles'
  ]
};

// Sample Transcription Templates based on real data
export const TRANSCRIPTION_TEMPLATES = [
  {
    scenario: 'brand_specific_request',
    exchanges: [
      { speaker: 'customer', text: 'Ate, may Marlboro Lights?', language: 'mixed' },
      { speaker: 'storeowner', text: 'Meron po, ilang pack?', language: 'tagalog' },
      { speaker: 'customer', text: 'Isa lang. Magkano?', language: 'tagalog' },
      { speaker: 'storeowner', text: '180 pesos po', language: 'mixed' }
    ]
  },
  {
    scenario: 'substitution_dialogue',
    exchanges: [
      { speaker: 'customer', text: 'May Coke Zero ba kayo?', language: 'mixed' },
      { speaker: 'storeowner', text: 'Wala na po, pero may Pepsi Max, same lang zero sugar', language: 'mixed' },
      { speaker: 'customer', text: 'Sige, yun na lang', language: 'tagalog' }
    ]
  },
  {
    scenario: 'promo_inquiry',
    exchanges: [
      { speaker: 'customer', text: 'May promo ba ang Tide?', language: 'mixed' },
      { speaker: 'storeowner', text: 'Oo, buy 2 take 1 po ngayong week', language: 'mixed' },
      { speaker: 'customer', text: 'Ay sige, kunin ko na tatlo', language: 'tagalog' }
    ]
  },
  {
    scenario: 'generic_request',
    exchanges: [
      { speaker: 'customer', text: 'Miss, pahingi ng shampoo', language: 'tagalog' },
      { speaker: 'storeowner', text: 'Anong brand po gusto niyo? May Head & Shoulders, Palmolive, Sunsilk', language: 'mixed' },
      { speaker: 'customer', text: 'Yung Sunsilk na pink', language: 'mixed' }
    ]
  },
  {
    scenario: 'price_negotiation',
    exchanges: [
      { speaker: 'customer', text: 'Magkano yung Lucky Strike?', language: 'mixed' },
      { speaker: 'storeowner', text: '170 po per pack', language: 'mixed' },
      { speaker: 'customer', text: 'Pwede 160?', language: 'tagalog' },
      { speaker: 'storeowner', text: 'Sige po, suki naman kayo', language: 'tagalog' }
    ]
  }
];

// Brand lists for FMCG and Tobacco
export const FMCG_BRANDS = {
  beverages: ['Coca-Cola', 'Pepsi', 'Sprite', '7UP', 'Mountain Dew', 'Royal', 'Sarsi', 'C2', 'Gatorade', 'Red Bull', 'Cobra', 'Sting', 'San Miguel', 'Red Horse'],
  snacks: ['Jack n Jill', 'Oishi', 'Leslie', 'Piattos', 'Nova', 'Chippy', 'Clover', 'Tomi', 'Boy Bawang'],
  personal_care: ['Unilever', 'P&G', 'Palmolive', 'Colgate', 'Close Up', 'Rejoice', 'Head & Shoulders', 'Sunsilk', 'Dove', 'Safeguard', 'Bioderm'],
  household: ['Tide', 'Ariel', 'Breeze', 'Surf', 'Downy', 'Joy', 'Smart', 'Ajax', 'Zonrox', 'Lysol'],
  tobacco: ['Marlboro', 'Philip Morris', 'Fortune', 'Hope', 'More', 'Mighty', 'Winston', 'Lucky Strike', 'Camel', 'Two Moon'],
  confectionery: ['Ricoa', 'Goya', 'Cloud 9', 'Choc Nut', 'Flat Tops', 'Curly Tops', 'Hany', 'Maxx', 'Mentos', 'Kopiko'],
  dairy: ['Alaska', 'Bear Brand', 'Birch Tree', 'Anchor', 'Nestle', 'Magnolia', 'Selecta'],
  canned_goods: ['Century Tuna', 'San Marino', '555', 'Ligo', 'Argentina', 'Purefoods', 'CDO', 'Libby\'s'],
  condiments: ['Datu Puti', 'Silver Swan', 'UFC', 'Papa', 'Mang Tomas', 'Del Monte', 'Heinz', 'Lady\'s Choice'],
  instant_noodles: ['Lucky Me', 'Payless', 'Pancit Canton', 'Mi Goreng', 'Nissin', 'QuickChow']
};