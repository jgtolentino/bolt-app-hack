/*
  # Seed Geography Data

  1. Sample Data
    - Philippine regions, cities, and barangays
    - Realistic sari-sari store locations
    - GPS coordinates for major Philippine locations
*/

-- Insert sample geography data for Philippine locations
INSERT INTO geography (region, city_municipality, barangay, store_name, latitude, longitude, population, area_sqkm, store_type) VALUES
-- NCR (National Capital Region)
('NCR', 'Manila', 'Tondo', 'Tondo Sari-Sari Store', 14.6042, 120.9822, 628903, 865.12, 'sari-sari'),
('NCR', 'Manila', 'Binondo', 'Binondo Mini Mart', 14.5995, 120.9739, 12985, 0.67, 'mini-mart'),
('NCR', 'Manila', 'Ermita', 'Ermita Corner Store', 14.5832, 120.9789, 7143, 1.59, 'sari-sari'),
('NCR', 'Quezon City', 'Bagumbayan', 'Bagumbayan MiniMart', 14.6760, 121.0437, 45312, 2.34, 'mini-mart'),
('NCR', 'Quezon City', 'Diliman', 'UP Diliman Store', 14.6537, 121.0685, 89123, 4.93, 'sari-sari'),
('NCR', 'Makati', 'Poblacion', 'Poblacion 24/7', 14.5547, 121.0244, 8806, 0.67, 'convenience'),
('NCR', 'Pasig', 'Kapitolyo', 'Kapitolyo Sari-Sari', 14.5648, 121.0792, 54413, 3.12, 'sari-sari'),

-- Region III (Central Luzon)
('Region III', 'Angeles City', 'Belen', 'Belen Neighborhood Store', 15.1605, 120.5897, 45678, 2.89, 'sari-sari'),
('Region III', 'Angeles City', 'Sto. Domingo', 'Sto. Domingo Mini Mart', 15.1449, 120.5934, 32145, 1.78, 'mini-mart'),
('Region III', 'San Fernando', 'Del Pilar', 'Del Pilar Store', 15.0359, 120.6897, 28934, 2.45, 'sari-sari'),
('Region III', 'Olongapo', 'Barretto', 'Barretto Sari-Sari', 14.8294, 120.2824, 19876, 1.67, 'sari-sari'),

-- Region IV-A (CALABARZON)
('Region IV-A', 'Antipolo', 'San Roque', 'San Roque Store', 14.5878, 121.1854, 67890, 3.45, 'sari-sari'),
('Region IV-A', 'Calamba', 'Real', 'Real Sari-Sari Store', 14.2118, 121.1653, 43567, 2.78, 'sari-sari'),
('Region IV-A', 'Santa Rosa', 'Tagapo', 'Tagapo Mini Mart', 14.3123, 121.1114, 38945, 2.12, 'mini-mart'),
('Region IV-A', 'Lipa', 'Poblacion', 'Lipa Central Store', 13.9411, 121.1624, 52341, 3.89, 'sari-sari'),

-- Region VI (Western Visayas)
('Region VI', 'Iloilo City', 'Jaro', 'Jaro Public Market Store', 10.7323, 122.5621, 89234, 4.56, 'sari-sari'),
('Region VI', 'Iloilo City', 'Molo', 'Molo Sari-Sari', 10.6958, 122.5445, 67123, 3.21, 'sari-sari'),
('Region VI', 'Bacolod', 'Taculing', 'Taculing Store', 10.6740, 122.9503, 45678, 2.89, 'sari-sari'),

-- Region VII (Central Visayas)
('Region VII', 'Cebu City', 'Lahug', 'Lahug Sari-Sari Store', 10.3312, 123.9078, 89123, 4.12, 'sari-sari'),
('Region VII', 'Cebu City', 'Capitol Site', 'Capitol Mini Mart', 10.3157, 123.8854, 34567, 1.89, 'mini-mart'),
('Region VII', 'Cebu City', 'Colon', 'Colon Heritage Store', 10.2966, 123.9018, 23456, 0.98, 'sari-sari'),
('Region VII', 'Mandaue', 'Centro', 'Centro Sari-Sari', 10.3237, 123.9227, 56789, 2.67, 'sari-sari'),
('Region VII', 'Lapu-Lapu', 'Poblacion', 'Lapu-Lapu Store', 10.3103, 123.9494, 43210, 2.34, 'sari-sari'),

-- Region XI (Davao Region)
('Region XI', 'Davao City', 'Bangkal', 'Bangkal Sari-Sari Store', 7.0731, 125.6128, 78901, 3.45, 'sari-sari'),
('Region XI', 'Davao City', 'Poblacion', 'Poblacion Central Store', 7.0644, 125.6078, 45678, 2.12, 'sari-sari'),
('Region XI', 'Davao City', 'Buhangin', 'Buhangin Mini Mart', 7.1047, 125.6269, 67890, 3.78, 'mini-mart'),
('Region XI', 'Tagum', 'Poblacion', 'Tagum Town Store', 7.4479, 125.8072, 34567, 1.89, 'sari-sari');