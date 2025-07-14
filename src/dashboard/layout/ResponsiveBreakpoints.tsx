/**
 * Scout Dash 2.0 - Responsive Breakpoints
 * Defines responsive breakpoint system for dashboard layouts
 */

export interface ResponsiveBreakpoints {
  xs: any;  // < 576px
  sm: any;  // >= 576px
  md: any;  // >= 768px
  lg: any;  // >= 1024px
  xl: any;  // >= 1400px
}

export const BREAKPOINT_WIDTHS = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 1024,
  xl: 1400
} as const;

export const BREAKPOINT_NAMES = {
  xs: 'Extra Small',
  sm: 'Small',
  md: 'Medium',
  lg: 'Large',
  xl: 'Extra Large'
} as const;

export const BREAKPOINT_ICONS = {
  xs: '📱',
  sm: '📱',
  md: '💻',
  lg: '🖥️',
  xl: '🖥️'
} as const;

export const BREAKPOINT_DESCRIPTIONS = {
  xs: 'Mobile Portrait',
  sm: 'Mobile Landscape',
  md: 'Tablet',
  lg: 'Desktop',
  xl: 'Large Desktop'
} as const;