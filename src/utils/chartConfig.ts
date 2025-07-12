// Consistent color palette for all charts - colorblind friendly
export const CHART_COLORS = {
  primary: ['#2563eb', '#7c3aed', '#dc2626', '#059669', '#d97706', '#7c2d12'],
  gender: {
    male: '#2563eb',
    female: '#ec4899',
    unknown: '#9ca3af'
  },
  categories: {
    shampoo: '#8b5cf6',
    cigarettes: '#f59e0b',
    snacks: '#10b981',
    beverages: '#3b82f6',
    essentials: '#ef4444'
  },
  gradient: {
    low: '#dbeafe',
    medium: '#93c5fd',
    high: '#3b82f6',
    veryHigh: '#1e40af'
  },
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  neutral: '#6b7280'
};

// Common chart configuration
export const CHART_CONFIG = {
  margin: { top: 20, right: 30, bottom: 40, left: 60 },
  animation: {
    duration: 300,
    easing: 'ease-out'
  },
  tooltip: {
    contentStyle: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      border: '1px solid #e5e7eb',
      borderRadius: '0.375rem',
      padding: '0.5rem'
    }
  }
};

// Format functions
export const formatters = {
  percentage: (value: number) => `${value.toFixed(1)}%`,
  currency: (value: number) => `₱${value.toLocaleString()}`,
  number: (value: number) => value.toLocaleString(),
  compact: (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  }
};