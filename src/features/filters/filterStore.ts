import { create } from 'zustand';
import { FilterState, FilterOption } from '../types';

interface FilterStore extends FilterState {
  // Filter options
  filterOptions: Record<string, FilterOption[]>;
  totalCombinations: number;
  isLoading: boolean;
  
  // Actions
  setFilter: (key: keyof FilterState, value: string) => void;
  clearFilters: () => void;
  clearHierarchy: (hierarchy: 'geography' | 'organization' | 'time') => void;
  loadFilterOptions: (filterType: string, parentFilters?: Partial<FilterState>) => Promise<void>;
  getTotalCombinations: () => Promise<void>;
  applyPreset: (preset: Partial<FilterState>) => void;
}

const initialState: FilterState = {
  region: '',
  city_municipality: '',
  barangay: '',
  client: '',
  category: '',
  brand: '',
  sku: '',
  year: '',
  month: '',
  week: '',
  day_of_week: '',
  hour: '',
  date_from: '',
  date_to: '',
};

export const useFilterStore = create<FilterStore>((set, get) => ({
  ...initialState,
  filterOptions: {},
  totalCombinations: 0,
  isLoading: false,

  setFilter: (key, value) => {
    const state = get();
    const newState = { ...state, [key]: value };

    // Clear downstream filters in the same hierarchy
    if (key === 'region') {
      newState.city_municipality = '';
      newState.barangay = '';
    } else if (key === 'city_municipality') {
      newState.barangay = '';
    } else if (key === 'client') {
      newState.category = '';
      newState.brand = '';
      newState.sku = '';
    } else if (key === 'category') {
      newState.brand = '';
      newState.sku = '';
    } else if (key === 'brand') {
      newState.sku = '';
    } else if (key === 'year') {
      newState.month = '';
      newState.week = '';
      newState.day_of_week = '';
      newState.hour = '';
    } else if (key === 'month') {
      newState.week = '';
      newState.day_of_week = '';
      newState.hour = '';
    }

    set(newState);

    // Trigger global filter change event
    window.dispatchEvent(new CustomEvent('globalFiltersChanged', {
      detail: { filters: newState, changedLevel: key }
    }));
  },

  clearFilters: () => {
    set(initialState);
    window.dispatchEvent(new CustomEvent('globalFiltersChanged', {
      detail: { filters: initialState, changedLevel: 'all' }
    }));
  },

  clearHierarchy: (hierarchy) => {
    const state = get();
    const newState = { ...state };

    if (hierarchy === 'geography') {
      newState.region = '';
      newState.city_municipality = '';
      newState.barangay = '';
    } else if (hierarchy === 'organization') {
      newState.client = '';
      newState.category = '';
      newState.brand = '';
      newState.sku = '';
    } else if (hierarchy === 'time') {
      newState.year = '';
      newState.month = '';
      newState.week = '';
      newState.day_of_week = '';
      newState.hour = '';
    }

    set(newState);
  },

  loadFilterOptions: async (filterType, parentFilters = {}) => {
    try {
      set({ isLoading: true });
      
      // Mock data for development - replace with actual API call
      const mockOptions: Record<string, FilterOption[]> = {
        region: [
          { value: 'NCR', label: 'National Capital Region', count: 15420 },
          { value: 'Region III', label: 'Central Luzon', count: 8930 },
          { value: 'Region IV-A', label: 'CALABARZON', count: 12100 },
          { value: 'Region VI', label: 'Western Visayas', count: 7650 },
          { value: 'Region VII', label: 'Central Visayas', count: 9200 },
          { value: 'Region XI', label: 'Davao Region', count: 6800 },
        ],
        client: [
          { value: 'Adidas', label: 'Adidas', count: 8200 },
          { value: 'Alaska Milk Corporation', label: 'Alaska Milk Corporation', count: 12500 },
          { value: 'Liwayway Marketing', label: 'Liwayway Marketing (Oishi)', count: 18700 },
          { value: 'Peerless Products', label: 'Peerless Products', count: 9400 },
          { value: 'Del Monte Philippines', label: 'Del Monte Philippines', count: 11200 },
        ],
        category: [
          { value: 'Beverages', label: 'Beverages', count: 22100 },
          { value: 'Snacks', label: 'Snacks', count: 18900 },
          { value: 'Dairy', label: 'Dairy', count: 15600 },
          { value: 'Personal Care', label: 'Personal Care', count: 12300 },
          { value: 'Home Care', label: 'Home Care', count: 8900 },
          { value: 'Food', label: 'Food', count: 14200 },
        ],
        year: [
          { value: '2024', label: '2024', count: 48500 },
          { value: '2023', label: '2023', count: 42300 },
        ],
      };

      const options = mockOptions[filterType] || [];
      
      set(state => ({
        filterOptions: {
          ...state.filterOptions,
          [filterType]: options
        },
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to load filter options:', error);
      set({ isLoading: false });
    }
  },

  getTotalCombinations: async () => {
    try {
      // Mock calculation - replace with actual API call
      const filters = get();
      const appliedFilters = Object.values(filters).filter(v => v && typeof v === 'string' && v !== '').length;
      const mockTotal = Math.max(1000000 - (appliedFilters * 85000), 1000);
      
      set({ totalCombinations: mockTotal });
    } catch (error) {
      console.error('Failed to calculate total combinations:', error);
    }
  },

  applyPreset: (preset) => {
    const state = get();
    set({ ...state, ...preset });
  },
}));