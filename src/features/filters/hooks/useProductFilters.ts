import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

// Hook to fetch clients/brands
export const useClients = () => {
  return useQuery({
    queryKey: ['filter-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('brand_id, brands(brand_name)')
        .order('brands(brand_name)');
      
      if (error) throw error;
      
      // Get unique brands with counts
      const brandCounts = data?.reduce((acc: Record<string, { name: string; count: number }>, product) => {
        const brandId = product.brand_id;
        const brandName = product.brands?.brand_name;
        if (brandId && brandName) {
          if (!acc[brandId]) {
            acc[brandId] = { name: brandName, count: 0 };
          }
          acc[brandId].count++;
        }
        return acc;
      }, {}) || {};
      
      // Convert to options format
      const options: FilterOption[] = Object.entries(brandCounts).map(([brandId, { name, count }]) => ({
        value: name,
        label: name,
        count
      }));
      
      return options.sort((a, b) => a.label.localeCompare(b.label));
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Hook to fetch categories based on selected client/brand
export const useCategories = (client?: string) => {
  return useQuery({
    queryKey: ['filter-categories', client],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('category_id, product_categories(category_name), brands(brand_name)');
      
      if (client) {
        query = query.eq('brands.brand_name', client);
      }
      
      const { data, error } = await query.order('product_categories(category_name)');
      
      if (error) throw error;
      
      // Get unique categories with counts
      const categoryCounts = data?.reduce((acc: Record<string, { name: string; count: number }>, product) => {
        const categoryId = product.category_id;
        const categoryName = product.product_categories?.category_name;
        if (categoryId && categoryName) {
          if (!acc[categoryId]) {
            acc[categoryId] = { name: categoryName, count: 0 };
          }
          acc[categoryId].count++;
        }
        return acc;
      }, {}) || {};
      
      // Convert to options format
      const options: FilterOption[] = Object.entries(categoryCounts).map(([categoryId, { name, count }]) => ({
        value: name,
        label: name,
        count
      }));
      
      return options.sort((a, b) => a.label.localeCompare(b.label));
    },
    enabled: true, // Always enabled, filters if client is provided
    staleTime: 5 * 60 * 1000,
  });
};

// Hook to fetch brands based on selected category
export const useBrands = (client?: string, category?: string) => {
  return useQuery({
    queryKey: ['filter-brands', client, category],
    queryFn: async () => {
      if (!category) return [];
      
      let query = supabase
        .from('products')
        .select('brand_id, brands(brand_name), product_categories(category_name)');
      
      if (client) {
        query = query.eq('brands.brand_name', client);
      }
      
      query = query.eq('product_categories.category_name', category);
      
      const { data, error } = await query.order('brands(brand_name)');
      
      if (error) throw error;
      
      // Get unique brands with counts
      const brandCounts = data?.reduce((acc: Record<string, { name: string; count: number }>, product) => {
        const brandId = product.brand_id;
        const brandName = product.brands?.brand_name;
        if (brandId && brandName) {
          if (!acc[brandId]) {
            acc[brandId] = { name: brandName, count: 0 };
          }
          acc[brandId].count++;
        }
        return acc;
      }, {}) || {};
      
      // Convert to options format
      const options: FilterOption[] = Object.entries(brandCounts).map(([brandId, { name, count }]) => ({
        value: name,
        label: name,
        count
      }));
      
      return options.sort((a, b) => a.label.localeCompare(b.label));
    },
    enabled: !!category,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook to fetch SKUs based on selected brand and category
export const useSkus = (client?: string, category?: string, brand?: string) => {
  return useQuery({
    queryKey: ['filter-skus', client, category, brand],
    queryFn: async () => {
      if (!brand || !category) return [];
      
      let query = supabase
        .from('products')
        .select('product_id, product_name, brands(brand_name), product_categories(category_name)');
      
      if (client) {
        query = query.eq('brands.brand_name', client);
      }
      
      query = query
        .eq('product_categories.category_name', category)
        .eq('brands.brand_name', brand)
        .order('product_name');
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Convert to options format
      const options: FilterOption[] = (data || []).map(product => ({
        value: product.product_name,
        label: product.product_name,
        count: 1 // We don't have transaction counts here, would need to join with transaction_items
      }));
      
      return options;
    },
    enabled: !!category && !!brand,
    staleTime: 5 * 60 * 1000,
  });
};