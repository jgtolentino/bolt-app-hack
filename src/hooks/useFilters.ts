import { useFilterStore } from '@features/filters/filterStore';

export function useFilters() {
  const filters = useFilterStore();
  
  // Prepare advanced filter format for Command Center
  const advanced = {
    flags: Object.entries(filters)
      .filter(([key, value]) => value && key !== 'setFilter' && key !== 'clearFilters' && key !== 'loadFilterOptions')
      .map(([key, value]) => `${key}:${value}`),
    conjunction: 'AND' as const,
  };

  return {
    ...filters,
    advanced,
  };
}

export default useFilters;