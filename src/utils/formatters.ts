/**
 * Central formatters for consistent data presentation
 * Following Rule #4: Consistent units & prefixes
 * Rule #7: Avoid doublespeak axis labels
 */

// Currency formatter - always use ₱ symbol for PHP
export const formatCurrency = (value: number | null | undefined, decimals = 2): string => {
  if (value === null || value === undefined) return '₱0';
  
  // For axis labels, ensure consistency with compact format
  return `₱${value.toLocaleString('en-PH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
};

// Compact currency formatter for charts - Rule #7: Consistent axis labels
export const formatCurrencyCompact = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '₱0';
  
  // Ensure consistent formatting: ₱1K, ₱1M, ₱1B
  if (value >= 1000000000) {
    return `₱${(value / 1000000000).toFixed(1)}B`;
  } else if (value >= 1000000) {
    return `₱${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `₱${(value / 1000).toFixed(0)}K`;
  } else {
    return `₱${value.toFixed(0)}`;
  }
};

// Number formatter with proper grouping - Rule #19: tabular-nums
export const formatNumber = (value: number | null | undefined, decimals = 0): string => {
  if (value === null || value === undefined) return '0';
  return value.toLocaleString('en-PH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

// Compact number formatter for large values
export const formatNumberCompact = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0';
  
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

// Percentage formatter
export const formatPercentage = (value: number | null | undefined, decimals = 1): string => {
  if (value === null || value === undefined) return '0%';
  return `${value.toFixed(decimals)}%`;
};

// Date formatter for Philippine timezone - Rule #17: Last-updated stamps
export const formatDate = (date: Date | string | null | undefined, format: 'short' | 'long' | 'time' = 'short'): string => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Manila'
  };
  
  switch (format) {
    case 'short':
      options.month = 'short';
      options.day = 'numeric';
      options.year = 'numeric';
      break;
    case 'long':
      options.weekday = 'long';
      options.month = 'long';
      options.day = 'numeric';
      options.year = 'numeric';
      options.hour = '2-digit';
      options.minute = '2-digit';
      break;
    case 'time':
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.hour12 = true;
      break;
  }
  
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
};

// Relative time formatter for "Updated X ago"
export const formatRelativeTime = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return formatDate(dateObj, 'short');
};

// Delta/change formatter with symbol - Rule #10: Delta paired with color
export const formatDelta = (value: number | null | undefined, showSymbol = true): string => {
  if (value === null || value === undefined || value === 0) return '—';
  
  const symbol = value > 0 ? '▲' : '▼';
  const formatted = Math.abs(value).toFixed(1);
  
  if (showSymbol) {
    return `${symbol} ${formatted}%`;
  }
  
  return `${value > 0 ? '+' : ''}${formatted}%`;
};

// Philippine region formatter (ensure consistent naming)
export const formatRegion = (region: string): string => {
  const regionMap: Record<string, string> = {
    'ncr': 'NCR',
    'region_i': 'Region I',
    'region_ii': 'Region II',
    'region_iii': 'Region III',
    'region_iv_a': 'Region IV-A',
    'region_iv_b': 'Region IV-B',
    'region_v': 'Region V',
    'region_vi': 'Region VI',
    'region_vii': 'Region VII',
    'region_viii': 'Region VIII',
    'region_ix': 'Region IX',
    'region_x': 'Region X',
    'region_xi': 'Region XI',
    'region_xii': 'Region XII',
    'region_xiii': 'Region XIII',
    'car': 'CAR',
    'caraga': 'CARAGA',
    'barmm': 'BARMM'
  };
  
  const normalized = region.toLowerCase().replace(/[\s-]/g, '_');
  return regionMap[normalized] || region;
};

// Product category formatter (Title case)
export const formatCategory = (category: string): string => {
  return category
    .split(/[\s_-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Date range formatter
export const formatDateRange = (startDate: Date | string, endDate: Date | string): string => {
  const start = formatDate(startDate, 'short');
  const end = formatDate(endDate, 'short');
  return `${start} - ${end}`;
};

// Export all formatters as a namespace for easier imports
export const fmt = {
  currency: formatCurrency,
  currencyCompact: formatCurrencyCompact,
  number: formatNumber,
  numberCompact: formatNumberCompact,
  percentage: formatPercentage,
  date: formatDate,
  relativeTime: formatRelativeTime,
  delta: formatDelta,
  region: formatRegion,
  category: formatCategory,
  dateRange: formatDateRange
};