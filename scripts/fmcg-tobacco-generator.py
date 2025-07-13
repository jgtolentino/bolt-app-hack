#!/usr/bin/env python3
"""
Generate synthetic Philippine retail transactions
— only FMCG & Tobacco categories, with full v4.0 schema.
"""

import csv
import json
import uuid
import random
from datetime import datetime, timedelta
from typing import List, Dict, Tuple

# Configuration
NUM_TRANSACTIONS = 50000
OUTPUT_FILE = 'comprehensive_fmcg_tobacco.csv'

# Philippine locations with coordinates
LOCATIONS = [
    # NCR
    {'region': 'NCR', 'province': 'Metro Manila', 'city': 'Manila', 
     'barangays': [
         {'name': 'Ermita', 'lat': 14.5823, 'lng': 120.9748},
         {'name': 'Malate', 'lat': 14.5739, 'lng': 120.9909},
         {'name': 'Quiapo', 'lat': 14.5990, 'lng': 120.9831},
         {'name': 'Sampaloc', 'lat': 14.6112, 'lng': 120.9926},
         {'name': 'Tondo', 'lat': 14.6147, 'lng': 120.9671}
     ]},
    {'region': 'NCR', 'province': 'Metro Manila', 'city': 'Quezon City',
     'barangays': [
         {'name': 'Diliman', 'lat': 14.6507, 'lng': 121.0494},
         {'name': 'Cubao', 'lat': 14.6177, 'lng': 121.0551},
         {'name': 'Commonwealth', 'lat': 14.6832, 'lng': 121.0896}
     ]},
    # Region III
    {'region': 'Region III', 'province': 'Pampanga', 'city': 'Angeles',
     'barangays': [
         {'name': 'Balibago', 'lat': 15.1636, 'lng': 120.5887},
         {'name': 'Anunas', 'lat': 15.1333, 'lng': 120.5987}
     ]},
    # Region IV-A
    {'region': 'Region IV-A', 'province': 'Batangas', 'city': 'Batangas City',
     'barangays': [
         {'name': 'Poblacion', 'lat': 13.7565, 'lng': 121.0583},
         {'name': 'Alangilan', 'lat': 13.7860, 'lng': 121.0750}
     ]},
    # Region VII
    {'region': 'Region VII', 'province': 'Cebu', 'city': 'Cebu City',
     'barangays': [
         {'name': 'Lahug', 'lat': 10.3339, 'lng': 123.8941},
         {'name': 'IT Park', 'lat': 10.3308, 'lng': 123.9054}
     ]},
    # Region XI
    {'region': 'Region XI', 'province': 'Davao del Sur', 'city': 'Davao City',
     'barangays': [
         {'name': 'Poblacion', 'lat': 7.0731, 'lng': 125.6128},
         {'name': 'Buhangin', 'lat': 7.1027, 'lng': 125.6358}
     ]}
]

# Store names
STORE_NAMES = [
    "Aling Nena's Store", "Mang Juan Sari-Sari", "Tindahan ni Ate Maria",
    "Kuya Boy Store", "JM Mart", "RJ Store", "Triple M", "ABC Store",
    "Neighborhood Mart", "Corner Store", "Barangay Store", "24/7 Mart"
]

