/*
  # Add All 18 Philippine Regions to Geography Table (Fixed)
  
  This migration ensures all 18 Philippine regions are represented in the geography table
  with proper stores and locations for comprehensive coverage.
  
  Fixed version that handles duplicates properly.
*/

-- First, check if the constraint exists and create it if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_geography_location'
  ) THEN
    ALTER TABLE geography ADD CONSTRAINT unique_geography_location 
    UNIQUE (region, city_municipality, barangay);
  END IF;
END $$;

-- Now insert data with proper conflict handling
INSERT INTO geography (region, city_municipality, barangay, store_name, latitude, longitude, population, area_sqkm, store_type) VALUES
-- Region I - Ilocos Region
('Region I', 'Vigan City', 'Poblacion', 'Vigan Central Store', 17.5749, 120.3868, 53879, 25.13, 'sari-sari'),
('Region I', 'Vigan City', 'Bantay', 'Bantay Mart', 17.5834, 120.3912, 34521, 18.45, 'grocery'),
('Region I', 'Laoag City', 'Brgy 1', 'Laoag Express Mart', 18.1984, 120.5935, 111125, 116.08, 'grocery'),
('Region I', 'Laoag City', 'Brgy 30', 'Laoag North Store', 18.2156, 120.6012, 45678, 34.21, 'mini-mart'),
('Region I', 'San Fernando', 'Poblacion', 'La Union Mart', 16.6159, 120.3173, 121812, 102.72, 'mini-mart'),
('Region I', 'San Fernando', 'Catbangen', 'Catbangen Store', 16.6234, 120.3256, 23456, 15.78, 'sari-sari'),

-- Region II - Cagayan Valley
('Region II', 'Tuguegarao City', 'Centro', 'Tuguegarao Central', 17.6132, 121.7270, 166334, 144.80, 'grocery'),
('Region II', 'Tuguegarao City', 'Pallua', 'Pallua Express', 17.6423, 121.7512, 34567, 23.45, 'sari-sari'),
('Region II', 'Santiago City', 'Centro East', 'Santiago Express', 16.6872, 121.5487, 134830, 255.51, 'sari-sari'),
('Region II', 'Santiago City', 'Baluarte', 'Baluarte Mart', 16.6923, 121.5567, 45678, 34.56, 'mini-mart'),
('Region II', 'Cauayan City', 'District 1', 'Cauayan Mart', 16.9298, 121.7790, 143403, 336.40, 'convenience'),
('Region II', 'Cauayan City', 'San Fermin', 'San Fermin Store', 16.9456, 121.7867, 23456, 18.90, 'sari-sari'),

-- Region IV-B - MIMAROPA
('Region IV-B', 'Puerto Princesa', 'Poblacion', 'Palawan Central Store', 9.7392, 118.7353, 307079, 2381.02, 'grocery'),
('Region IV-B', 'Puerto Princesa', 'San Pedro', 'San Pedro Mart', 9.7523, 118.7456, 45678, 123.45, 'mini-mart'),
('Region IV-B', 'Calapan City', 'Poblacion', 'Oriental Mindoro Mart', 13.4115, 121.1803, 145786, 250.06, 'sari-sari'),
('Region IV-B', 'Calapan City', 'Bayanan', 'Bayanan Store', 13.4234, 121.1912, 34567, 45.67, 'grocery'),

-- Region V - Bicol Region
('Region V', 'Legazpi City', 'Poblacion', 'Legazpi Central', 13.1391, 123.7438, 209533, 153.70, 'grocery'),
('Region V', 'Legazpi City', 'Bitano', 'Bitano Express', 13.1456, 123.7523, 45678, 23.45, 'sari-sari'),
('Region V', 'Naga City', 'Centro', 'Naga Express Mart', 13.6192, 123.1814, 209170, 84.48, 'convenience'),
('Region V', 'Naga City', 'Tinago', 'Tinago Store', 13.6278, 123.1923, 34567, 12.34, 'mini-mart'),
('Region V', 'Masbate City', 'Poblacion', 'Masbate Store', 12.3706, 123.6244, 104522, 178.76, 'sari-sari'),
('Region V', 'Masbate City', 'Centro', 'Masbate Central', 12.3789, 123.6312, 23456, 34.56, 'grocery'),

