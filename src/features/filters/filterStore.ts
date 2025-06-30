import { create } from 'zustand';
import { FilterState, FilterOption } from '../types';
import { FilterDataService } from './services/filterDataService';

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
      
      let options: FilterOption[] = [];
      
      switch (filterType) {
        case 'region':
          options = await FilterDataService.getRegions();
          break;
        case 'city_municipality':
          if (parentFilters.region) {
            options = await FilterDataService.getCities(parentFilters.region);
          }
          break;
        case 'barangay':
          if (parentFilters.region && parentFilters.city_municipality) {
            options = await FilterDataService.getBarangays(
              parentFilters.region,
              parentFilters.city_municipality
            );
          }
          break;
        case 'client':
          options = await FilterDataService.getClients();
          break;
        case 'category':
          options = await FilterDataService.getCategories(parentFilters.client);
          break;
        case 'brand':
          options = await FilterDataService.getBrands(
            parentFilters.category,
            parentFilters.client
          );
          break;
        case 'sku':
          options = await FilterDataService.getSkus(
            parentFilters.brand,
            parentFilters.category,
            parentFilters.client
          );
          break;
        case 'year':
          options = await FilterDataService.getYears();
          break;
        case 'month':
          if (parentFilters.year) {
            options = await FilterDataService.getMonths(parentFilters.year);
          }
          break;
        default:
          options = [];
      }
      
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