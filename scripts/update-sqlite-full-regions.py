#!/usr/bin/env python3
"""
Update SQLite Database with Full Philippine Regional Coverage
- All 17 regions with proper polygon boundaries
- Municipality/city level granularity
- Economic weighting based on GDP and population
- Transactions from June 2024 to June 2025
"""

import sqlite3
import random
import json
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import os

# Database path
DB_PATH = '/Users/tbwa/Documents/GitHub/mcp-sqlite-server/data/scout_v4.sqlite'

# Philippine Regions with Economic Weights and Geographic Data
REGIONS_DATA = {
    'NCR': {
        'name': 'National Capital Region',
        'weight': 0.35,  # 35% of transactions (economic powerhouse)
        'provinces': ['Metro Manila'],
        'cities': ['Manila', 'Quezon City', 'Makati', 'Taguig', 'Pasig', 'Paranaque', 'Caloocan', 'Malabon', 'Navotas', 'Valenzuela', 'Marikina', 'San Juan', 'Mandaluyong', 'Pasay', 'Las Pinas', 'Muntinlupa', 'Pateros'],
        'center': {'lat': 14.5995, 'lng': 120.9842},
        'bounds': {
            'north': 14.7800,
            'south': 14.4000,
            'east': 121.1300,
            'west': 120.9000
        }
    },
    'Region I': {
        'name': 'Ilocos Region',
        'weight': 0.03,
        'provinces': ['Ilocos Norte', 'Ilocos Sur', 'La Union', 'Pangasinan'],
        'cities': ['Dagupan', 'San Fernando', 'Laoag', 'Vigan', 'Urdaneta', 'San Carlos', 'Alaminos'],
        'center': {'lat': 16.0833, 'lng': 120.6200},
        'bounds': {
            'north': 18.6500,
            'south': 15.7000,
            'east': 121.5000,
            'west': 119.7000
        }
    },
    'Region II': {
        'name': 'Cagayan Valley',
        'weight': 0.025,
        'provinces': ['Batanes', 'Cagayan', 'Isabela', 'Nueva Vizcaya', 'Quirino'],
        'cities': ['Tuguegarao', 'Santiago', 'Cauayan', 'Ilagan'],
        'center': {'lat': 17.6132, 'lng': 121.7270},
        'bounds': {
            'north': 20.8000,
            'south': 15.9000,
            'east': 122.8000,
            'west': 120.5000
        }
    },
    'Region III': {
        'name': 'Central Luzon',
        'weight': 0.12,  # 12% (major economic region)
        'provinces': ['Aurora', 'Bataan', 'Bulacan', 'Nueva Ecija', 'Pampanga', 'Tarlac', 'Zambales'],
        'cities': ['Angeles', 'Malolos', 'San Fernando', 'Tarlac City', 'Cabanatuan', 'Olongapo', 'Balanga', 'Mabalacat', 'San Jose del Monte', 'Meycauayan'],
        'center': {'lat': 15.4827, 'lng': 120.7120},
        'bounds': {
            'north': 16.5000,
            'south': 14.6000,
            'east': 121.6000,
            'west': 119.6000
        }
    },
    'Region IV-A': {
        'name': 'CALABARZON',
        'weight': 0.15,  # 15% (highly industrialized)
        'provinces': ['Batangas', 'Cavite', 'Laguna', 'Quezon', 'Rizal'],
        'cities': ['Batangas City', 'Lipa', 'Tanauan', 'Calamba', 'San Pedro', 'Santa Rosa', 'Binan', 'Dasmarinas', 'Bacoor', 'Imus', 'Antipolo', 'Lucena'],
        'center': {'lat': 14.1008, 'lng': 121.0794},
        'bounds': {
            'north': 14.9000,
            'south': 13.0000,
            'east': 122.7000,
            'west': 120.5000
        }
    },
    'Region IV-B': {
        'name': 'MIMAROPA',
        'weight': 0.02,
        'provinces': ['Marinduque', 'Occidental Mindoro', 'Oriental Mindoro', 'Palawan', 'Romblon'],
        'cities': ['Puerto Princesa', 'Calapan'],
        'center': {'lat': 12.8797, 'lng': 120.5740},
        'bounds': {
            'north': 14.0000,
            'south': 9.0000,
            'east': 122.0000,
            'west': 117.0000
        }
    },
    'Region V': {
        'name': 'Bicol Region',
        'weight': 0.035,
        'provinces': ['Albay', 'Camarines Norte', 'Camarines Sur', 'Catanduanes', 'Masbate', 'Sorsogon'],
        'cities': ['Legazpi', 'Naga', 'Masbate City', 'Sorsogon City', 'Tabaco', 'Ligao', 'Iriga'],
        'center': {'lat': 13.4210, 'lng': 123.4137},
        'bounds': {
            'north': 14.7000,
            'south': 11.4000,
            'east': 124.5000,
            'west': 122.0000
        }
    },
    'Region VI': {
        'name': 'Western Visayas',
        'weight': 0.06,
        'provinces': ['Aklan', 'Antique', 'Capiz', 'Guimaras', 'Iloilo', 'Negros Occidental'],
        'cities': ['Iloilo City', 'Bacolod', 'Roxas', 'Passi', 'Bago', 'Cadiz', 'Silay', 'Talisay', 'Victorias', 'Sagay', 'San Carlos', 'La Carlota', 'Himamaylan', 'Kabankalan', 'Sipalay', 'Escalante'],
        'center': {'lat': 10.7202, 'lng': 122.5621},
        'bounds': {
            'north': 12.0000,
            'south': 9.3000,
            'east': 123.5000,
            'west': 121.5000
        }
    },
    'Region VII': {
        'name': 'Central Visayas',
        'weight': 0.08,  # 8% (Cebu economic hub)
        'provinces': ['Bohol', 'Cebu', 'Negros Oriental', 'Siquijor'],
        'cities': ['Cebu City', 'Mandaue', 'Lapu-Lapu', 'Tagbilaran', 'Dumaguete', 'Talisay', 'Toledo', 'Naga', 'Carcar', 'Danao', 'Bais', 'Bayawan', 'Canlaon', 'Guihulngan', 'Tanjay'],
        'center': {'lat': 10.3157, 'lng': 123.8854},
        'bounds': {
            'north': 11.3000,
            'south': 9.0000,
            'east': 124.7000,
            'west': 122.9000
        }
    },
    'Region VIII': {
        'name': 'Eastern Visayas',
        'weight': 0.025,
        'provinces': ['Biliran', 'Eastern Samar', 'Leyte', 'Northern Samar', 'Samar', 'Southern Leyte'],
        'cities': ['Tacloban', 'Ormoc', 'Baybay', 'Calbayog', 'Catbalogan', 'Borongan', 'Maasin'],
        'center': {'lat': 11.2444, 'lng': 125.0388},
        'bounds': {
            'north': 12.8000,
            'south': 9.9000,
            'east': 125.8000,
            'west': 124.0000
        }
    },
    'Region IX': {
        'name': 'Zamboanga Peninsula',
        'weight': 0.025,
        'provinces': ['Zamboanga del Norte', 'Zamboanga del Sur', 'Zamboanga Sibugay'],
        'cities': ['Zamboanga City', 'Pagadian', 'Dipolog', 'Dapitan'],
        'center': {'lat': 8.1540, 'lng': 123.2590},
        'bounds': {
            'north': 9.0000,
            'south': 6.9000,
            'east': 123.6000,
            'west': 121.8000
        }
    },
    'Region X': {
        'name': 'Northern Mindanao',
        'weight': 0.045,
        'provinces': ['Bukidnon', 'Camiguin', 'Lanao del Norte', 'Misamis Occidental', 'Misamis Oriental'],
        'cities': ['Cagayan de Oro', 'Iligan', 'Malaybalay', 'Valencia', 'Ozamiz', 'Tangub', 'Oroquieta', 'Gingoog', 'El Salvador'],
        'center': {'lat': 8.0200, 'lng': 124.6850},
        'bounds': {
            'north': 9.4000,
            'south': 7.0000,
            'east': 125.6000,
            'west': 123.3000
        }
    },
    'Region XI': {
        'name': 'Davao Region',
        'weight': 0.07,  # 7% (Davao economic center)
        'provinces': ['Davao de Oro', 'Davao del Norte', 'Davao del Sur', 'Davao Occidental', 'Davao Oriental'],
        'cities': ['Davao City', 'Tagum', 'Panabo', 'Samal', 'Digos', 'Mati'],
        'center': {'lat': 7.0650, 'lng': 125.6080},
        'bounds': {
            'north': 8.5000,
            'south': 5.1000,
            'east': 126.6000,
            'west': 124.6000
        }
    },
    'Region XII': {
        'name': 'SOCCSKSARGEN',
        'weight': 0.035,
        'provinces': ['Cotabato', 'Sarangani', 'South Cotabato', 'Sultan Kudarat'],
        'cities': ['General Santos', 'Koronadal', 'Kidapawan', 'Tacurong'],
        'center': {'lat': 6.2707, 'lng': 124.6859},
        'bounds': {
            'north': 7.6000,
            'south': 5.2000,
            'east': 125.7000,
            'west': 124.0000
        }
    },
    'Region XIII': {
        'name': 'Caraga',
        'weight': 0.02,
        'provinces': ['Agusan del Norte', 'Agusan del Sur', 'Dinagat Islands', 'Surigao del Norte', 'Surigao del Sur'],
        'cities': ['Butuan', 'Surigao City', 'Tandag', 'Bislig', 'Bayugan', 'Cabadbaran'],
        'center': {'lat': 8.9475, 'lng': 125.5406},
        'bounds': {
            'north': 10.2000,
            'south': 7.5000,
            'east': 126.5000,
            'west': 125.0000
        }
    },
    'CAR': {
        'name': 'Cordillera Administrative Region',
        'weight': 0.025,
        'provinces': ['Abra', 'Apayao', 'Benguet', 'Ifugao', 'Kalinga', 'Mountain Province'],
        'cities': ['Baguio', 'Tabuk'],
        'center': {'lat': 17.3514, 'lng': 121.1719},
        'bounds': {
            'north': 18.5000,
            'south': 16.3000,
            'east': 121.8000,
            'west': 120.4000
        }
    },
    'BARMM': {
        'name': 'Bangsamoro Autonomous Region in Muslim Mindanao',
        'weight': 0.015,
        'provinces': ['Basilan', 'Lanao del Sur', 'Maguindanao', 'Sulu', 'Tawi-Tawi'],
        'cities': ['Cotabato City', 'Marawi', 'Lamitan', 'Isabela City'],
        'center': {'lat': 6.9568, 'lng': 124.2422},
        'bounds': {
            'north': 8.0000,
            'south': 4.5000,
            'east': 125.0000,
            'west': 119.3000
        }
    }
}

