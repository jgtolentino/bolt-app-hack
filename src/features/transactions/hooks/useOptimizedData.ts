import React from 'react';
import { useQuery, useQueries, UseQueryResult } from '@tanstack/react-query';
import { optimizedDataService, DashboardMetrics } from '../optimizedDataService';
import { subDays } from 'date-fns';

interface DataFilters {
  dateFrom?: Date;
  dateTo?: Date;
  region?: string;
  storeId?: string;
}

// Query keys
const queryKeys = {
  dashboard: (filters?: DataFilters) => ['dashboard', filters || {}],
  kpi: (filters?: DataFilters) => ['kpi', filters || {}],
  salesTrend: (filters?: DataFilters) => ['salesTrend', filters || {}],
  products: (filters?: DataFilters) => ['products', filters || {}],
  regions: (filters?: DataFilters) => ['regions', filters || {}],
};

// Custom hook for dashboard data
export function useDashboardData(filters?: DataFilters) {
  return useQuery({
    queryKey: queryKeys.dashboard(filters),
    queryFn: () => optimizedDataService.getDashboardMetrics(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    refetchIntervalInBackground: true,
  });
}

// Hook for real-time updates
export function useRealtimeData<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: {
    refetchInterval?: number;
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey,
    queryFn,
    refetchInterval: options?.refetchInterval || 30000, // 30 seconds default
    refetchIntervalInBackground: true,
    enabled: options?.enabled !== false,
  });
}

// Hook for multiple queries in parallel
export function useParallelQueries<T extends Record<string, any>>(
  queries: Array<{
    key: string;
    queryKey: string[];
    queryFn: () => Promise<any>;
    enabled?: boolean;
  }>
): Record<keyof T, UseQueryResult> {
  const results = useQueries({
    queries: queries.map(query => ({
      queryKey: query.queryKey,
      queryFn: query.queryFn,
      enabled: query.enabled !== false,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    })),
  });

  const resultMap: any = {};
  queries.forEach((query, index) => {
    resultMap[query.key] = results[index];
  });

  return resultMap;
}

// Prefetch dashboard data
export function usePrefetchDashboard() {
  const prefetch = async (filters?: DataFilters) => {
    await optimizedDataService.getDashboardMetrics(filters);
  };

  return prefetch;
}

// Hook for incremental data loading
export function useIncrementalData<T>(
  baseQueryKey: string[],
  fetchFn: (page: number, pageSize: number) => Promise<T[]>,
  pageSize = 20
) {
  const [page, setPage] = React.useState(0);
  const [allData, setAllData] = React.useState<T[]>([]);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: [...baseQueryKey, page],
    queryFn: () => fetchFn(page, pageSize),
    keepPreviousData: true,
  });

  React.useEffect(() => {
    if (data) {
      setAllData(prev => [...prev, ...data]);
    }
  }, [data]);

  const loadMore = () => {
    if (!isFetching && data && data.length === pageSize) {
      setPage(prev => prev + 1);
    }
  };

  const hasMore = data && data.length === pageSize;

  return {
    data: allData,
    isLoading,
    isFetching,
    error,
    loadMore,
    hasMore,
  };
}

// Hook for optimistic updates
export function useOptimisticUpdate<T>(
  queryKey: string[],
  updateFn: (data: T) => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: any) => void;
  }
) {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: updateFn,
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update
      queryClient.setQueryData(queryKey, newData);

      return { previousData };
    },
    onError: (err, newData, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      options?.onError?.(err);
    },
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return mutation;
}

// Export commonly used date ranges
export const dateRanges = {
  today: () => ({
    dateFrom: startOfDay(new Date()),
    dateTo: endOfDay(new Date()),
  }),
  yesterday: () => ({
    dateFrom: startOfDay(subDays(new Date(), 1)),
    dateTo: endOfDay(subDays(new Date(), 1)),
  }),
  last7Days: () => ({
    dateFrom: startOfDay(subDays(new Date(), 7)),
    dateTo: endOfDay(new Date()),
  }),
  last30Days: () => ({
    dateFrom: startOfDay(subDays(new Date(), 30)),
    dateTo: endOfDay(new Date()),
  }),
  thisMonth: () => ({
    dateFrom: startOfMonth(new Date()),
    dateTo: endOfDay(new Date()),
  }),
  lastMonth: () => {
    const lastMonth = subMonths(new Date(), 1);
    return {
      dateFrom: startOfMonth(lastMonth),
      dateTo: endOfMonth(lastMonth),
    };
  },
};

// Missing imports
import React from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from 'date-fns';