/**
 * Scout Dash 2.0 - Layout Manager
 * High-level layout orchestrator that integrates GridSystem with DashboardEngine
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { VisualBlueprint, DashboardLayout, Dashboard } from '../types';
import { GridSystem } from './GridSystem';
import { ResponsiveBreakpoints } from './ResponsiveBreakpoints';
import { LayoutToolbar } from './LayoutToolbar';
import { useToast } from '../../components/UI/ToastProvider';

export interface LayoutManagerProps {
  dashboard: Dashboard;
  onDashboardChange: (dashboard: Dashboard) => void;
  selectedItemId?: string;
  onItemSelect?: (itemId: string | null) => void;
  readonly?: boolean;
  enableResponsive?: boolean;
  className?: string;
}

export interface LayoutState {
  currentBreakpoint: keyof ResponsiveBreakpoints;
  layouts: Record<keyof ResponsiveBreakpoints, DashboardLayout>;
  items: VisualBlueprint[];
}

const DEFAULT_LAYOUTS: Record<keyof ResponsiveBreakpoints, DashboardLayout> = {
  xs: {
    columns: 4,
    rowHeight: 60,
    margin: [10, 10],
    padding: [5, 5]
  },
  sm: {
    columns: 6,
    rowHeight: 80,
    margin: [15, 15],
    padding: [8, 8]
  },
  md: {
    columns: 12,
    rowHeight: 100,
    margin: [20, 20],
    padding: [10, 10]
  },
  lg: {
    columns: 16,
    rowHeight: 120,
    margin: [25, 25],
    padding: [12, 12]
  },
  xl: {
    columns: 24,
    rowHeight: 140,
    margin: [30, 30],
    padding: [15, 15]
  }
};

export const LayoutManager: React.FC<LayoutManagerProps> = ({
  dashboard,
  onDashboardChange,
  selectedItemId,
  onItemSelect,
  readonly = false,
  enableResponsive = true,
  className = ''
}) => {
  const { showToast } = useToast();
  
  // Initialize layout state
  const [layoutState, setLayoutState] = useState<LayoutState>(() => {
    const currentBreakpoint = getCurrentBreakpoint();
    const layouts = dashboard.layouts || DEFAULT_LAYOUTS;
    
    return {
      currentBreakpoint,
      layouts,
      items: dashboard.visuals || []
    };
  });

  // Get current layout based on breakpoint
  const currentLayout = useMemo(() => {
    return layoutState.layouts[layoutState.currentBreakpoint];
  }, [layoutState.layouts, layoutState.currentBreakpoint]);

  // Handle window resize for responsive layouts
  useEffect(() => {
    if (!enableResponsive) return;

    const handleResize = () => {
      const newBreakpoint = getCurrentBreakpoint();
      if (newBreakpoint !== layoutState.currentBreakpoint) {
        setLayoutState(prev => ({
          ...prev,
          currentBreakpoint: newBreakpoint
        }));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [enableResponsive, layoutState.currentBreakpoint]);

  // Handle layout changes from GridSystem
  const handleLayoutChange = useCallback((updatedItems: VisualBlueprint[]) => {
    setLayoutState(prev => ({
      ...prev,
      items: updatedItems
    }));

    // Update dashboard
    const updatedDashboard: Dashboard = {
      ...dashboard,
      visuals: updatedItems,
      layouts: layoutState.layouts,
      lastModified: new Date().toISOString()
    };

    onDashboardChange(updatedDashboard);
  }, [dashboard, layoutState.layouts, onDashboardChange]);

  // Handle breakpoint-specific layout changes
  const handleBreakpointLayoutChange = useCallback((
    breakpoint: keyof ResponsiveBreakpoints,
    layout: DashboardLayout
  ) => {
    const updatedLayouts = {
      ...layoutState.layouts,
      [breakpoint]: layout
    };

    setLayoutState(prev => ({
      ...prev,
      layouts: updatedLayouts
    }));

    // Update dashboard
    const updatedDashboard: Dashboard = {
      ...dashboard,
      layouts: updatedLayouts,
      lastModified: new Date().toISOString()
    };

    onDashboardChange(updatedDashboard);
  }, [dashboard, layoutState.layouts, onDashboardChange]);

  // Add new item to layout
  const handleAddItem = useCallback((item: Omit<VisualBlueprint, 'id'>) => {
    const newItem: VisualBlueprint = {
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      layout: {
        x: 0,
        y: 0,
        w: item.layout?.w || 4,
        h: item.layout?.h || 3
      }
    };

    // Find available position
    const availablePosition = findAvailablePosition(
      layoutState.items,
      newItem.layout.w,
      newItem.layout.h,
      currentLayout.columns
    );

    newItem.layout.x = availablePosition.x;
    newItem.layout.y = availablePosition.y;

    const updatedItems = [...layoutState.items, newItem];
    handleLayoutChange(updatedItems);

    showToast(`Added ${item.type} to dashboard`, 'success');
    return newItem.id;
  }, [layoutState.items, currentLayout.columns, handleLayoutChange, showToast]);

  // Remove item from layout
  const handleRemoveItem = useCallback((itemId: string) => {
    const updatedItems = layoutState.items.filter(item => item.id !== itemId);
    handleLayoutChange(updatedItems);
    
    if (selectedItemId === itemId) {
      onItemSelect?.(null);
    }

    showToast('Item removed from dashboard', 'success');
  }, [layoutState.items, selectedItemId, handleLayoutChange, onItemSelect, showToast]);

  // Duplicate item
  const handleDuplicateItem = useCallback((itemId: string) => {
    const item = layoutState.items.find(i => i.id === itemId);
    if (!item) return;

    const duplicatedItem: VisualBlueprint = {
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `${item.title} (Copy)`,
      layout: {
        ...item.layout,
        x: Math.min(item.layout.x + 1, currentLayout.columns - item.layout.w),
        y: item.layout.y + item.layout.h
      }
    };

    const updatedItems = [...layoutState.items, duplicatedItem];
    handleLayoutChange(updatedItems);

    showToast('Item duplicated', 'success');
    return duplicatedItem.id;
  }, [layoutState.items, currentLayout.columns, handleLayoutChange, showToast]);

  // Reset layout
  const handleResetLayout = useCallback(() => {
    const resetItems = layoutState.items.map((item, index) => ({
      ...item,
      layout: {
        ...item.layout,
        x: (index % Math.floor(currentLayout.columns / 4)) * 4,
        y: Math.floor(index / Math.floor(currentLayout.columns / 4)) * 3
      }
    }));

    handleLayoutChange(resetItems);
    showToast('Layout reset', 'success');
  }, [layoutState.items, currentLayout.columns, handleLayoutChange, showToast]);

  // Auto-arrange items
  const handleAutoArrange = useCallback(() => {
    const sortedItems = [...layoutState.items].sort((a, b) => {
      // Sort by area (largest first), then by original position
      const areaA = a.layout.w * a.layout.h;
      const areaB = b.layout.w * b.layout.h;
      if (areaA !== areaB) return areaB - areaA;
      return (a.layout.y * currentLayout.columns + a.layout.x) - 
             (b.layout.y * currentLayout.columns + b.layout.x);
    });

    let currentY = 0;
    const arrangedItems = sortedItems.map(item => {
      const position = findAvailablePosition(
        [],
        item.layout.w,
        item.layout.h,
        currentLayout.columns,
        currentY
      );

      currentY = Math.max(currentY, position.y + item.layout.h);

      return {
        ...item,
        layout: {
          ...item.layout,
          x: position.x,
          y: position.y
        }
      };
    });

    handleLayoutChange(arrangedItems);
    showToast('Layout auto-arranged', 'success');
  }, [layoutState.items, currentLayout.columns, handleLayoutChange, showToast]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Layout Toolbar */}
      {!readonly && (
        <LayoutToolbar
          currentBreakpoint={layoutState.currentBreakpoint}
          layouts={layoutState.layouts}
          onBreakpointChange={(breakpoint) => {
            setLayoutState(prev => ({ ...prev, currentBreakpoint: breakpoint }));
          }}
          onLayoutChange={handleBreakpointLayoutChange}
          onAddItem={handleAddItem}
          onResetLayout={handleResetLayout}
          onAutoArrange={handleAutoArrange}
          selectedItemId={selectedItemId}
          onRemoveSelectedItem={() => selectedItemId && handleRemoveItem(selectedItemId)}
          onDuplicateSelectedItem={() => selectedItemId && handleDuplicateItem(selectedItemId)}
          enableResponsive={enableResponsive}
        />
      )}

      {/* Grid System */}
      <div className="flex-1 overflow-hidden">
        <GridSystem
          layout={currentLayout}
          items={layoutState.items}
          onLayoutChange={handleLayoutChange}
          onItemSelect={onItemSelect}
          selectedItemId={selectedItemId}
          readonly={readonly}
          className="h-full"
        />
      </div>

      {/* Layout Info */}
      {enableResponsive && (
        <div className="p-2 bg-gray-50 dark:bg-gray-800 border-t text-xs text-gray-500">
          <div className="flex justify-between items-center">
            <span>
              Breakpoint: {layoutState.currentBreakpoint.toUpperCase()} 
              ({currentLayout.columns} columns, {currentLayout.rowHeight}px rows)
            </span>
            <span>
              {layoutState.items.length} items
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
function getCurrentBreakpoint(): keyof ResponsiveBreakpoints {
  const width = window.innerWidth;
  
  if (width < 576) return 'xs';
  if (width < 768) return 'sm';
  if (width < 1024) return 'md';
  if (width < 1400) return 'lg';
  return 'xl';
}

function findAvailablePosition(
  existingItems: VisualBlueprint[],
  width: number,
  height: number,
  columns: number,
  startY: number = 0
): { x: number; y: number } {
  for (let y = startY; y < 100; y++) {
    for (let x = 0; x <= columns - width; x++) {
      const testItem = {
        layout: { x, y, w: width, h: height }
      };

      const hasCollision = existingItems.some(item => {
        return !(
          testItem.layout.x + testItem.layout.w <= item.layout.x ||
          item.layout.x + item.layout.w <= testItem.layout.x ||
          testItem.layout.y + testItem.layout.h <= item.layout.y ||
          item.layout.y + item.layout.h <= testItem.layout.y
        );
      });

      if (!hasCollision) {
        return { x, y };
      }
    }
  }

  // Fallback to bottom
  const maxY = Math.max(...existingItems.map(i => i.layout.y + i.layout.h), startY);
  return { x: 0, y: maxY };
}

export default LayoutManager;