# Economic class distribution by region type
ECONOMIC_CLASS_DISTRIBUTION = {
    'NCR': {'A': 0.15, 'B': 0.30, 'C': 0.35, 'D': 0.15, 'E': 0.05},
    'highly_urbanized': {'A': 0.08, 'B': 0.22, 'C': 0.35, 'D': 0.25, 'E': 0.10},
    'urbanized': {'A': 0.05, 'B': 0.15, 'C': 0.30, 'D': 0.35, 'E': 0.15},
    'rural': {'A': 0.02, 'B': 0.08, 'C': 0.20, 'D': 0.45, 'E': 0.25}
}

def get_region_type(region_code: str) -> str:
    """Determine region type for economic class distribution"""
    if region_code == 'NCR':
        return 'NCR'
    elif region_code in ['Region III', 'Region IV-A', 'Region VII', 'Region XI']:
        return 'highly_urbanized'
    elif region_code in ['Region I', 'Region VI', 'Region X', 'Region XII']:
        return 'urbanized'
    else:
        return 'rural'

def generate_barangays(city: str, count: int) -> List[str]:
    """Generate barangay names for a city"""
    barangay_prefixes = ['Poblacion', 'San Jose', 'San Juan', 'Santo Nino', 'San Pedro', 
                        'Santa Cruz', 'Santa Maria', 'San Isidro', 'San Antonio', 'San Miguel',
                        'Bagong', 'Pag-asa', 'Masagana', 'Maligaya', 'Mapayapa']
    
    barangays = []
    for i in range(count):
        if i < len(barangay_prefixes):
            barangays.append(f"{barangay_prefixes[i]} ({city})")
        else:
            barangays.append(f"Barangay {i+1} ({city})")
    
    return barangays

