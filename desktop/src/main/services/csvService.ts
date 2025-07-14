/**
 * CSV Import/Export Service
 * Handles CSV template generation and data import/export
 */

import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Complete column list from Scout data dictionary
export const CSV_COLUMNS = [
  'id',
  'store_id',
  'timestamp',
  'time_of_day',
  'barangay',
  'city',
  'province',
  'region',
  'product_category',
  'brand_name',
  'sku',
  'units_per_transaction',
  'peso_value',
  'basket_size',
  'combo_basket',
  'request_mode',
  'request_type',
  'suggestion_accepted',
  'gender',
  'age_bracket',
  'substitution_occurred',
  'substitution_from',
  'substitution_to',
  'substitution_reason',
  'duration_seconds',
  'campaign_influenced',
  'handshake_score',
  'is_tbwa_client',
  'payment_method',
  'customer_type',
  'store_type',
  'economic_class'
];

// Validation rules for each column
export const COLUMN_VALIDATORS = {
  time_of_day: ['morning', 'afternoon', 'evening', 'night'],
  request_mode: ['verbal', 'pointing', 'indirect'],
  request_type: ['branded', 'unbranded', 'point', 'indirect'],
  gender: ['male', 'female', 'unknown'],
  age_bracket: ['18-24', '25-34', '35-44', '45-54', '55+', 'unknown'],
  payment_method: ['cash', 'gcash', 'maya', 'credit', 'other'],
  customer_type: ['regular', 'occasional', 'new', 'unknown'],
  store_type: ['urban_high', 'urban_medium', 'residential', 'rural', 'transport', 'other'],
  economic_class: ['A', 'B', 'C', 'D', 'E', 'unknown']
};

export class CSVService {
  /**
   * Generate empty CSV template with headers
   */
  static async generateTemplate(): Promise<string> {
    return CSV_COLUMNS.join(',') + '\n';
  }

