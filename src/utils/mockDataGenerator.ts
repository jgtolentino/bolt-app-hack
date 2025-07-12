// Mock data generator for Scout Dashboard v4.0
import { format, subDays, addHours, startOfDay } from 'date-fns';

export interface Transaction {
  id: string;
  timestamp: Date;
  store_id: string;
  store_name: string;
  barangay: string;
  region: string;
  transaction_value: number;
  duration_seconds: number;
  units: number;
  items: TransactionItem[];
  customer_profile: CustomerProfile;
  audio_signals: AudioSignals;
}

export interface TransactionItem {
  sku_id: string;
  product_name: string;
  brand: string;
  category: string;
  quantity: number;
  price: number;
  was_substituted: boolean;
  original_request?: string;
}

export interface CustomerProfile {
  gender: 'male' | 'female' | 'unknown';
  age_bracket: '18-24' | '25-34' | '35-44' | '45-54' | '55+' | 'unknown';
  inferred_from: 'video' | 'audio' | 'pattern';
}

export interface AudioSignals {
  request_type: 'branded' | 'unbranded' | 'generic';
  storeowner_influence: 'high' | 'medium' | 'low' | 'none';
  suggestion_accepted: boolean;
  indirect_cues: string[];
}

// Philippine regions and barangays
const REGIONS = [
  'NCR', 'Region I', 'Region II', 'Region III', 'Region IV-A', 
  'Region IV-B', 'Region V', 'Region VI', 'Region VII', 'Region VIII',
  'Region IX', 'Region X', 'Region XI', 'Region XII', 'Region XIII'
];

const BARANGAYS = [
  'Poblacion', 'San Juan', 'San Pedro', 'Sta. Cruz', 'Bagong Bayan',
  'Maligaya', 'Pag-asa', 'Bagong Silang', 'San Isidro', 'Mabini'
];

const STORES = [
  'Tindahan ni Aling Nena', 'Sari-Sari ni Mang Juan', 'Quick Mart',
  'Corner Store', 'Mini Stop Suqi', '24/7 Convenience', 'Neighborhood Store',
  'Community Mart', 'Barangay Store', 'Local Supplies'
];

// Product catalog
const PRODUCTS = {
  'shampoo': [
    { name: 'Rejoice', sku: 'RJC-001', price: 7.50 },
    { name: 'Head & Shoulders', sku: 'HNS-001', price: 8.00 },
    { name: 'Palmolive', sku: 'PLM-001', price: 6.50 },
    { name: 'Sunsilk', sku: 'SNS-001', price: 7.00 },
    { name: 'Clear', sku: 'CLR-001', price: 8.50 }
  ],
  'cigarettes': [
    { name: 'Marlboro Red', sku: 'MLB-R01', price: 7.00 },
    { name: 'Marlboro Lights', sku: 'MLB-L01', price: 7.00 },
    { name: 'Philip Morris', sku: 'PM-001', price: 6.50 },
    { name: 'Fortune', sku: 'FRT-001', price: 5.50 },
    { name: 'Hope', sku: 'HOP-001', price: 5.00 }
  ],
  'snacks': [
    { name: 'Piattos', sku: 'PTS-001', price: 15.00 },
    { name: 'Nova', sku: 'NVA-001', price: 13.00 },
    { name: 'Boy Bawang', sku: 'BBW-001', price: 8.00 },
    { name: 'Chippy', sku: 'CHP-001', price: 10.00 },
    { name: 'Clover', sku: 'CLV-001', price: 8.00 }
  ],
  'beverages': [
    { name: 'Coke Sakto', sku: 'CKS-001', price: 15.00 },
    { name: 'Sprite', sku: 'SPR-001', price: 15.00 },
    { name: 'RC Cola', sku: 'RC-001', price: 12.00 },
    { name: 'C2', sku: 'C2-001', price: 20.00 },
    { name: 'Kopiko 78', sku: 'KPK-001', price: 10.00 }
  ],
  'essentials': [
    { name: 'Tide (sachet)', sku: 'TID-001', price: 5.50 },
    { name: 'Safeguard', sku: 'SFG-001', price: 25.00 },
    { name: 'Colgate', sku: 'CLG-001', price: 8.00 },
    { name: 'Maggi Savor', sku: 'MGI-001', price: 5.00 },
    { name: 'Silver Swan Soy Sauce', sku: 'SSW-001', price: 10.00 }
  ]
};

