import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface MobileZoomableContainerProps {
  children: React.ReactNode;
  minZoom?: number;
  maxZoom?: number;
  className?: string;
}

const MobileZoomableContainer: React.FC<MobileZoomableContainerProps> = ({
  children,
  minZoom = 0.5,
  maxZoom = 3.0,
  className = ''
}) => {
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  const [lastTouchCenter, setLastTouchCenter] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate distance between two touch points
  const getTouchDistance = useCallback((touches: TouchList) => {
    if (touches.length < 2) return 0;
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  }, []);

  // Calculate center point between two touches
  const getTouchCenter = useCallback((touches: TouchList) => {
    if (touches.length < 2) return { x: 0, y: 0 };
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getTouchDistance(e.touches);
      const center = getTouchCenter(e.touches);
      setLastTouchDistance(distance);
      setLastTouchCenter(center);
    }
  }, [getTouchDistance, getTouchCenter]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      const center = getTouchCenter(e.touches);
      
      if (lastTouchDistance > 0) {
        const scale = distance / lastTouchDistance;
        const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom * scale));
        
        // Calculate pan offset to zoom towards touch center
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
          const centerX = containerRect.left + containerRect.width / 2;
          const centerY = containerRect.top + containerRect.height / 2;
          
          const deltaX = center.x - centerX;
          const deltaY = center.y - centerY;
          
          setPanOffset(prev => ({
            x: prev.x + deltaX * (newZoom - zoom) / zoom,
            y: prev.y + deltaY * (newZoom - zoom) / zoom
          }));
        }
        
        setZoom(newZoom);
      }
      
      setLastTouchDistance(distance);
      setLastTouchCenter(center);
    } else if (e.touches.length === 1 && zoom > 1) {
      // Single finger pan when zoomed
      const touch = e.touches[0];
      if (lastTouchCenter.x !== 0 && lastTouchCenter.y !== 0) {
        setPanOffset(prev => ({
          x: prev.x + (touch.clientX - lastTouchCenter.x),
          y: prev.y + (touch.clientY - lastTouchCenter.y)
        }));
      }
      setLastTouchCenter({ x: touch.clientX, y: touch.clientY });
    }
  }, [getTouchDistance, getTouchCenter, lastTouchDistance, lastTouchCenter, zoom, minZoom, maxZoom]);

  const handleTouchEnd = useCallback(() => {
    setLastTouchDistance(0);
    setLastTouchCenter({ x: 0, y: 0 });
  }, []);

  // Constrain pan offset
  const getConstrainedOffset = useCallback(() => {
    if (!containerRef.current || zoom <= 1) {
      return { x: 0, y: 0 };
    }

    const container = containerRef.current.getBoundingClientRect();
    const scaledWidth = container.width * zoom;
    const scaledHeight = container.height * zoom;

    const maxOffsetX = Math.max(0, (scaledWidth - container.width) / 2);
    const maxOffsetY = Math.max(0, (scaledHeight - container.height) / 2);

    return {
      x: Math.max(-maxOffsetX, Math.min(maxOffsetX, panOffset.x)),
      y: Math.max(-maxOffsetY, Math.min(maxOffsetY, panOffset.y))
    };
  }, [zoom, panOffset]);

  const constrainedOffset = getConstrainedOffset();

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Mobile Zoom Indicator */}
      {zoom !== 1 && (
        <motion.div
          className="absolute top-4 left-4 z-50 bg-black/75 text-white px-3 py-2 rounded-lg text-sm font-medium"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          {Math.round(zoom * 100)}%
        </motion.div>
      )}

      <div
        ref={containerRef}
        className="w-full h-full touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: zoom > 1 ? 'none' : 'pan-y' }}
      >
        <motion.div
          className="w-full h-full origin-center"
          style={{
            transform: `scale(${zoom}) translate(${constrainedOffset.x / zoom}px, ${constrainedOffset.y / zoom}px)`,
            transformOrigin: 'center center'
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {children}
        </motion.div>
      </div>

      {/* Mobile Instructions */}
      <div className="absolute bottom-4 right-4 z-50 bg-black/75 text-white px-3 py-2 rounded-lg text-xs">
        Pinch to zoom • Drag to pan
      </div>
    </div>
  );
};

export default MobileZoomableContainer;