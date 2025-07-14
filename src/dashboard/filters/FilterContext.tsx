/**
 * Scout Dash 2.0 - Filter Context
 * React context for managing dashboard-wide filters and cross-chart interactions
 */

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { GlobalFilterConfig, FilterChangeEvent, SelectionChangeEvent, DashboardEvent } from '../types';

export interface FilterState {
  // Global filters
  globalFilters: Record<string, any>;
  
  // Cross-chart selections
  selections: Record<string, any>; // visualId -> selection data
  
  // Filter configuration
  filterConfigs: GlobalFilterConfig[];
  
  // Event history (for debugging)
  eventHistory: DashboardEvent[];
}

export interface FilterContextType {
  state: FilterState;
  
  // Filter actions
  setGlobalFilter: (filterId: string, value: any) => void;
  clearGlobalFilter: (filterId: string) => void;
  clearAllFilters: () => void;
  
  // Selection actions
  setSelection: (visualId: string, selection: any, field?: string) => void;
  clearSelection: (visualId: string) => void;
  clearAllSelections: () => void;
  
  // Filter configuration
  setFilterConfigs: (configs: GlobalFilterConfig[]) => void;
  
  // Event system
  emitEvent: (event: DashboardEvent) => void;
  getActiveFilters: () => Array<{ id: string; field: string; value: any; operator: string }>;
  
  // Utilities
  isFiltered: (field: string) => boolean;
  getFilterValue: (field: string) => any;
  getSelectionForVisual: (visualId: string) => any;
}

type FilterAction =
  | { type: 'SET_GLOBAL_FILTER'; payload: { filterId: string; value: any } }
  | { type: 'CLEAR_GLOBAL_FILTER'; payload: { filterId: string } }
  | { type: 'CLEAR_ALL_FILTERS' }
  | { type: 'SET_SELECTION'; payload: { visualId: string; selection: any; field?: string } }
  | { type: 'CLEAR_SELECTION'; payload: { visualId: string } }
  | { type: 'CLEAR_ALL_SELECTIONS' }
  | { type: 'SET_FILTER_CONFIGS'; payload: { configs: GlobalFilterConfig[] } }
  | { type: 'ADD_EVENT'; payload: { event: DashboardEvent } };

const initialState: FilterState = {
  globalFilters: {},
  selections: {},
  filterConfigs: [],
  eventHistory: []
};

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SET_GLOBAL_FILTER':
      return {
        ...state,
        globalFilters: {
          ...state.globalFilters,
          [action.payload.filterId]: action.payload.value
        }
      };

    case 'CLEAR_GLOBAL_FILTER':
      const { [action.payload.filterId]: _, ...remainingFilters } = state.globalFilters;
      return {
        ...state,
        globalFilters: remainingFilters
      };

    case 'CLEAR_ALL_FILTERS':
      // Keep required filters
      const requiredFilters = Object.keys(state.globalFilters).reduce((acc, filterId) => {
        const config = state.filterConfigs.find(c => c.id === filterId);
        if (config?.required) {
          acc[filterId] = state.globalFilters[filterId];
        }
        return acc;
      }, {} as Record<string, any>);

      return {
        ...state,
        globalFilters: requiredFilters
      };

    case 'SET_SELECTION':
      return {
        ...state,
        selections: {
          ...state.selections,
          [action.payload.visualId]: {
            data: action.payload.selection,
            field: action.payload.field,
            timestamp: new Date()
          }
        }
      };

    case 'CLEAR_SELECTION':
      const { [action.payload.visualId]: __, ...remainingSelections } = state.selections;
      return {
        ...state,
        selections: remainingSelections
      };

    case 'CLEAR_ALL_SELECTIONS':
      return {
        ...state,
        selections: {}
      };

    case 'SET_FILTER_CONFIGS':
      return {
        ...state,
        filterConfigs: action.payload.configs
      };

    case 'ADD_EVENT':
      return {
        ...state,
        eventHistory: [action.payload.event, ...state.eventHistory.slice(0, 99)] // Keep last 100 events
      };

    default:
      return state;
  }
}

const FilterContext = createContext<FilterContextType | null>(null);

export interface FilterProviderProps {
  children: ReactNode;
  initialFilters?: Record<string, any>;
  initialConfigs?: GlobalFilterConfig[];
}

