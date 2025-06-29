import { format } from 'date-fns';

/**
 * Format a number as Philippine Peso (₱)
 * @param value Number to format
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number | null | undefined, decimals = 2): string => {
  if (value === null || value === undefined) return '₱0';
  return `₱${value.toLocaleString('en-PH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
};

/**
 * Format a number as Philippine Peso (₱) with K/M/B suffixes for thousands/millions/billions
 * @param value Number to format
 * @returns Formatted currency string with appropriate suffix
 */
export const formatCurrencyCompact = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '₱0';
  
  if (value >= 1000000000) {
    return `₱${(value / 1000000000).toFixed(1)}B`;
  } else if (value >= 1000000) {
    return `₱${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `₱${(value / 1000).toFixed(1)}K`;
  } else {
    return `₱${value.toFixed(0)}`;
  }
};

/**
 * Format a number with commas
 * @param value Number to format
 * @returns Formatted number string
 */
export const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0';
  return value.toLocaleString('en-PH');
};

/**
 * Format a percentage
 * @param value Number to format as percentage
 * @param decimals Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number | null | undefined, decimals = 1): string => {
  if (value === null || value === undefined) return '0%';
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format a date
 * @param date Date to format
 * @param formatString Format string (default: 'MMM d, yyyy')
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string | null | undefined, formatString = 'MMM d, yyyy'): string => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatString);
};

/**
 * Format a date range
 * @param startDate Start date
 * @param endDate End date
 * @returns Formatted date range string
 */
export const formatDateRange = (startDate: Date | string, endDate: Date | string): string => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
};