# FMCG & Tobacco brands and products
PRODUCTS = {
    'Dairy': [
        {'brand': 'Alaska', 'products': [
            {'name': 'Alaska Evap 370ml', 'sku': 'ALS001', 'price': 42.00},
            {'name': 'Alaska Evap 154ml', 'sku': 'ALS002', 'price': 18.00},
            {'name': 'Alaska Powdered Milk 33g', 'sku': 'ALS003', 'price': 8.50}
        ]},
        {'brand': 'Bear Brand', 'products': [
            {'name': 'Bear Brand Adult Plus 33g', 'sku': 'BBR001', 'price': 10.00},
            {'name': 'Bear Brand Fortified 150g', 'sku': 'BBR002', 'price': 45.00}
        ]}
    ],
    'Snack': [
        {'brand': 'Jack n Jill', 'products': [
            {'name': 'Piattos Cheese 85g', 'sku': 'JNJ001', 'price': 32.00},
            {'name': 'Nova Multigrain', 'sku': 'JNJ002', 'price': 25.00},
            {'name': 'Chippy BBQ 110g', 'sku': 'JNJ003', 'price': 28.00}
        ]},
        {'brand': 'Oishi', 'products': [
            {'name': 'Oishi Prawn Crackers', 'sku': 'OSH001', 'price': 20.00},
            {'name': 'Kirei Yummy Flakes', 'sku': 'OSH002', 'price': 15.00}
        ]}
    ],
    'Beverage': [
        {'brand': 'Coca-Cola', 'products': [
            {'name': 'Coke Mismo', 'sku': 'COK001', 'price': 15.00},
            {'name': 'Coke Sakto', 'sku': 'COK002', 'price': 20.00},
            {'name': 'Coke 1.5L', 'sku': 'COK003', 'price': 65.00}
        ]},
        {'brand': 'C2', 'products': [
            {'name': 'C2 Apple 355ml', 'sku': 'C2T001', 'price': 22.00},
            {'name': 'C2 Lemon 500ml', 'sku': 'C2T002', 'price': 30.00}
        ]}
    ],
    'Home Care': [
        {'brand': 'Tide', 'products': [
            {'name': 'Tide Bar 130g', 'sku': 'TID001', 'price': 25.00},
            {'name': 'Tide Powder 66g', 'sku': 'TID002', 'price': 12.00},
            {'name': 'Tide Liquid 30ml', 'sku': 'TID003', 'price': 8.50}
        ]},
        {'brand': 'Ariel', 'products': [
            {'name': 'Ariel Powder 66g', 'sku': 'ARL001', 'price': 11.00},
            {'name': 'Ariel Bar 130g', 'sku': 'ARL002', 'price': 23.00}
        ]}
    ],
    'Personal Care': [
        {'brand': 'Head & Shoulders', 'products': [
            {'name': 'H&S Cool Menthol 12ml', 'sku': 'HNS001', 'price': 8.00},
            {'name': 'H&S Anti-Dandruff 170ml', 'sku': 'HNS002', 'price': 125.00}
        ]},
        {'brand': 'Safeguard', 'products': [
            {'name': 'Safeguard White 60g', 'sku': 'SFG001', 'price': 22.00},
            {'name': 'Safeguard Pure White 135g', 'sku': 'SFG002', 'price': 45.00}
        ]}
    ],
    'Tobacco': [
        {'brand': 'Marlboro', 'products': [
            {'name': 'Marlboro Red', 'sku': 'MAR001', 'price': 180.00},
            {'name': 'Marlboro Lights', 'sku': 'MAR002', 'price': 180.00},
            {'name': 'Marlboro Black', 'sku': 'MAR003', 'price': 185.00}
        ]},
        {'brand': 'Fortune', 'products': [
            {'name': 'Fortune International', 'sku': 'FOR001', 'price': 145.00},
            {'name': 'Fortune Menthol', 'sku': 'FOR002', 'price': 145.00}
        ]}
    ]
}

# TBWA clients
TBWA_CLIENTS = ['Alaska', 'Marlboro', 'Tide', 'Coca-Cola', 'Head & Shoulders']

# Audio transcript templates (Tagalog/English mix)
AUDIO_TEMPLATES = [
    {
        'type': 'branded',
        'language': 'mixed',
        'template': "Ate, may {brand} ba kayo? Yung {product}. Magkano?",
        'response': "Meron po, {price} pesos po."
    },
    {
        'type': 'unbranded',
        'language': 'tagalog',
        'template': "Miss, pahingi ng shampoo. Yung maliit lang.",
        'response': "Anong brand po gusto niyo?"
    },
    {
        'type': 'generic',
        'language': 'english',
        'template': "Do you have detergent powder? The small one.",
        'response': "Yes ma'am, we have Tide and Ariel."
    },
    {
        'type': 'substitution',
        'language': 'mixed',
        'template': "May {brand} ba? Wala? Okay, what else do you have?",
        'response': "Wala po {brand}, pero may {alt_brand} po, same price lang."
    }
]

