#!/usr/bin/env python3
"""
Load synthetic data CSV into PostgreSQL database
Handles normalization and relationships
"""

import csv
import psycopg2
from psycopg2.extras import execute_batch
import os
from datetime import datetime
from typing import Dict, Set, List
import argparse

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'scout_v4'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'postgres'),
    'port': os.getenv('DB_PORT', '5432')
}

class DataLoader:
    def __init__(self, csv_file: str, batch_size: int = 1000):
        self.csv_file = csv_file
        self.batch_size = batch_size
        self.conn = None
        self.cursor = None
        
        # Track unique entities for normalization
        self.brands: Dict[str, str] = {}  # brand_name -> brand_id
        self.products: Dict[str, Dict] = {}  # sku_id -> product info
        self.stores: Set[str] = set()
        self.customers: Set[str] = set()
        self.campaigns: Set[str] = set()
        
    def connect(self):
        """Connect to PostgreSQL database"""
        try:
            self.conn = psycopg2.connect(**DB_CONFIG)
            self.cursor = self.conn.cursor()
            print("✅ Connected to PostgreSQL database")
        except Exception as e:
            print(f"❌ Failed to connect to database: {e}")
            raise
    
    def disconnect(self):
        """Close database connection"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
    
    def extract_entities(self):
        """First pass: Extract unique entities from CSV"""
        print("📊 Extracting unique entities...")
        
        with open(self.csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                # Brands
                if row['brand_name'] not in self.brands:
                    self.brands[row['brand_name']] = None
                
                # Products
                if row['sku_id'] not in self.products:
                    self.products[row['sku_id']] = {
                        'brand_name': row['brand_name'],
                        'product_name': row['product_name'],
                        'category': row['product_category'],
                        'subcategory': row['product_subcat'],
                        'unit_price': float(row['unit_price'])
                    }
                
                # Stores
                self.stores.add(row['store_id'])
                
                # Customers
                if row['customer_id']:
                    self.customers.add(row['customer_id'])
                
                # Campaigns
                if row['campaign_id']:
                    self.campaigns.add(row['campaign_id'])
        
        print(f"  Found {len(self.brands)} brands")
        print(f"  Found {len(self.products)} products")
        print(f"  Found {len(self.stores)} stores")
        print(f"  Found {len(self.customers)} customers")
        print(f"  Found {len(self.campaigns)} campaigns")
    
    def load_brands(self):
        """Load brands into database"""
        print("💼 Loading brands...")
        
        # TBWA clients
        tbwa_clients = ['Alaska', 'Marlboro', 'Tide', 'Coca-Cola', 'Head & Shoulders']
        
        insert_sql = """
            INSERT INTO brands (brand_name, is_tbwa_client)
            VALUES (%s, %s)
            ON CONFLICT (brand_name) DO UPDATE
            SET is_tbwa_client = EXCLUDED.is_tbwa_client
            RETURNING brand_id, brand_name
        """
        
        for brand_name in self.brands:
            is_tbwa = brand_name in tbwa_clients
            self.cursor.execute(insert_sql, (brand_name, is_tbwa))
            brand_id, _ = self.cursor.fetchone()
            self.brands[brand_name] = brand_id
        
        self.conn.commit()
        print(f"  ✅ Loaded {len(self.brands)} brands")
    
    def load_products(self):
        """Load products into database"""
        print("📦 Loading products...")
        
        insert_sql = """
            INSERT INTO products (
                sku_id, brand_id, product_name, product_category, 
                product_subcat, msrp
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (sku_id) DO UPDATE
            SET product_name = EXCLUDED.product_name,
                msrp = EXCLUDED.msrp
        """
        
        data = []
        for sku_id, product in self.products.items():
            brand_id = self.brands[product['brand_name']]
            data.append((
                sku_id,
                brand_id,
                product['product_name'],
                product['category'],
                product['subcategory'],
                product['unit_price']
            ))
        
        execute_batch(self.cursor, insert_sql, data, page_size=self.batch_size)
        self.conn.commit()
        print(f"  ✅ Loaded {len(self.products)} products")
    
    def load_stores(self):
        """Load stores from CSV"""
        print("🏪 Loading stores...")
        
        # Read store details from CSV
        stores_data = {}
        with open(self.csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row['store_id'] not in stores_data:
                    stores_data[row['store_id']] = {
                        'name': row['store_name'],
                        'type': row['store_type'],
                        'region': row['region'],
                        'province': row['province'],
                        'city': row['city_municipality'],
                        'barangay': row['barangay'],
                        'lat': float(row['latitude']),
                        'lng': float(row['longitude']),
                        'class': row['economic_class']
                    }
        
        insert_sql = """
            INSERT INTO stores (
                store_id, store_name, store_type,
                region, province, city_municipality, barangay,
                latitude, longitude, economic_class
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (store_id) DO UPDATE
            SET store_name = EXCLUDED.store_name
        """
        
        data = []
        for store_id, store in stores_data.items():
            data.append((
                store_id,
                store['name'],
                store['type'],
                store['region'],
                store['province'],
                store['city'],
                store['barangay'],
                store['lat'],
                store['lng'],
                store['class']
            ))
        
        execute_batch(self.cursor, insert_sql, data, page_size=self.batch_size)
        self.conn.commit()
        print(f"  ✅ Loaded {len(stores_data)} stores")
    
    def load_customers(self):
        """Load customers from CSV"""
        print("👥 Loading customers...")
        
        # Read customer details from CSV
        customers_data = {}
        with open(self.csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row['customer_id'] and row['customer_id'] not in customers_data:
                    customers_data[row['customer_id']] = {
                        'gender': row['gender'],
                        'age_bracket': row['age_bracket']
                    }
        
        insert_sql = """
            INSERT INTO customers (
                external_id, gender, age_bracket,
                customer_type, loyalty_status, inferred_from
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (external_id) DO NOTHING
        """
        
        data = []
        for cust_id, cust in customers_data.items():
            data.append((
                cust_id,
                cust['gender'],
                cust['age_bracket'],
                'regular',  # Default type
                'non-member',  # Default status
                'transaction_pattern'
            ))
        
        execute_batch(self.cursor, insert_sql, data, page_size=self.batch_size)
        self.conn.commit()
        print(f"  ✅ Loaded {len(customers_data)} customers")
    
    def load_campaigns(self):
        """Load campaigns"""
        print("📢 Loading campaigns...")
        
        # Campaign names mapping
        campaign_names = {
            'CAMP001': 'Summer Sarap 2024',
            'CAMP002': 'Payday Promo March',
            'CAMP003': 'New Variant Launch',
            'CAMP004': 'Back to School'
        }
        
        insert_sql = """
            INSERT INTO campaigns (campaign_id, campaign_name, campaign_type)
            VALUES (%s, %s, %s)
            ON CONFLICT (campaign_id) DO NOTHING
        """
        
        data = []
        for camp_id in self.campaigns:
            if camp_id in campaign_names:
                data.append((
                    camp_id,
                    campaign_names[camp_id],
                    'below_the_line'  # Default type
                ))
        
        if data:
            execute_batch(self.cursor, insert_sql, data)
            self.conn.commit()
            print(f"  ✅ Loaded {len(data)} campaigns")
    
    def load_transactions(self):
        """Load transactions and related data"""
        print("💳 Loading transactions...")
        
        # Get customer ID mapping
        self.cursor.execute("""
            SELECT external_id, customer_id 
            FROM customers 
            WHERE external_id IS NOT NULL
        """)
        customer_map = dict(self.cursor.fetchall())
        
        transaction_count = 0
        item_count = 0
        audio_count = 0
        video_count = 0
        
        with open(self.csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            trans_batch = []
            items_batch = []
            audio_batch = []
            video_batch = []
            
            for row in reader:
                # Parse timestamp
                timestamp = datetime.fromisoformat(row['timestamp'])
                
                # Get customer UUID
                customer_uuid = customer_map.get(row['customer_id'])
                
                # Transaction data
                trans_data = (
                    row['transaction_id'],
                    timestamp,
                    row['store_id'],
                    customer_uuid,
                    float(row['peso_value']),  # transaction_value
                    0.0,  # discount_amount
                    float(row['peso_value']),  # final_amount
                    'cash',  # default payment_method
                    120,  # default duration_seconds
                    int(row['quantity']),  # units_total
                    1,  # unique_items (simplified)
                    row['weather'],
                    row['day_of_week'],
                    int(row['hour_of_day']),
                    False,  # is_holiday
                    timestamp.day in [15, 30],  # is_payday
                    row['campaign_id'] if row['campaign_id'] else None,
                    bool(row['campaign_id'])  # influenced_by_campaign
                )
                trans_batch.append(trans_data)
                
                # Transaction item
                item_data = (
                    row['transaction_id'],
                    row['sku_id'],
                    int(row['quantity']),
                    float(row['unit_price']),
                    float(row['peso_value']),
                    0.0,  # discount_applied
                    bool(int(row['was_substituted'])),
                    row['original_request'] if row['original_request'] else None,
                    'out_of_stock' if row['was_substituted'] == '1' else None,
                    False,  # is_promo
                    None   # promo_type
                )
                items_batch.append(item_data)
                
                # Audio transcript
                if row['audio_transcript']:
                    audio_data = (
                        row['transaction_id'],
                        row['audio_language'],
                        120,  # audio_duration_seconds
                        'clear',  # audio_quality
                        'low',  # background_noise_level
                        row['audio_transcript'],
                        0.92,  # transcription_confidence
                        [row['brand_name']],  # key_phrases
                        'branded' if row['brand_name'] in row['audio_transcript'] else 'generic',
                        'high' if row['was_substituted'] == '1' else 'low',
                        bool(int(row['was_substituted'])),
                        bool(int(row['was_substituted'])),
                        0.75,  # sentiment_score
                        'purchase',  # primary_intent
                        [row['brand_name']],  # brand_mentions
                        [row['product_name']],  # product_mentions
                        'pesos' in row['audio_transcript'].lower(),  # price_mentioned
                        'promo' in row['audio_transcript'].lower()   # promo_inquiry
                    )
                    audio_batch.append(audio_data)
                
                # Video signals
                if row['video_objects']:
                    objects = row['video_objects'].split('|')
                    video_data = (
                        row['transaction_id'],
                        objects,
                        2,  # people_count
                        [row['product_name']],  # products_visible
                        'full',  # shelf_visibility
                        60,  # browsing_duration_seconds
                        1,   # products_touched
                        30,  # decision_time_seconds
                        None,  # path_taken
                        'good',  # lighting_quality
                        'organized',  # store_organization
                        0,  # queue_length
                        False,  # looked_at_promo
                        []  # promo_materials_visible
                    )
                    video_batch.append(video_data)
                
                # Insert batches when full
                if len(trans_batch) >= self.batch_size:
                    self._insert_transaction_batch(trans_batch, items_batch, audio_batch, video_batch)
                    transaction_count += len(trans_batch)
                    item_count += len(items_batch)
                    audio_count += len(audio_batch)
                    video_count += len(video_batch)
                    
                    trans_batch = []
                    items_batch = []
                    audio_batch = []
                    video_batch = []
                    
                    print(f"  Processed {transaction_count} transactions...")
            
            # Insert remaining batches
            if trans_batch:
                self._insert_transaction_batch(trans_batch, items_batch, audio_batch, video_batch)
                transaction_count += len(trans_batch)
                item_count += len(items_batch)
                audio_count += len(audio_batch)
                video_count += len(video_batch)
        
        print(f"  ✅ Loaded {transaction_count} transactions")
        print(f"  ✅ Loaded {item_count} transaction items")
        print(f"  ✅ Loaded {audio_count} audio transcripts")
        print(f"  ✅ Loaded {video_count} video signals")
    
    def _insert_transaction_batch(self, trans_batch, items_batch, audio_batch, video_batch):
        """Insert a batch of transactions and related data"""
        # Insert transactions
        trans_sql = """
            INSERT INTO transactions (
                transaction_id, timestamp, store_id, customer_id,
                transaction_value, discount_amount, final_amount,
                payment_method, duration_seconds, units_total, unique_items,
                weather, day_of_week, hour_of_day, is_holiday, is_payday,
                campaign_id, influenced_by_campaign
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (transaction_id) DO NOTHING
        """
        execute_batch(self.cursor, trans_sql, trans_batch, page_size=1000)
        
        # Insert items
        items_sql = """
            INSERT INTO transaction_items (
                transaction_id, sku_id, quantity, unit_price, total_price,
                discount_applied, was_substituted, original_sku_id,
                substitution_reason, is_promo, promo_type
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        execute_batch(self.cursor, items_sql, items_batch, page_size=1000)
        
        # Insert audio transcripts
        if audio_batch:
            audio_sql = """
                INSERT INTO audio_transcripts (
                    transaction_id, audio_language, audio_duration_seconds,
                    audio_quality, background_noise_level, full_transcript,
                    transcription_confidence, key_phrases, request_type,
                    storeowner_influence, recommendation_given, suggestion_accepted,
                    sentiment_score, primary_intent, brand_mentions,
                    product_mentions, price_mentioned, promo_inquiry
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            execute_batch(self.cursor, audio_sql, audio_batch, page_size=1000)
        
        # Insert video signals
        if video_batch:
            video_sql = """
                INSERT INTO video_signals (
                    transaction_id, objects_detected, people_count,
                    products_visible, shelf_visibility, browsing_duration_seconds,
                    products_touched, decision_time_seconds, path_taken,
                    lighting_quality, store_organization, queue_length,
                    looked_at_promo, promo_materials_visible
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            execute_batch(self.cursor, video_sql, video_batch, page_size=1000)
        
        self.conn.commit()
    
    def refresh_materialized_views(self):
        """Refresh materialized views"""
        print("🔄 Refreshing materialized views...")
        
        views = [
            'mv_hourly_patterns',
            'mv_daily_sales',
            'mv_product_performance',
            'mv_regional_performance'
        ]
        
        for view in views:
            try:
                self.cursor.execute(f"REFRESH MATERIALIZED VIEW {view}")
                print(f"  ✅ Refreshed {view}")
            except Exception as e:
                print(f"  ⚠️  Failed to refresh {view}: {e}")
        
        self.conn.commit()
    
    def run(self):
        """Run the complete data loading process"""
        print("🚀 Starting data load process...")
        print(f"📄 Input file: {self.csv_file}")
        
        try:
            self.connect()
            
            # Extract entities first
            self.extract_entities()
            
            # Load reference data
            self.load_brands()
            self.load_products()
            self.load_stores()
            self.load_customers()
            self.load_campaigns()
            
            # Load transactions
            self.load_transactions()
            
            # Refresh views
            self.refresh_materialized_views()
            
            print("\n✅ Data loading complete!")
            
        except Exception as e:
            print(f"\n❌ Error during data load: {e}")
            if self.conn:
                self.conn.rollback()
            raise
        
        finally:
            self.disconnect()

def main():
    parser = argparse.ArgumentParser(description='Load synthetic data into PostgreSQL')
    parser.add_argument('csv_file', help='Path to the CSV file')
    parser.add_argument('--batch-size', type=int, default=1000, help='Batch size for inserts')
    parser.add_argument('--host', help='Database host')
    parser.add_argument('--database', help='Database name')
    parser.add_argument('--user', help='Database user')
    parser.add_argument('--password', help='Database password')
    
    args = parser.parse_args()
    
    # Override DB config with command line args
    if args.host:
        DB_CONFIG['host'] = args.host
    if args.database:
        DB_CONFIG['database'] = args.database
    if args.user:
        DB_CONFIG['user'] = args.user
    if args.password:
        DB_CONFIG['password'] = args.password
    
    # Run loader
    loader = DataLoader(args.csv_file, args.batch_size)
    loader.run()

if __name__ == "__main__":
    main()