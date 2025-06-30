import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import OptimizedDashboard from '../pages/OptimizedDashboard';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the data hooks
vi.mock('../features/transactions/hooks/useOptimizedData', () => ({
  useDashboardData: () => ({
    data: {
      totalRevenue: 125000,
      totalTransactions: 850,
      avgOrderValue: 147,
      conversionRate: 3.2,
      topProducts: [],
      topCategories: [],
      salesByDate: [],
      hourlyTransactions: []
    },
    isLoading: false,
    error: null
  })
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false }
  }
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </QueryClientProvider>
);

describe('KPI Grid Layout', () => {
  it('should display KPI cards in 4-column grid on desktop', () => {
    render(<OptimizedDashboard />, { wrapper });
    
    // Find the KPI section
    const kpiSection = screen.getByTestId('kpi-row');
    
    // Check it has grid display
    expect(kpiSection).toHaveClass('grid');
    expect(kpiSection).toHaveClass('grid-cols-12');
    
    // Check KPI cards have correct column spans
    const kpiCards = screen.getAllByTestId(/kpi-card/);
    expect(kpiCards).toHaveLength(4);
    
    kpiCards.forEach((card) => {
      expect(card).toHaveClass('col-span-3');
      expect(card).toHaveClass('md:col-span-6');
      expect(card).toHaveClass('sm:col-span-12');
    });
  });
  
  it('should not have width-forcing classes on KPI cards', () => {
    render(<OptimizedDashboard />, { wrapper });
    
    const kpiCards = screen.getAllByTestId(/kpi-card/);
    
    kpiCards.forEach((card) => {
      // Should NOT have these classes
      expect(card).not.toHaveClass('w-full');
      expect(card).not.toHaveClass('flex-1');
    });
  });
});