# Video objects that can be detected
VIDEO_OBJECTS = ['shelf', 'counter', 'refrigerator', 'customer', 'storeowner', 
                 'product_display', 'poster', 'cash_register', 'basket', 'bottle',
                 'pack', 'sachet', 'box']

# Campaign data
CAMPAIGNS = [
    {'id': 'CAMP001', 'name': 'Summer Sarap 2024'},
    {'id': 'CAMP002', 'name': 'Payday Promo March'},
    {'id': 'CAMP003', 'name': 'New Variant Launch'},
    {'id': 'CAMP004', 'name': 'Back to School'}
]

def generate_store() -> Dict:
    """Generate a random store with location"""
    location = random.choice(LOCATIONS)
    barangay = random.choice(location['barangays'])
    
    # Add some noise to coordinates
    lat = barangay['lat'] + random.uniform(-0.01, 0.01)
    lng = barangay['lng'] + random.uniform(-0.01, 0.01)
    
    store_id = f"ST{random.randint(100000, 999999)}"
    
    return {
        'store_id': store_id,
        'store_name': random.choice(STORE_NAMES),
        'store_type': random.choice(['sari-sari', 'convenience']),
        'region': location['region'],
        'province': location['province'],
        'city_municipality': location['city'],
        'barangay': barangay['name'],
        'latitude': round(lat, 6),
        'longitude': round(lng, 6),
        'economic_class': random.choice(['A', 'B', 'C', 'D', 'E'])
    }

def generate_customer() -> Dict:
    """Generate customer profile"""
    return {
        'customer_id': str(uuid.uuid4())[:8],
        'gender': random.choice(['male', 'female']),
        'age_bracket': random.choice(['18-24', '25-34', '35-44', '45-54', '55+'])
    }

def select_product() -> Tuple[Dict, str, str]:
    """Select a random product and return product info, category, and brand"""
    category = random.choice(list(PRODUCTS.keys()))
    brand_data = random.choice(PRODUCTS[category])
    product = random.choice(brand_data['products'])
    
    return {
        'sku_id': product['sku'],
        'brand_name': brand_data['brand'],
        'product_name': product['name'],
        'product_category': category,
        'product_subcat': 'Cigarette' if category == 'Tobacco' else category,
        'unit_price': product['price'],
        'is_tbwa_client': brand_data['brand'] in TBWA_CLIENTS
    }, category, brand_data['brand']

def generate_audio_transcript(product_info: Dict, was_substituted: bool) -> Tuple[str, str]:
    """Generate audio transcript"""
    if was_substituted:
        template = next(t for t in AUDIO_TEMPLATES if t['type'] == 'substitution')
        # Get alternative brand from same category
        alt_product, _, alt_brand = select_product()
        transcript = template['template'].format(
            brand=product_info['brand_name'],
            alt_brand=alt_brand
        )
        transcript += " " + template['response'].format(
            brand=product_info['brand_name'],
            alt_brand=alt_brand
        )
    else:
        template = random.choice([t for t in AUDIO_TEMPLATES if t['type'] != 'substitution'])
        if '{brand}' in template['template']:
            transcript = template['template'].format(
                brand=product_info['brand_name'],
                product=product_info['product_name']
            )
            transcript += " " + template['response'].format(
                price=int(product_info['unit_price'])
            )
        else:
            transcript = template['template'] + " " + template['response']
    
    return template['language'], transcript

def generate_video_objects() -> str:
    """Generate detected video objects"""
    num_objects = random.randint(3, 7)
    objects = random.sample(VIDEO_OBJECTS, num_objects)
    return '|'.join(objects)