def create_polygon_boundary(bounds: Dict[str, float]) -> str:
    """Create a polygon boundary string for a region"""
    # Create a simple rectangular polygon from bounds
    polygon = [
        [bounds['west'], bounds['north']],
        [bounds['east'], bounds['north']],
        [bounds['east'], bounds['south']],
        [bounds['west'], bounds['south']],
        [bounds['west'], bounds['north']]  # Close the polygon
    ]
    return json.dumps(polygon)

def update_stores_table(conn: sqlite3.Connection):
    """Update stores table with full regional coverage"""
    cursor = conn.cursor()
    
    # Clear existing stores
    cursor.execute("DELETE FROM stores")
    
    store_id = 1
    stores_data = []
    
    for region_code, region_info in REGIONS_DATA.items():
        region_type = get_region_type(region_code)
        econ_dist = ECONOMIC_CLASS_DISTRIBUTION[region_type]
        
        # Calculate number of stores for this region based on weight
        num_stores = int(100 * region_info['weight'])  # Total 100 stores
        
        for _ in range(num_stores):
            # Select a city weighted by urban development
            city = random.choice(region_info['cities'])
            
            # Generate barangay
            barangay = random.choice(generate_barangays(city, 20))
            
            # Select province
            province = random.choice(region_info['provinces'])
            
            # Generate coordinates within bounds with clustering near city centers
            lat_range = region_info['bounds']['north'] - region_info['bounds']['south']
            lng_range = region_info['bounds']['east'] - region_info['bounds']['west']
            
            # Add some randomness but cluster around center
            lat = region_info['center']['lat'] + (random.random() - 0.5) * lat_range * 0.6
            lng = region_info['center']['lng'] + (random.random() - 0.5) * lng_range * 0.6
            
            # Ensure within bounds
            lat = max(region_info['bounds']['south'], min(region_info['bounds']['north'], lat))
            lng = max(region_info['bounds']['west'], min(region_info['bounds']['east'], lng))
            
            # Select economic class based on distribution
            econ_class = random.choices(
                list(econ_dist.keys()),
                weights=list(econ_dist.values())
            )[0]
            
            # Generate store name
            store_names = ['Aling', 'Mang', 'Ate', 'Kuya', 'Tita', 'Tito', 'Nanay', 'Tatay']
            filipino_names = ['Maria', 'Juan', 'Rosa', 'Pedro', 'Linda', 'Jose', 'Carmen', 'Ricardo',
                            'Elena', 'Roberto', 'Ana', 'Carlos', 'Luz', 'Miguel', 'Teresa', 'Antonio']
            
            store_name = f"{random.choice(store_names)} {random.choice(filipino_names)} Store"
            
            stores_data.append((
                f"ST{store_id:06d}",
                store_name,
                'sari-sari' if random.random() > 0.2 else 'convenience',
                barangay,
                city,
                province,
                region_code,
                round(lat, 6),
                round(lng, 6),
                econ_class
            ))
            
            store_id += 1
    
    # Insert all stores
    cursor.executemany("""
        INSERT INTO stores (store_id, store_name, store_type, barangay, city_municipality, 
                          province, region, latitude, longitude, economic_class)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, stores_data)
    
    conn.commit()
    print(f"✅ Updated {len(stores_data)} stores across all 17 regions")

def generate_transactions(conn: sqlite3.Connection):
    """Generate 50k transactions from June 2024 to June 2025"""
    cursor = conn.cursor()
    
    # Clear existing transactions
    cursor.execute("DELETE FROM transactions")
    cursor.execute("DELETE FROM transaction_items")
    
    # Get all stores
    cursor.execute("SELECT store_id, region, economic_class FROM stores")
    stores = cursor.fetchall()
    
    # Get all products
    cursor.execute("SELECT sku_id, product_category FROM products")
    products = cursor.fetchall()
    
    # Get all customers
    cursor.execute("SELECT customer_id FROM customers")
    customers = [c[0] for c in cursor.fetchall()]
    
    # Date range: June 2024 to June 2025
    start_date = datetime(2024, 6, 1)
    end_date = datetime(2025, 6, 30)
    days_range = (end_date - start_date).days
    
    transactions_data = []
    items_data = []
    
    # Generate 50k transactions
    for i in range(50000):
        # Select store based on regional weights
        store = random.choice(stores)
        store_id, region, econ_class = store
        
        # Generate transaction date
        trans_date = start_date + timedelta(days=random.randint(0, days_range))
        
        # Peak hours based on Filipino shopping patterns
        if random.random() < 0.3:  # 30% morning peak
            hour = random.randint(6, 9)
        elif random.random() < 0.5:  # 50% evening peak
            hour = random.randint(17, 20)
        else:  # Regular hours
            hour = random.randint(10, 21)
        
        trans_date = trans_date.replace(hour=hour, minute=random.randint(0, 59))
        
        # Transaction value based on economic class
        base_values = {'A': 300, 'B': 200, 'C': 100, 'D': 50, 'E': 30}
        base_value = base_values.get(econ_class, 100)
        trans_value = base_value + random.random() * base_value
        
        # Number of items (fewer for lower economic classes)
        num_items = random.randint(1, 8 if econ_class in ['A', 'B'] else 5)
        
        # Weather patterns (more rain June-Sept)
        month = trans_date.month
        if month in [6, 7, 8, 9]:
            weather = random.choices(['sunny', 'cloudy', 'rainy', 'stormy'], 
                                   weights=[0.2, 0.3, 0.4, 0.1])[0]
        else:
            weather = random.choices(['sunny', 'cloudy', 'rainy', 'stormy'], 
                                   weights=[0.5, 0.3, 0.15, 0.05])[0]
        
        # Transaction data
        trans_id = f"TX{i+1:08d}"
        transactions_data.append((
            trans_id,
            trans_date.isoformat(),
            store_id,
            random.choice(customers),
            round(trans_value, 2),
            round(trans_value * 0.1, 2),  # discount
            round(trans_value * 0.9, 2),  # final amount
            'cash' if random.random() > 0.15 else 'digital',
            random.randint(60, 300),  # duration seconds
            num_items,
            random.choice(['specific', 'generic', 'browsing']),
            random.choice(['tagalog', 'english', 'mixed']),
            random.choice(['low', 'medium', 'high']),
            1 if random.random() > 0.3 else 0,  # suggestion accepted
            f"customer: Kuya, meron bang {random.choice(['Coke', 'Lucky Me', 'Marlboro'])}?",
            round(random.random() * 0.4 + 0.6, 2),  # sentiment
            trans_date.strftime('%A'),
            hour,
            weather,
            1 if trans_date.day in [15, 30] else 0,  # is_payday
            None,  # campaign_id
            1 if random.random() > 0.7 else 0,  # influenced_by_campaign
            "customer|store_owner|products",
            round(random.random() * 0.2, 2),  # handshake_score
            1 if random.random() > 0.8 else 0  # handshake_detected
        ))
        
        # Generate transaction items
        selected_products = random.sample(products, min(num_items, len(products)))
        for product in selected_products:
            sku_id, category = product
            
            # Substitution logic (higher in lower economic classes)
            was_substituted = 1 if random.random() < (0.2 if econ_class in ['D', 'E'] else 0.1) else 0
            
            quantity = random.randint(1, 3)
            unit_price = round(trans_value / num_items * random.uniform(0.8, 1.2), 2)
            total_price = round(unit_price * quantity, 2)
            
            items_data.append((
                trans_id,
                sku_id,
                quantity,
                unit_price,
                total_price,
                was_substituted,
                random.choice(['Coke', 'Pepsi', 'Lucky Me', 'Nissin']) if was_substituted else None,  # original_brand
                f"SKU{random.randint(1, 1000):06d}" if was_substituted else None  # original_sku
            ))
    
    # Bulk insert transactions
    cursor.executemany("""
        INSERT INTO transactions (
            transaction_id, timestamp, store_id, customer_id, transaction_value,
            discount_amount, final_amount, payment_method, duration_seconds, units_total,
            request_type, language, storeowner_influence, suggestion_accepted,
            full_transcript, sentiment_score, day_of_week, hour_of_day, weather,
            is_payday, campaign_id, influenced_by_campaign, video_objects_detected,
            handshake_score, handshake_detected
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, transactions_data)
    
    # Bulk insert transaction items
    cursor.executemany("""
        INSERT INTO transaction_items (
            transaction_id, sku_id, quantity, unit_price, total_price,
            was_substituted, original_brand, original_sku_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, items_data)
    
    conn.commit()
    print(f"✅ Generated {len(transactions_data)} transactions from June 2024 to June 2025")

def create_region_boundaries_table(conn: sqlite3.Connection):
    """Create a dedicated region boundaries table with GeoJSON polygons"""
    cursor = conn.cursor()
    
    # Create region_boundaries table if it doesn't exist
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS region_boundaries (
            region_code TEXT PRIMARY KEY,
            region_name TEXT NOT NULL,
            polygon TEXT NOT NULL,  -- GeoJSON polygon
            area_sqkm REAL,
            population_2020 INTEGER,
            gdp_billion_php REAL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Population and GDP estimates for weighting
    region_stats = {
        'NCR': {'area': 619.57, 'population': 13484462, 'gdp': 5984.0},
        'Region I': {'area': 13012.60, 'population': 5301139, 'gdp': 440.2},
        'Region II': {'area': 29836.88, 'population': 3685744, 'gdp': 302.7},
        'Region III': {'area': 22014.63, 'population': 12422172, 'gdp': 2201.9},
        'Region IV-A': {'area': 16576.26, 'population': 16195042, 'gdp': 2744.0},
        'Region IV-B': {'area': 29606.25, 'population': 3228558, 'gdp': 186.5},
        'Region V': {'area': 18155.82, 'population': 6082165, 'gdp': 325.9},
        'Region VI': {'area': 20778.29, 'population': 7954723, 'gdp': 773.5},
        'Region VII': {'area': 15872.58, 'population': 8081988, 'gdp': 1269.8},
        'Region VIII': {'area': 23251.85, 'population': 4719892, 'gdp': 278.4},
        'Region IX': {'area': 17056.56, 'population': 3875576, 'gdp': 310.1},
        'Region X': {'area': 20496.02, 'population': 5022768, 'gdp': 616.8},
        'Region XI': {'area': 20357.42, 'population': 5243536, 'gdp': 1125.5},
        'Region XII': {'area': 22513.30, 'population': 4901486, 'gdp': 459.5},
        'Region XIII': {'area': 21478.35, 'population': 2804788, 'gdp': 180.3},
        'CAR': {'area': 19422.03, 'population': 1797660, 'gdp': 230.9},
        'BARMM': {'area': 36506.75, 'population': 4404288, 'gdp': 120.7}
    }
    
    # Clear existing data
    cursor.execute("DELETE FROM region_boundaries")
    
    boundaries_data = []
    for region_code, region_info in REGIONS_DATA.items():
        stats = region_stats.get(region_code, {})
        
        boundaries_data.append((
            region_code,
            region_info['name'],
            create_polygon_boundary(region_info['bounds']),
            stats.get('area', 0),
            stats.get('population', 0),
            stats.get('gdp', 0),
            datetime.now().isoformat()
        ))
    
    cursor.executemany("""
        INSERT INTO region_boundaries (
            region_code, region_name, polygon, area_sqkm, 
            population_2020, gdp_billion_php, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    """, boundaries_data)
    
    conn.commit()
    print(f"✅ Created region boundaries for all 17 regions")

def main():
    """Main execution function"""
    print("🚀 Updating SQLite database with full Philippine regional coverage...")
    
    # Connect to database
    conn = sqlite3.connect(DB_PATH)
    
    try:
        # Create region boundaries table
        create_region_boundaries_table(conn)
        
        # Update stores with full regional coverage
        update_stores_table(conn)
        
        # Generate transactions from June 2024 to June 2025
        generate_transactions(conn)
        
        # Verify the update
        cursor = conn.cursor()
        
        # Check regional distribution
        cursor.execute("""
            SELECT s.region, COUNT(DISTINCT t.transaction_id) as trans_count,
                   SUM(t.final_amount) as total_revenue
            FROM transactions t
            JOIN stores s ON t.store_id = s.store_id
            GROUP BY s.region
            ORDER BY total_revenue DESC
        """)
        
        print("\n📊 Regional Distribution:")
        print(f"{'Region':<15} {'Transactions':<15} {'Revenue (₱)':<20}")
        print("-" * 50)
        
        for row in cursor.fetchall():
            print(f"{row[0]:<15} {row[1]:<15,} ₱{row[2]:,.2f}")
        
        # Check date range
        cursor.execute("""
            SELECT MIN(timestamp) as earliest, MAX(timestamp) as latest,
                   COUNT(*) as total_transactions
            FROM transactions
        """)
        
        date_info = cursor.fetchone()
        print(f"\n📅 Date Range:")
        print(f"Earliest: {date_info[0]}")
        print(f"Latest: {date_info[1]}")
        print(f"Total Transactions: {date_info[2]:,}")
        
        conn.commit()
        print("\n✅ Database update completed successfully!")
        
    except Exception as e:
        print(f"❌ Error updating database: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    main()