// Helper functions
function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// Generate customer profile based on time and patterns
function generateCustomerProfile(): CustomerProfile {
  const profiles: CustomerProfile[] = [
    { gender: 'male', age_bracket: '18-24', inferred_from: 'audio' },
    { gender: 'female', age_bracket: '25-34', inferred_from: 'video' },
    { gender: 'male', age_bracket: '35-44', inferred_from: 'pattern' },
    { gender: 'female', age_bracket: '45-54', inferred_from: 'audio' },
    { gender: 'male', age_bracket: '55+', inferred_from: 'video' },
    { gender: 'female', age_bracket: '18-24', inferred_from: 'pattern' }
  ];
  
  return randomElement(profiles);
}

// Generate audio signals for transaction
function generateAudioSignals(): AudioSignals {
  const requestTypes: AudioSignals['request_type'][] = ['branded', 'unbranded', 'generic'];
  const influences: AudioSignals['storeowner_influence'][] = ['high', 'medium', 'low', 'none'];
  
  const requestType = randomElement(requestTypes);
  const influence = requestType === 'unbranded' ? 
    randomElement(['high', 'medium']) : 
    randomElement(influences);
  
  return {
    request_type: requestType,
    storeowner_influence: influence,
    suggestion_accepted: influence === 'high' ? Math.random() > 0.3 : Math.random() > 0.7,
    indirect_cues: Math.random() > 0.5 ? 
      randomElement([['pointing', 'gesture'], ['color mention', 'size'], ['price inquiry']]) : 
      []
  };
}

// Generate transaction items with substitution patterns
function generateTransactionItems(): TransactionItem[] {
  const numItems = randomInt(1, 5);
  const items: TransactionItem[] = [];
  const categories = Object.keys(PRODUCTS);
  
  for (let i = 0; i < numItems; i++) {
    const category = randomElement(categories);
    const productList = PRODUCTS[category as keyof typeof PRODUCTS];
    const product = randomElement(productList);
    
    const wasSubstituted = Math.random() > 0.85;
    let originalRequest = undefined;
    
    if (wasSubstituted) {
      const otherProducts = productList.filter(p => p.sku !== product.sku);
      originalRequest = randomElement(otherProducts).name;
    }
    
    items.push({
      sku_id: product.sku,
      product_name: product.name,
      brand: product.name.split(' ')[0],
      category,
      quantity: randomInt(1, 3),
      price: product.price,
      was_substituted: wasSubstituted,
      original_request
    });
  }
  
  return items;
}

// Generate a single transaction
export function generateTransaction(date: Date): Transaction {
  const items = generateTransactionItems();
  const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
  
  return {
    id: `TRX-${date.getTime()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: date,
    store_id: `STR-${randomInt(1, 100).toString().padStart(3, '0')}`,
    store_name: randomElement(STORES),
    barangay: randomElement(BARANGAYS),
    region: randomElement(REGIONS),
    transaction_value: totalValue,
    duration_seconds: randomInt(30, 300),
    units: totalUnits,
    items,
    customer_profile: generateCustomerProfile(),
    audio_signals: generateAudioSignals()
  };
}

// Generate transactions for a date range
export function generateTransactionsForDateRange(startDate: Date, endDate: Date): Transaction[] {
  const transactions: Transaction[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    // Generate transactions throughout the day with realistic patterns
    const dayStart = startOfDay(currentDate);
    
    // Morning rush (6am-9am): 15-25 transactions
    for (let h = 6; h < 9; h++) {
      const numTransactions = randomInt(5, 9);
      for (let t = 0; t < numTransactions; t++) {
        const transactionTime = addHours(dayStart, h + randomFloat(0, 1));
        transactions.push(generateTransaction(transactionTime));
      }
    }
    
    // Midday (9am-3pm): 8-15 transactions
    for (let h = 9; h < 15; h++) {
      const numTransactions = randomInt(1, 3);
      for (let t = 0; t < numTransactions; t++) {
        const transactionTime = addHours(dayStart, h + randomFloat(0, 1));
        transactions.push(generateTransaction(transactionTime));
      }
    }
    
    // Afternoon/Evening rush (3pm-8pm): 20-35 transactions
    for (let h = 15; h < 20; h++) {
      const numTransactions = randomInt(4, 7);
      for (let t = 0; t < numTransactions; t++) {
        const transactionTime = addHours(dayStart, h + randomFloat(0, 1));
        transactions.push(generateTransaction(transactionTime));
      }
    }
    
    // Late night (8pm-11pm): 5-10 transactions
    for (let h = 20; h < 23; h++) {
      const numTransactions = randomInt(1, 4);
      for (let t = 0; t < numTransactions; t++) {
        const transactionTime = addHours(dayStart, h + randomFloat(0, 1));
        transactions.push(generateTransaction(transactionTime));
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return transactions;
}

// Generate mock data for the last N days
export function generateMockData(days: number = 30): Transaction[] {
  const endDate = new Date();
  const startDate = subDays(endDate, days);
  
  return generateTransactionsForDateRange(startDate, endDate);
}