  /**
   * Generate CSV with sample data
   */
  static async generateSampleData(rowCount: number = 10): Promise<string> {
    const rows: any[] = [];
    
    // Common sample data
    const stores = ['store_001', 'store_002', 'store_003', 'store_004', 'store_005'];
    const barangays = ['Poblacion', 'San Jose', 'San Miguel', 'Bagong Silang', 'Malaya'];
    const cities = ['Quezon City', 'Makati', 'Taguig', 'Pasig', 'Marikina'];
    const products = [
      { category: 'beverages', brand: 'Coca-Cola', sku: 'COKE_1L', price: 65 },
      { category: 'beverages', brand: 'Pepsi', sku: 'PEPSI_1L', price: 60 },
      { category: 'snacks', brand: 'Jack n Jill', sku: 'NOVA_40G', price: 25 },
      { category: 'personal_care', brand: 'Safeguard', sku: 'SAFEGUARD_135G', price: 45 },
      { category: 'household', brand: 'Surf', sku: 'SURF_1KG', price: 120 }
    ];

    for (let i = 0; i < rowCount; i++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const units = Math.floor(Math.random() * 3) + 1;
      const basketSize = Math.floor(Math.random() * 5) + 1;
      const hasSubstitution = Math.random() < 0.2; // 20% substitution rate
      
      const row = {
        id: `txn_${Date.now()}_${i}`,
        store_id: stores[Math.floor(Math.random() * stores.length)],
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        time_of_day: ['morning', 'afternoon', 'evening', 'night'][Math.floor(Math.random() * 4)],
        barangay: barangays[Math.floor(Math.random() * barangays.length)],
        city: cities[Math.floor(Math.random() * cities.length)],
        province: 'Metro Manila',
        region: 'NCR',
        product_category: product.category,
        brand_name: product.brand,
        sku: product.sku,
        units_per_transaction: units,
        peso_value: product.price * units,
        basket_size: basketSize,
        combo_basket: JSON.stringify(this.generateComboBasket(product.sku, basketSize)),
        request_mode: ['verbal', 'pointing', 'indirect'][Math.floor(Math.random() * 3)],
        request_type: ['branded', 'unbranded', 'point', 'indirect'][Math.floor(Math.random() * 4)],
        suggestion_accepted: Math.random() < 0.7 ? 1 : 0, // 70% acceptance rate
        gender: ['male', 'female'][Math.floor(Math.random() * 2)],
        age_bracket: ['18-24', '25-34', '35-44', '45-54', '55+'][Math.floor(Math.random() * 5)],
        substitution_occurred: hasSubstitution ? 1 : 0,
        substitution_from: hasSubstitution ? product.sku : '',
        substitution_to: hasSubstitution ? this.getSubstitute(product) : '',
        substitution_reason: hasSubstitution ? ['out_of_stock', 'price', 'preference'][Math.floor(Math.random() * 3)] : '',
        duration_seconds: Math.floor(Math.random() * 300) + 60, // 1-6 minutes
        campaign_influenced: Math.random() < 0.3 ? 1 : 0, // 30% campaign influence
        handshake_score: (Math.random() * 0.5 + 0.5).toFixed(2), // 0.5-1.0
        is_tbwa_client: Math.random() < 0.6 ? 1 : 0, // 60% TBWA clients
        payment_method: ['cash', 'gcash', 'maya', 'credit'][Math.floor(Math.random() * 4)],
        customer_type: ['regular', 'occasional', 'new'][Math.floor(Math.random() * 3)],
        store_type: ['urban_high', 'urban_medium', 'residential', 'rural'][Math.floor(Math.random() * 4)],
        economic_class: ['A', 'B', 'C', 'D', 'E'][Math.floor(Math.random() * 5)]
      };
      
      rows.push(row);
    }

    // Convert to CSV
    return new Promise((resolve, reject) => {
      stringify(rows, { header: true, columns: CSV_COLUMNS }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });
  }

  /**
   * Parse CSV file and validate data
   */
  static async parseCSV(filePath: string): Promise<any[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    
    return new Promise((resolve, reject) => {
      parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      }, (err, records) => {
        if (err) {
          reject(err);
          return;
        }

        // Validate records
        const validatedRecords = records.map((record: any) => {
          // Add ID if missing
          if (!record.id) {
            record.id = uuidv4();
          }

          // Add timestamp if missing
          if (!record.timestamp) {
            record.timestamp = new Date().toISOString();
          }

          // Validate enum fields
          for (const [field, validValues] of Object.entries(COLUMN_VALIDATORS)) {
            if (record[field] && !validValues.includes(record[field])) {
              throw new Error(`Invalid value "${record[field]}" for field "${field}". Must be one of: ${validValues.join(', ')}`);
            }
          }

          // Parse numeric fields
          const numericFields = [
            'units_per_transaction', 'peso_value', 'basket_size',
            'suggestion_accepted', 'substitution_occurred', 'duration_seconds',
            'campaign_influenced', 'handshake_score', 'is_tbwa_client'
          ];

          for (const field of numericFields) {
            if (record[field] !== undefined && record[field] !== '') {
              record[field] = Number(record[field]);
            }
          }

          // Parse JSON fields
          if (record.combo_basket) {
            try {
              record.combo_basket = JSON.parse(record.combo_basket);
            } catch {
              record.combo_basket = [];
            }
          }

          return record;
        });

        resolve(validatedRecords);
      });
    });
  }

  /**
   * Export data to CSV
   */
  static async exportToCSV(data: any[], filePath: string): Promise<void> {
    const output = await new Promise<string>((resolve, reject) => {
      stringify(data, { header: true, columns: CSV_COLUMNS }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    await fs.writeFile(filePath, output, 'utf-8');
  }

  /**
   * Generate a realistic combo basket
   */
  private static generateComboBasket(mainSku: string, size: number): string[] {
    const basket = [mainSku];
    const otherSkus = [
      'BREAD_WW', 'EGGS_12', 'MILK_1L', 'RICE_5KG', 'OIL_1L',
      'SUGAR_1KG', 'COFFEE_50G', 'NOODLES_55G', 'SARDINES_155G'
    ];

    for (let i = 1; i < size; i++) {
      const randomSku = otherSkus[Math.floor(Math.random() * otherSkus.length)];
      if (!basket.includes(randomSku)) {
        basket.push(randomSku);
      }
    }

    return basket;
  }

  /**
   * Get substitute product
   */
  private static getSubstitute(product: any): string {
    const substitutes: Record<string, string[]> = {
      'COKE_1L': ['PEPSI_1L', 'RC_1L', 'COKE_500ML'],
      'PEPSI_1L': ['COKE_1L', 'RC_1L', 'PEPSI_500ML'],
      'NOVA_40G': ['PIATTOS_40G', 'VCUT_35G'],
      'SAFEGUARD_135G': ['DOVE_135G', 'PALMOLIVE_130G'],
      'SURF_1KG': ['TIDE_1KG', 'ARIEL_900G']
    };

    const subs = substitutes[product.sku] || [`${product.sku}_ALT`];
    return subs[Math.floor(Math.random() * subs.length)];
  }
}