/**
 * Scout Dash 2.0 - Grid Layout System
 * Responsive grid layout engine for dashboard components
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { VisualBlueprint, DashboardLayout } from '../types';

export interface GridItem extends VisualBlueprint {
  isDragging?: boolean;
  isResizing?: boolean;
}

export interface GridSystemProps {
  layout: DashboardLayout;
  items: VisualBlueprint[];
  onLayoutChange: (items: VisualBlueprint[]) => void;
  onItemSelect?: (itemId: string) => void;
  selectedItemId?: string;
  readonly?: boolean;
  className?: string;
}

export interface DragState {
  isDragging: boolean;
  dragItem: VisualBlueprint | null;
  dragOffset: { x: number; y: number };
  startPosition: { x: number; y: number };
}

export interface ResizeState {
  isResizing: boolean;
  resizeItem: VisualBlueprint | null;
  resizeHandle: 'se' | 'sw' | 'ne' | 'nw' | 'n' | 's' | 'e' | 'w' | null;
  startPosition: { x: number; y: number };
  startSize: { w: number; h: number };
}

export const GridSystem: React.FC<GridSystemProps> = ({
  layout,
  items,
  onLayoutChange,
  onItemSelect,
  selectedItemId,
  readonly = false,
  className = ''
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragItem: null,
    dragOffset: { x: 0, y: 0 },
    startPosition: { x: 0, y: 0 }
  });
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    resizeItem: null,
    resizeHandle: null,
    startPosition: { x: 0, y: 0 },
    startSize: { w: 0, h: 0 }
  });
  const [gridDimensions, setGridDimensions] = useState({ width: 0, height: 0 });

  // Calculate grid metrics
  const columnWidth = (gridDimensions.width - layout.margin[0] * 2) / layout.columns;
  const rowHeight = layout.rowHeight;

  // Update grid dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (gridRef.current) {
        const rect = gridRef.current.getBoundingClientRect();
        setGridDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Convert grid coordinates to pixel coordinates
  const gridToPixel = useCallback((gridX: number, gridY: number) => ({
    x: layout.margin[0] + gridX * columnWidth,
    y: layout.margin[1] + gridY * rowHeight
  }), [columnWidth, rowHeight, layout.margin]);

  // Convert pixel coordinates to grid coordinates
  const pixelToGrid = useCallback((pixelX: number, pixelY: number) => ({
    x: Math.round((pixelX - layout.margin[0]) / columnWidth),
    y: Math.round((pixelY - layout.margin[1]) / rowHeight)
  }), [columnWidth, rowHeight, layout.margin]);

  // Check for collisions with other items
  const checkCollision = useCallback((item: VisualBlueprint, excludeId?: string) => {
    return items.some(otherItem => {
      if (otherItem.id === excludeId) return false;
      
      return !(
        item.layout.x + item.layout.w <= otherItem.layout.x ||
        otherItem.layout.x + otherItem.layout.w <= item.layout.x ||
        item.layout.y + item.layout.h <= otherItem.layout.y ||
        otherItem.layout.y + otherItem.layout.h <= item.layout.y
      );
    });
  }, [items]);

  // Get available position for item
  const getAvailablePosition = useCallback((item: VisualBlueprint, excludeId?: string) => {
    let bestY = 0;
    let bestX = 0;

    // Try to find a position starting from top-left
    for (let y = 0; y < 100; y++) {
      for (let x = 0; x <= layout.columns - item.layout.w; x++) {
        const testItem = {
          ...item,
          layout: { ...item.layout, x, y }
        };
        
        if (!checkCollision(testItem, excludeId)) {
          return { x, y };
        }
      }
    }

    // If no position found, place at end
    const maxY = Math.max(...items.map(i => i.layout.y + i.layout.h), 0);
    return { x: 0, y: maxY };
  }, [items, layout.columns, checkCollision]);

  // Compact layout by moving items up
  const compactLayout = useCallback((itemsToCompact: VisualBlueprint[]) => {
    const sortedItems = [...itemsToCompact].sort((a, b) => 
      a.layout.y - b.layout.y || a.layout.x - b.layout.x
    );

    return sortedItems.map(item => {
      let newY = item.layout.y;
      
      // Try to move item up as much as possible
      while (newY > 0) {
        const testItem = {
          ...item,
          layout: { ...item.layout, y: newY - 1 }
        };
        
        if (checkCollision(testItem, item.id)) {
          break;
        }
        newY--;
      }
      
      return {
        ...item,
        layout: { ...item.layout, y: newY }
      };
    });
  }, [checkCollision]);

  // Mouse event handlers for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent, item: VisualBlueprint) => {
    if (readonly) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return;

    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    const itemPixel = gridToPixel(item.layout.x, item.layout.y);

    setDragState({
      isDragging: true,
      dragItem: item,
      dragOffset: {
        x: startX - itemPixel.x,
        y: startY - itemPixel.y
      },
      startPosition: { x: startX, y: startY }
    });

    onItemSelect?.(item.id);
  }, [readonly, gridToPixel, onItemSelect]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging && !resizeState.isResizing) return;
    
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    if (dragState.isDragging && dragState.dragItem) {
      const newPixelX = currentX - dragState.dragOffset.x;
      const newPixelY = currentY - dragState.dragOffset.y;
      const newGrid = pixelToGrid(newPixelX, newPixelY);

      // Constrain to grid bounds
      const constrainedX = Math.max(0, Math.min(newGrid.x, layout.columns - dragState.dragItem.layout.w));
      const constrainedY = Math.max(0, newGrid.y);

      const updatedItem = {
        ...dragState.dragItem,
        layout: {
          ...dragState.dragItem.layout,
          x: constrainedX,
          y: constrainedY
        }
      };

      // Update items with new position
      const updatedItems = items.map(item =>
        item.id === dragState.dragItem?.id ? updatedItem : item
      );

      onLayoutChange(updatedItems);
    }

    if (resizeState.isResizing && resizeState.resizeItem) {
      const deltaX = currentX - resizeState.startPosition.x;
      const deltaY = currentY - resizeState.startPosition.y;
      const deltaGridX = Math.round(deltaX / columnWidth);
      const deltaGridY = Math.round(deltaY / rowHeight);

      let newW = resizeState.startSize.w;
      let newH = resizeState.startSize.h;
      let newX = resizeState.resizeItem.layout.x;
      let newY = resizeState.resizeItem.layout.y;

      // Handle different resize handles
      if (resizeState.resizeHandle?.includes('e')) {
        newW = Math.max(1, resizeState.startSize.w + deltaGridX);
      }
      if (resizeState.resizeHandle?.includes('w')) {
        newW = Math.max(1, resizeState.startSize.w - deltaGridX);
        newX = resizeState.resizeItem.layout.x + resizeState.startSize.w - newW;
      }
      if (resizeState.resizeHandle?.includes('s')) {
        newH = Math.max(1, resizeState.startSize.h + deltaGridY);
      }
      if (resizeState.resizeHandle?.includes('n')) {
        newH = Math.max(1, resizeState.startSize.h - deltaGridY);
        newY = resizeState.resizeItem.layout.y + resizeState.startSize.h - newH;
      }

      // Constrain to grid bounds
      newW = Math.min(newW, layout.columns - newX);
      newH = Math.max(1, newH);
      newX = Math.max(0, newX);
      newY = Math.max(0, newY);

      const updatedItem = {
        ...resizeState.resizeItem,
        layout: {
          ...resizeState.resizeItem.layout,
          x: newX,
          y: newY,
          w: newW,
          h: newH
        }
      };

      const updatedItems = items.map(item =>
        item.id === resizeState.resizeItem?.id ? updatedItem : item
      );

      onLayoutChange(updatedItems);
    }
  }, [dragState, resizeState, pixelToGrid, layout.columns, columnWidth, rowHeight, items, onLayoutChange]);

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging) {
      // Compact layout after drag
      const compactedItems = compactLayout(items);
      onLayoutChange(compactedItems);
    }

    setDragState({
      isDragging: false,
      dragItem: null,
      dragOffset: { x: 0, y: 0 },
      startPosition: { x: 0, y: 0 }
    });

    setResizeState({
      isResizing: false,
      resizeItem: null,
      resizeHandle: null,
      startPosition: { x: 0, y: 0 },
      startSize: { w: 0, h: 0 }
    });
  }, [dragState.isDragging, items, onLayoutChange, compactLayout]);

  // Resize handle mouse down
  const handleResizeMouseDown = useCallback((
    e: React.MouseEvent, 
    item: VisualBlueprint, 
    handle: ResizeState['resizeHandle']
  ) => {
    if (readonly) return;
    
    e.preventDefault();
    e.stopPropagation();

    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return;

    setResizeState({
      isResizing: true,
      resizeItem: item,
      resizeHandle: handle,
      startPosition: {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      },
      startSize: {
        w: item.layout.w,
        h: item.layout.h
      }
    });
  }, [readonly]);

  // Attach global mouse events
  useEffect(() => {
    if (dragState.isDragging || resizeState.isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, resizeState.isResizing, handleMouseMove, handleMouseUp]);

  // Calculate grid height
  const gridHeight = Math.max(
    ...items.map(item => item.layout.y + item.layout.h),
    10
  ) * rowHeight + layout.margin[1] * 2;

  // Render resize handles
  const renderResizeHandles = (item: VisualBlueprint) => {
    if (readonly || selectedItemId !== item.id) return null;

    const handles: Array<{ position: ResizeState['resizeHandle'], className: string, cursor: string }> = [
      { position: 'se', className: 'bottom-0 right-0', cursor: 'nwse-resize' },
      { position: 'sw', className: 'bottom-0 left-0', cursor: 'nesw-resize' },
      { position: 'ne', className: 'top-0 right-0', cursor: 'nesw-resize' },
      { position: 'nw', className: 'top-0 left-0', cursor: 'nwse-resize' },
      { position: 'n', className: 'top-0 left-1/2 -translate-x-1/2', cursor: 'ns-resize' },
      { position: 's', className: 'bottom-0 left-1/2 -translate-x-1/2', cursor: 'ns-resize' },
      { position: 'e', className: 'right-0 top-1/2 -translate-y-1/2', cursor: 'ew-resize' },
      { position: 'w', className: 'left-0 top-1/2 -translate-y-1/2', cursor: 'ew-resize' }
    ];

    return (
      <>
        {handles.map(handle => (
          <div
            key={handle.position}
            className={`absolute w-2 h-2 bg-blue-500 border border-white rounded-sm ${handle.className} z-20`}
            style={{ cursor: handle.cursor }}
            onMouseDown={(e) => handleResizeMouseDown(e, item, handle.position)}
          />
        ))}
      </>
    );
  };

  return (
    <div
      ref={gridRef}
      className={`relative bg-gray-50 dark:bg-gray-900 ${className}`}
      style={{
        height: gridHeight,
        minHeight: '400px'
      }}
    >
      {/* Grid background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Vertical grid lines */}
        {Array.from({ length: layout.columns + 1 }, (_, i) => (
          <div
            key={`v-${i}`}
            className="absolute top-0 bottom-0 border-l border-gray-200 dark:border-gray-700 opacity-30"
            style={{
              left: layout.margin[0] + i * columnWidth
            }}
          />
        ))}
        
        {/* Horizontal grid lines */}
        {Array.from({ length: Math.ceil(gridHeight / rowHeight) }, (_, i) => (
          <div
            key={`h-${i}`}
            className="absolute left-0 right-0 border-t border-gray-200 dark:border-gray-700 opacity-30"
            style={{
              top: layout.margin[1] + i * rowHeight
            }}
          />
        ))}
      </div>

      {/* Grid items */}
      {items.map((item) => {
        const pixel = gridToPixel(item.layout.x, item.layout.y);
        const isSelected = selectedItemId === item.id;
        const isDragging = dragState.dragItem?.id === item.id;
        const isResizing = resizeState.resizeItem?.id === item.id;

        return (
          <div
            key={item.id}
            className={`absolute border-2 rounded-lg transition-all duration-200 ${
              isSelected 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-lg' 
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md'
            } ${
              isDragging ? 'cursor-grabbing z-30 opacity-75' : 'cursor-grab'
            } ${
              isResizing ? 'z-30' : ''
            } ${
              readonly ? 'cursor-default' : ''
            }`}
            style={{
              left: pixel.x,
              top: pixel.y,
              width: item.layout.w * columnWidth - layout.padding[0],
              height: item.layout.h * rowHeight - layout.padding[1],
              zIndex: isDragging || isResizing ? 30 : isSelected ? 20 : 10
            }}
            onMouseDown={(e) => handleMouseDown(e, item)}
            onClick={() => onItemSelect?.(item.id)}
          >
            {/* Item content */}
            <div className="w-full h-full overflow-hidden rounded-lg">
              <div className="p-2 border-b bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {item.title || item.type}
                  </h3>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {item.layout.w}×{item.layout.h}
                  </div>
                </div>
              </div>
              
              <div className="p-4 h-full">
                <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                  <div className="text-center">
                    <div className="text-lg font-medium">{item.type}</div>
                    <div className="text-sm">Visual Component</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Selection indicator */}
            {isSelected && !readonly && (
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
            )}

            {/* Resize handles */}
            {renderResizeHandles(item)}
          </div>
        );
      })}

      {/* Drop zone indicator */}
      {dragState.isDragging && (
        <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900 bg-opacity-20 pointer-events-none z-40 flex items-center justify-center">
          <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
            Position: {dragState.dragItem?.layout.x}, {dragState.dragItem?.layout.y}
          </div>
        </div>
      )}
    </div>
  );
};

export default GridSystem;