export const FilterProvider: React.FC<FilterProviderProps> = ({
  children,
  initialFilters = {},
  initialConfigs = []
}) => {
  const [state, dispatch] = useReducer(filterReducer, {
    ...initialState,
    globalFilters: initialFilters,
    filterConfigs: initialConfigs
  });

  const setGlobalFilter = useCallback((filterId: string, value: any) => {
    dispatch({ type: 'SET_GLOBAL_FILTER', payload: { filterId, value } });
    
    // Emit filter change event
    const config = state.filterConfigs.find(c => c.id === filterId);
    if (config) {
      const event: FilterChangeEvent = {
        type: 'filter:change',
        source: 'filter-manager',
        data: {
          filterId,
          field: config.field,
          value,
          operator: 'eq' // Default operator, could be enhanced
        },
        timestamp: new Date()
      };
      
      dispatch({ type: 'ADD_EVENT', payload: { event } });
    }
  }, [state.filterConfigs]);

  const clearGlobalFilter = useCallback((filterId: string) => {
    dispatch({ type: 'CLEAR_GLOBAL_FILTER', payload: { filterId } });
  }, []);

  const clearAllFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_FILTERS' });
  }, []);

  const setSelection = useCallback((visualId: string, selection: any, field?: string) => {
    dispatch({ type: 'SET_SELECTION', payload: { visualId, selection, field } });
    
    // Emit selection change event
    const event: SelectionChangeEvent = {
      type: 'selection:change',
      source: visualId,
      data: {
        selected: Array.isArray(selection) ? selection : [selection],
        field: field || 'unknown'
      },
      timestamp: new Date()
    };
    
    dispatch({ type: 'ADD_EVENT', payload: { event } });
  }, []);

  const clearSelection = useCallback((visualId: string) => {
    dispatch({ type: 'CLEAR_SELECTION', payload: { visualId } });
  }, []);

  const clearAllSelections = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_SELECTIONS' });
  }, []);

  const setFilterConfigs = useCallback((configs: GlobalFilterConfig[]) => {
    dispatch({ type: 'SET_FILTER_CONFIGS', payload: { configs } });
  }, []);

  const emitEvent = useCallback((event: DashboardEvent) => {
    dispatch({ type: 'ADD_EVENT', payload: { event } });
  }, []);

  const getActiveFilters = useCallback(() => {
    return Object.entries(state.globalFilters)
      .filter(([_, value]) => value != null)
      .map(([filterId, value]) => {
        const config = state.filterConfigs.find(c => c.id === filterId);
        return {
          id: filterId,
          field: config?.field || filterId,
          value,
          operator: getOperatorForType(config?.type || 'select', value)
        };
      });
  }, [state.globalFilters, state.filterConfigs]);

  const isFiltered = useCallback((field: string) => {
    const config = state.filterConfigs.find(c => c.field === field);
    if (!config) return false;
    
    const value = state.globalFilters[config.id];
    return value != null && (Array.isArray(value) ? value.length > 0 : true);
  }, [state.globalFilters, state.filterConfigs]);

  const getFilterValue = useCallback((field: string) => {
    const config = state.filterConfigs.find(c => c.field === field);
    return config ? state.globalFilters[config.id] : null;
  }, [state.globalFilters, state.filterConfigs]);

  const getSelectionForVisual = useCallback((visualId: string) => {
    return state.selections[visualId]?.data || null;
  }, [state.selections]);

  const value: FilterContextType = {
    state,
    setGlobalFilter,
    clearGlobalFilter,
    clearAllFilters,
    setSelection,
    clearSelection,
    clearAllSelections,
    setFilterConfigs,
    emitEvent,
    getActiveFilters,
    isFiltered,
    getFilterValue,
    getSelectionForVisual
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = (): FilterContextType => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};

// Helper function to determine operator based on filter type
function getOperatorForType(type: string, value: any): string {
  switch (type) {
    case 'multiselect':
      return 'in';
    case 'range':
      return Array.isArray(value) && value.length === 2 ? 'between' : 'eq';
    case 'text':
      return 'like';
    case 'date':
      return 'eq';
    default:
      return 'eq';
  }
}

export default FilterProvider;