-- Region VIII - Eastern Visayas
('Region VIII', 'Tacloban City', 'Downtown', 'Tacloban Central', 11.2543, 125.0055, 251881, 201.72, 'grocery'),
('Region VIII', 'Tacloban City', 'San Jose', 'San Jose Mart', 11.2623, 125.0134, 45678, 34.56, 'mini-mart'),
('Region VIII', 'Ormoc City', 'Poblacion', 'Ormoc Express', 11.0064, 124.6075, 230998, 613.60, 'mini-mart'),
('Region VIII', 'Ormoc City', 'Cogon', 'Cogon Store', 11.0156, 124.6178, 34567, 45.67, 'sari-sari'),
('Region VIII', 'Calbayog City', 'Centro', 'Calbayog Mart', 12.0672, 124.5937, 186960, 903.14, 'sari-sari'),
('Region VIII', 'Calbayog City', 'Central', 'Central Calbayog', 12.0745, 124.6012, 23456, 67.89, 'grocery'),

-- Region IX - Zamboanga Peninsula
('Region IX', 'Zamboanga City', 'Centro', 'Zamboanga Central', 6.9214, 122.0790, 977234, 1483.38, 'grocery'),
('Region IX', 'Zamboanga City', 'Tetuan', 'Tetuan Express', 6.9312, 122.0867, 123456, 234.56, 'mini-mart'),
('Region IX', 'Pagadian City', 'Poblacion', 'Pagadian Express', 7.8257, 123.4378, 210452, 378.82, 'convenience'),
('Region IX', 'Pagadian City', 'Balangasan', 'Balangasan Store', 7.8345, 123.4456, 34567, 45.67, 'sari-sari'),
('Region IX', 'Dipolog City', 'Central', 'Dipolog Mart', 8.5897, 123.3401, 138141, 136.22, 'sari-sari'),
('Region IX', 'Dipolog City', 'Barra', 'Barra Store', 8.5978, 123.3489, 23456, 23.45, 'grocery'),

-- Region X - Northern Mindanao
('Region X', 'Cagayan de Oro', 'Centro', 'CDO Central Store', 8.4542, 124.6319, 728402, 412.80, 'grocery'),
('Region X', 'Cagayan de Oro', 'Carmen', 'Carmen Express', 8.4623, 124.6423, 89123, 67.89, 'mini-mart'),
('Region X', 'Iligan City', 'Poblacion', 'Iligan Express', 8.2280, 124.2452, 363115, 813.37, 'mini-mart'),
('Region X', 'Iligan City', 'Palao', 'Palao Mart', 8.2367, 124.2534, 45678, 56.78, 'sari-sari'),
('Region X', 'Malaybalay City', 'Poblacion', 'Bukidnon Central', 8.1575, 125.1334, 190712, 969.19, 'sari-sari'),
('Region X', 'Malaybalay City', 'Casisang', 'Casisang Store', 8.1656, 125.1423, 34567, 78.90, 'grocery'),

-- Region XII - SOCCSKSARGEN
('Region XII', 'General Santos', 'Poblacion', 'GenSan Central', 6.1164, 125.1716, 697315, 492.86, 'grocery'),
('Region XII', 'General Santos', 'Dadiangas', 'Dadiangas Mart', 6.1245, 125.1812, 78901, 67.89, 'mini-mart'),
('Region XII', 'Koronadal City', 'Poblacion', 'Koronadal Express', 6.5033, 124.8469, 195398, 277.00, 'convenience'),
('Region XII', 'Koronadal City', 'Zone III', 'Zone III Store', 6.5123, 124.8567, 34567, 45.67, 'sari-sari'),
('Region XII', 'Tacurong City', 'Poblacion', 'Tacurong Mart', 6.6929, 124.6750, 109319, 153.40, 'sari-sari'),
('Region XII', 'Tacurong City', 'New Isabela', 'Isabela Store', 6.7012, 124.6834, 23456, 34.56, 'grocery'),

