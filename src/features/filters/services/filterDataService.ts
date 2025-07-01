import { supabase } from '../../../lib/supabase';

export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

export class FilterDataService {
  // Fetch regions with transaction counts
  static async getRegions(): Promise<FilterOption[]> {
    const { data, error } = await supabase
      .from('stores')
      .select('region')
      .not('region', 'is', null)
      .order('region');
    
    if (error) throw error;
    
    // Get unique regions with counts
    const regionCounts = data?.reduce((acc: Record<string, number>, store) => {
      const region = store.region?.trim();
      if (region) {
        acc[region] = (acc[region] || 0) + 1;
      }
      return acc;
    }, {}) || {};
    
    return Object.entries(regionCounts)
      .map(([region, count]) => ({
        value: region,
        label: region,
        count
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  // Fetch cities for a specific region
  static async getCities(region: string): Promise<FilterOption[]> {
    const { data, error } = await supabase
      .from('stores')
      .select('city_municipality')
      .eq('region', region)
      .not('city_municipality', 'is', null)
      .order('city_municipality');
    
    if (error) throw error;
    
    // Get unique cities with counts
    const cityCounts = data?.reduce((acc: Record<string, number>, store) => {
      const city = store.city_municipality?.trim();
      if (city) {
        acc[city] = (acc[city] || 0) + 1;
      }
      return acc;
    }, {}) || {};
    
    return Object.entries(cityCounts)
      .map(([city, count]) => ({
        value: city,
        label: city,
        count
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  // Fetch barangays for a specific city and region
  static async getBarangays(region: string, city: string): Promise<FilterOption[]> {
    const { data, error } = await supabase
      .from('stores')
      .select('barangay')
      .eq('region', region)
      .eq('city_municipality', city)
      .not('barangay', 'is', null)
      .order('barangay');
    
    if (error) throw error;
    
    // Get unique barangays with counts
    const barangayCounts = data?.reduce((acc: Record<string, number>, store) => {
      const barangay = store.barangay?.trim();
      if (barangay) {
        acc[barangay] = (acc[barangay] || 0) + 1;
      }
      return acc;
    }, {}) || {};
    
    return Object.entries(barangayCounts)
      .map(([barangay, count]) => ({
        value: barangay,
        label: barangay,
        count
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  // Fetch clients (advertising/marketing clients like TBWA)
  static async getClients(): Promise<FilterOption[]> {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        client_name,
        client_brands(brand_id)
      `)
      .eq('is_active', true)
      .order('client_name');
    
    if (error) throw error;
    
    return (data || []).map(client => ({
      value: client.client_name,
      label: client.client_name,
      count: client.client_brands?.length || 0
    }));
  }

  // Fetch categories (optionally filtered by client)
  static async getCategories(client?: string): Promise<FilterOption[]> {
    if (!client) {
      // If no client selected, return all categories
      const { data, error } = await supabase
        .from('product_categories')
        .select('category_id, category_name')
        .order('category_name');
      
      if (error) throw error;
      
      return (data || []).map(category => ({
        value: category.category_name,
        label: category.category_name,
        count: 0 // Would need transaction count
      }));
    }
    
    // If client is selected, get categories through client_brands relationship
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select(`
        id,
        client_brands(
          brand_id,
          brands(
            id,
            brand_name,
            products(
              category_id,
              product_categories(category_id, category_name)
            )
          )
        )
      `)
      .eq('client_name', client)
      .single();
    
    if (clientError) throw clientError;
    
    // Extract unique categories from client's brands
    const categoryCounts: Record<string, { name: string; count: number }> = {};
    
    clientData?.client_brands?.forEach(cb => {
      cb.brands?.products?.forEach(product => {
        const categoryId = product.category_id;
        const categoryName = product.product_categories?.category_name;
        if (categoryId && categoryName) {
          if (!categoryCounts[categoryId]) {
            categoryCounts[categoryId] = { name: categoryName, count: 0 };
          }
          categoryCounts[categoryId].count++;
        }
      });
    });
    
    return Object.entries(categoryCounts)
      .map(([categoryId, { name, count }]) => ({
        value: name,
        label: name,
        count
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  // Fetch brands (optionally filtered by category and/or client)
  static async getBrands(category?: string, client?: string): Promise<FilterOption[]> {
    // If client is specified, get brands through client_brands relationship
    if (client) {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select(`
          id,
          client_brands(
            brand_id,
            brands(
              id,
              brand_name,
              products(
                product_id,
                product_name,
                product_categories(category_name)
              )
            )
          )
        `)
        .eq('client_name', client)
        .single();
      
      if (clientError) throw clientError;
      
      // Extract brands and filter by category if specified
      const brandCounts: Record<string, { name: string; count: number }> = {};
      
      clientData?.client_brands?.forEach(cb => {
        const brand = cb.brands;
        if (brand) {
          // If category filter is applied, check if brand has products in that category
          if (category) {
            const hasCategory = brand.products?.some(p => 
              p.product_categories?.category_name === category
            );
            if (!hasCategory) return;
          }
          
          const productCount = category 
            ? brand.products?.filter(p => p.product_categories?.category_name === category).length || 0
            : brand.products?.length || 0;
          
          brandCounts[brand.id] = {
            name: brand.brand_name,
            count: productCount
          };
        }
      });
      
      return Object.entries(brandCounts)
        .map(([brandId, { name, count }]) => ({
          value: name,
          label: name,
          count
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }
    
    // If no client specified but category is, get all brands in that category
    if (category) {
      const { data, error } = await supabase
        .from('products')
        .select(`
          brand_id,
          brands(brand_id, brand_name),
          product_categories(category_name)
        `)
        .eq('product_categories.category_name', category);
      
      if (error) throw error;
      
      // Get unique brands with counts
      const brandCounts = (data || []).reduce((acc: Record<string, { name: string; count: number }>, product) => {
        const brandId = product.brand_id;
        const brandName = product.brands?.brand_name;
        if (brandId && brandName) {
          if (!acc[brandId]) {
            acc[brandId] = { name: brandName, count: 0 };
          }
          acc[brandId].count++;
        }
        return acc;
      }, {});
      
      return Object.entries(brandCounts)
        .map(([brandId, { name, count }]) => ({
          value: name,
          label: name,
          count
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }
    
    // No filters, return all brands
    const { data, error } = await supabase
      .from('brands')
      .select('brand_id, brand_name')
      .order('brand_name');
    
    if (error) throw error;
    
    return (data || []).map(brand => ({
      value: brand.brand_name,
      label: brand.brand_name,
      count: 0
    }));
  }

  // Fetch SKUs (filtered by brand, category, and/or client)
  static async getSkus(brand?: string, category?: string, client?: string): Promise<FilterOption[]> {
    // Build query based on filters
    let query = supabase
      .from('products')
      .select(`
        product_id,
        product_name,
        sku,
        brands(brand_id, brand_name),
        product_categories(category_name)
      `)
      .order('product_name')
      .limit(200);
    
    // If client is specified, we need to filter through client_brands
    if (client) {
      // First get the client's brands
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select(`
          id,
          client_brands(
            brand_id,
            brands(id, brand_name)
          )
        `)
        .eq('client_name', client)
        .single();
      
      if (clientError) throw clientError;
      
      // Get list of brand IDs for this client
      const clientBrandIds = clientData?.client_brands?.map(cb => cb.brand_id) || [];
      
      if (clientBrandIds.length === 0) return [];
      
      // Add brand filter to main query
      query = query.in('brand_id', clientBrandIds);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Filter in JavaScript for additional criteria
    let filteredData = data || [];
    
    if (brand) {
      filteredData = filteredData.filter(product => 
        product.brands?.brand_name === brand
      );
    }
    if (category) {
      filteredData = filteredData.filter(product => 
        product.product_categories?.category_name === category
      );
    }
    
    // Limit to 100 after filtering
    filteredData = filteredData.slice(0, 100);
    
    return filteredData.map(product => ({
      value: product.sku || product.product_name,
      label: product.product_name,
      count: 1 // Would need transaction count
    }));
  }

  // Fetch years from transactions
  static async getYears(): Promise<FilterOption[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('datetime')
      .not('datetime', 'is', null)
      .order('datetime', { ascending: false })
      .limit(10000); // Limit to prevent huge queries
    
    if (error) throw error;
    
    // Extract unique years
    const yearCounts = data?.reduce((acc: Record<string, number>, transaction) => {
      if (transaction.datetime) {
        const year = new Date(transaction.datetime).getFullYear().toString();
        acc[year] = (acc[year] || 0) + 1;
      }
      return acc;
    }, {}) || {};
    
    return Object.entries(yearCounts)
      .map(([year, count]) => ({
        value: year,
        label: year,
        count
      }))
      .sort((a, b) => b.value.localeCompare(a.value));
  }

  // Fetch months for a specific year
  static async getMonths(year: string): Promise<FilterOption[]> {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    const { data, error } = await supabase
      .from('transactions')
      .select('datetime')
      .gte('datetime', startDate)
      .lte('datetime', endDate);
    
    if (error) throw error;
    
    // Extract unique months
    const monthCounts = data?.reduce((acc: Record<string, number>, transaction) => {
      const date = new Date(transaction.datetime);
      const month = date.toLocaleString('default', { month: 'long' });
      const monthKey = `${date.getMonth() + 1}-${month}`;
      acc[monthKey] = (acc[monthKey] || 0) + 1;
      return acc;
    }, {}) || {};
    
    return Object.entries(monthCounts)
      .map(([monthKey, count]) => {
        const [monthNum, monthName] = monthKey.split('-');
        return {
          value: monthNum.padStart(2, '0'),
          label: monthName,
          count
        };
      })
      .sort((a, b) => a.value.localeCompare(b.value));
  }
}