def generate_transaction(index: int, start_date: datetime) -> List:
    """Generate a single transaction row"""
    # Timestamp
    timestamp = start_date + timedelta(
        days=random.randint(0, 365),
        hours=random.randint(7, 22),  # 7 AM to 10 PM
        minutes=random.randint(0, 59)
    )
    
    # Store and customer
    store = generate_store()
    customer = generate_customer()
    
    # Product selection
    product_info, category, brand = select_product()
    quantity = 1 if category == 'Tobacco' else random.randint(1, 3)
    peso_value = round(quantity * product_info['unit_price'], 2)
    
    # Substitution (5% chance)
    was_substituted = random.random() < 0.05
    original_request = ''
    if was_substituted:
        # Original request was a different product
        orig_product, _, _ = select_product()
        original_request = orig_product['product_name']
    
    # Audio and video
    audio_lang, audio_transcript = generate_audio_transcript(product_info, was_substituted)
    video_objects = generate_video_objects()
    
    # Campaign (20% influenced)
    campaign_id = ''
    if random.random() < 0.2:
        campaign = random.choice(CAMPAIGNS)
        campaign_id = campaign['id']
    
    # Environmental
    weather = random.choice(['sunny', 'rainy', 'cloudy'])
    day_of_week = timestamp.strftime('%A')
    hour_of_day = timestamp.hour
    
    return [
        f"TX{str(index).zfill(8)}",                    # transaction_id
        timestamp.isoformat(),                          # timestamp
        store['store_id'],                              # store_id
        store['store_name'],                            # store_name
        store['store_type'],                            # store_type
        store['region'],                                # region
        store['province'],                              # province
        store['city_municipality'],                     # city_municipality
        store['barangay'],                              # barangay
        store['latitude'],                              # latitude
        store['longitude'],                             # longitude
        store['economic_class'],                        # economic_class
        customer['customer_id'],                        # customer_id
        customer['gender'],                             # gender
        customer['age_bracket'],                        # age_bracket
        product_info['sku_id'],                         # sku_id
        product_info['brand_name'],                     # brand_name
        product_info['product_name'],                   # product_name
        product_info['product_category'],               # product_category
        product_info['product_subcat'],                 # product_subcat
        quantity,                                       # quantity
        f"{product_info['unit_price']:.2f}",           # unit_price
        f"{peso_value:.2f}",                           # peso_value
        int(product_info['is_tbwa_client']),           # is_tbwa_client
        campaign_id,                                    # campaign_id
        int(was_substituted),                          # was_substituted
        original_request,                               # original_request
        audio_lang,                                     # audio_language
        audio_transcript,                               # audio_transcript
        video_objects,                                  # video_objects
        weather,                                        # weather
        day_of_week,                                    # day_of_week
        hour_of_day                                     # hour_of_day
    ]

def main():
    """Generate the full dataset"""
    print(f"🏪 Generating {NUM_TRANSACTIONS} FMCG & Tobacco transactions...")
    print(f"📄 Output file: {OUTPUT_FILE}")
    
    # Headers matching the data dictionary
    headers = [
        'transaction_id', 'timestamp', 'store_id', 'store_name', 'store_type',
        'region', 'province', 'city_municipality', 'barangay', 'latitude', 'longitude',
        'economic_class', 'customer_id', 'gender', 'age_bracket',
        'sku_id', 'brand_name', 'product_name', 'product_category', 'product_subcat',
        'quantity', 'unit_price', 'peso_value', 'is_tbwa_client',
        'campaign_id', 'was_substituted', 'original_request',
        'audio_language', 'audio_transcript', 'video_objects',
        'weather', 'day_of_week', 'hour_of_day'
    ]
    
    start_date = datetime(2024, 1, 1)
    
    # Write CSV
    with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        
        for i in range(NUM_TRANSACTIONS):
            row = generate_transaction(i, start_date)
            writer.writerow(row)
            
            if (i + 1) % 5000 == 0:
                print(f"   Generated {i + 1} transactions...")
    
    print(f"✅ Successfully generated {NUM_TRANSACTIONS} transactions!")
    print(f"📊 Categories: Dairy, Snack, Beverage, Home Care, Personal Care, Tobacco")
    print(f"🌏 Regions: NCR, Region III, Region IV-A, Region VII, Region XI")
    
    # Summary statistics
    print("\n📈 Quick Stats:")
    print(f"- Store types: sari-sari, convenience")
    print(f"- TBWA clients: {', '.join(TBWA_CLIENTS)}")
    print(f"- Substitution rate: ~5%")
    print(f"- Campaign influence: ~20%")

if __name__ == "__main__":
    main()