-- Region XIII - Caraga
('Region XIII', 'Butuan City', 'Poblacion', 'Butuan Central', 8.9492, 125.5406, 372910, 816.62, 'grocery'),
('Region XIII', 'Butuan City', 'Libertad', 'Libertad Express', 8.9578, 125.5489, 56789, 78.90, 'mini-mart'),
('Region XIII', 'Surigao City', 'Centro', 'Surigao Express', 9.7839, 125.4890, 171107, 245.00, 'mini-mart'),
('Region XIII', 'Surigao City', 'Washington', 'Washington Store', 9.7923, 125.4978, 34567, 45.67, 'sari-sari'),
('Region XIII', 'Tandag City', 'Poblacion', 'Tandag Mart', 9.0730, 126.1985, 62669, 291.73, 'sari-sari'),
('Region XIII', 'Tandag City', 'Bag-ong Lungsod', 'Bag-ong Store', 9.0812, 126.2067, 23456, 56.78, 'grocery'),

-- CAR - Cordillera Administrative Region
('CAR', 'Baguio City', 'Session Road', 'Baguio Central', 16.4023, 120.5960, 366358, 57.49, 'grocery'),
('CAR', 'Baguio City', 'Burnham', 'Burnham Express', 16.4112, 120.5934, 45678, 12.34, 'convenience'),
('CAR', 'La Trinidad', 'Poblacion', 'Benguet Express', 16.4556, 120.5871, 137404, 69.08, 'sari-sari'),
('CAR', 'La Trinidad', 'Pico', 'Pico Mart', 16.4634, 120.5945, 34567, 23.45, 'mini-mart'),
('CAR', 'Tabuk City', 'Poblacion', 'Kalinga Mart', 17.4091, 121.4444, 121033, 700.25, 'mini-mart'),
('CAR', 'Tabuk City', 'Dagupan', 'Dagupan Store', 17.4178, 121.4523, 23456, 89.12, 'sari-sari'),

-- BARMM - Bangsamoro Autonomous Region
('BARMM', 'Cotabato City', 'Poblacion', 'Cotabato Central', 7.2047, 124.2310, 325079, 176.00, 'grocery'),
('BARMM', 'Cotabato City', 'Rosary Heights', 'Rosary Express', 7.2134, 124.2398, 45678, 34.56, 'mini-mart'),
('BARMM', 'Marawi City', 'Poblacion', 'Marawi Express', 7.9986, 124.2928, 207010, 87.55, 'sari-sari'),
('BARMM', 'Marawi City', 'Marinaut', 'Marinaut Store', 8.0067, 124.3012, 34567, 23.45, 'grocery'),
('BARMM', 'Jolo', 'Poblacion', 'Sulu Central Store', 6.0527, 121.0020, 125564, 126.40, 'mini-mart'),
('BARMM', 'Jolo', 'Walled City', 'Walled City Mart', 6.0612, 121.0098, 23456, 34.56, 'sari-sari'),

-- MIMAROPA (additional stores)
('MIMAROPA', 'Romblon', 'Poblacion', 'Romblon Store', 12.5778, 122.2691, 40554, 86.57, 'sari-sari'),
('MIMAROPA', 'Romblon', 'Lonos', 'Lonos Express', 12.5856, 122.2778, 12345, 23.45, 'grocery'),
('MIMAROPA', 'Boac', 'Poblacion', 'Marinduque Central', 13.4400, 121.8439, 57283, 212.95, 'grocery'),
('MIMAROPA', 'Boac', 'Bantad', 'Bantad Store', 13.4489, 121.8523, 23456, 45.67, 'mini-mart')
ON CONFLICT (region, city_municipality, barangay) DO UPDATE SET
  store_name = EXCLUDED.store_name,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  population = EXCLUDED.population,
  area_sqkm = EXCLUDED.area_sqkm,
  store_type = EXCLUDED.store_type,
  updated_at = now();

-- Update the view to show all regions
CREATE OR REPLACE VIEW v_regional_coverage AS
SELECT 
    g.region,
    COUNT(DISTINCT g.city_municipality) as cities,
    COUNT(DISTINCT g.barangay) as barangays,
    COUNT(DISTINCT g.id) as total_stores,
    COUNT(DISTINCT t.id) as total_transactions,
    COALESCE(SUM(t.total_amount), 0) as total_sales
FROM geography g
LEFT JOIN transactions t ON g.id = t.geography_id
GROUP BY g.region
ORDER BY g.region;