/*
  # Seed Organization Data

  1. Sample Data
    - Major Philippine FMCG brands
    - Popular sari-sari store products
    - Realistic pricing and margins
*/

-- Insert sample organization data for Philippine FMCG products
INSERT INTO organization (client, category, brand, sku, sku_description, unit_price, cost_price, margin_percent, package_size, is_competitor) VALUES

-- Beverages - Coca-Cola Products
('The Coca-Cola Company', 'Beverages', 'Coca-Cola', 'COKE-355ML-CAN', 'Coca-Cola Regular 355ml Can', 25.00, 18.50, 26.0, '355ml', false),
('The Coca-Cola Company', 'Beverages', 'Coca-Cola', 'COKE-1L-PET', 'Coca-Cola Regular 1L PET Bottle', 45.00, 32.00, 28.9, '1L', false),
('The Coca-Cola Company', 'Beverages', 'Sprite', 'SPRITE-355ML-CAN', 'Sprite Lemon-Lime 355ml Can', 25.00, 18.50, 26.0, '355ml', false),
('The Coca-Cola Company', 'Beverages', 'Royal', 'ROYAL-355ML-CAN', 'Royal Tru-Orange 355ml Can', 23.00, 17.00, 26.1, '355ml', false),

-- Beverages - Pepsi Products (Competitor)
('PepsiCo Philippines', 'Beverages', 'Pepsi', 'PEPSI-355ML-CAN', 'Pepsi Cola 355ml Can', 25.00, 18.50, 26.0, '355ml', true),
('PepsiCo Philippines', 'Beverages', '7UP', '7UP-355ML-CAN', '7UP Lemon-Lime 355ml Can', 25.00, 18.50, 26.0, '355ml', true),

-- Sports Drinks
('The Coca-Cola Company', 'Beverages', 'Powerade', 'POWERADE-500ML-BLUE', 'Powerade ION4 Blue 500ml', 35.00, 25.00, 28.6, '500ml', false),
('PepsiCo Philippines', 'Beverages', 'Gatorade', 'GATORADE-500ML-ORANGE', 'Gatorade Orange 500ml', 38.00, 27.00, 28.9, '500ml', true),

-- Snacks - Oishi (Liwayway)
('Liwayway Marketing', 'Snacks', 'Oishi', 'OISHI-PRAWN-60G', 'Oishi Prawn Crackers 60g', 15.00, 9.50, 36.7, '60g', false),
('Liwayway Marketing', 'Snacks', 'Oishi', 'OISHI-PILLOWS-38G', 'Oishi Pillows Chocolate 38g', 12.00, 7.80, 35.0, '38g', false),
('Liwayway Marketing', 'Snacks', 'Oishi', 'OISHI-RIBBED-50G', 'Oishi Ribbed Cracklings 50g', 18.00, 11.70, 35.0, '50g', false),

-- Snacks - Competitor Products
('Universal Robina Corporation', 'Snacks', 'Jack n Jill', 'JNJ-PIATTOS-40G', 'Jack n Jill Piattos 40g', 16.00, 10.40, 35.0, '40g', true),
('Mondelez Philippines', 'Snacks', 'Oreo', 'OREO-COOKIES-137G', 'Oreo Original Cookies 137g', 45.00, 29.25, 35.0, '137g', true),

-- Dairy - Alaska Milk
('Alaska Milk Corporation', 'Dairy', 'Alaska', 'ALASKA-EVAP-410ML', 'Alaska Evaporated Milk 410ml', 28.00, 20.16, 28.0, '410ml', false),
('Alaska Milk Corporation', 'Dairy', 'Alaska', 'ALASKA-CONDENSED-300ML', 'Alaska Condensada 300ml', 32.00, 23.04, 28.0, '300ml', false),

-- Dairy - Bear Brand (Nestle)
('Nestlé Philippines', 'Dairy', 'Bear Brand', 'BEAR-BRAND-300ML', 'Bear Brand Sterilized Milk 300ml', 30.00, 21.60, 28.0, '300ml', false),
('Nestlé Philippines', 'Dairy', 'Nido', 'NIDO-POWDER-400G', 'Nido Fortified Milk Powder 400g', 185.00, 133.20, 28.0, '400g', false),

-- Food - Del Monte
('Del Monte Philippines', 'Food', 'Del Monte', 'DELMONTE-PINEAPPLE-1L', 'Del Monte Pineapple Juice 1L', 65.00, 46.80, 28.0, '1L', false),
('Del Monte Philippines', 'Food', 'Del Monte', 'DELMONTE-CORNED-150G', 'Del Monte Corned Beef 150g', 45.00, 32.40, 28.0, '150g', false),

-- Personal Care - Unilever
('Unilever Philippines', 'Personal Care', 'Dove', 'DOVE-SOAP-135G', 'Dove Beauty Bar White 135g', 45.00, 27.00, 40.0, '135g', false),
('Unilever Philippines', 'Personal Care', 'Closeup', 'CLOSEUP-TOOTHPASTE-160G', 'Closeup Red Hot Toothpaste 160g', 85.00, 51.00, 40.0, '160g', false),

-- Personal Care - Procter & Gamble
('Procter & Gamble Philippines', 'Personal Care', 'Safeguard', 'SAFEGUARD-SOAP-130G', 'Safeguard Antibacterial Soap 130g', 38.00, 22.80, 40.0, '130g', true),
('Procter & Gamble Philippines', 'Personal Care', 'Head & Shoulders', 'HS-SHAMPOO-170ML', 'Head & Shoulders Classic Clean 170ml', 125.00, 75.00, 40.0, '170ml', true),

-- Home Care - Surf (Unilever)
('Unilever Philippines', 'Home Care', 'Surf', 'SURF-POWDER-1KG', 'Surf Powder Detergent 1kg', 95.00, 61.75, 35.0, '1kg', false),
('Unilever Philippines', 'Home Care', 'Surf', 'SURF-LIQUID-1L', 'Surf Liquid Detergent 1L', 110.00, 71.50, 35.0, '1L', false),

-- Home Care - Tide (P&G)
('Procter & Gamble Philippines', 'Home Care', 'Tide', 'TIDE-POWDER-1KG', 'Tide Powder Detergent 1kg', 105.00, 68.25, 35.0, '1kg', true),

-- Instant Noodles - Lucky Me (Monde Nissin)
('Monde Nissin Corporation', 'Food', 'Lucky Me', 'LUCKYME-PANCIT-60G', 'Lucky Me Pancit Canton 60g', 12.00, 8.40, 30.0, '60g', false),
('Monde Nissin Corporation', 'Food', 'Lucky Me', 'LUCKYME-BEEF-55G', 'Lucky Me Beef na Beef 55g', 11.00, 7.70, 30.0, '55g', false),

-- Cigarettes (Age-restricted)
('Philip Morris Philippines', 'Tobacco', 'Marlboro', 'MARLBORO-RED-20S', 'Marlboro Red 20s', 150.00, 120.00, 20.0, '20 sticks', false),
('JT International Philippines', 'Tobacco', 'Winston', 'WINSTON-RED-20S', 'Winston Red 20s', 140.00, 112.00, 20.0, '20 sticks', true);