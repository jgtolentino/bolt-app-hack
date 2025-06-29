import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';

interface ZoomableContainerProps {
  children: React.ReactNode;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  className?: string;
  enablePan?: boolean;
}

const ZoomableContainer: React.FC<ZoomableContainerProps> = ({
  children,
  minZoom = 0.25,
  maxZoom = 2.0,
  zoomStep = 0.1,
  className = '',
  enablePan = true
}) => {
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Reset pan when zoom changes to keep content centered
  useEffect(() => {
    if (zoom === 1) {
      setPanOffset({ x: 0, y: 0 });
    }
  }, [zoom]);

  // Zoom controls with smooth transitions
  const handleZoomIn = useCallback(() => {
    setIsTransitioning(true);
    setZoom(prev => Math.min(prev + zoomStep, maxZoom));
    setTimeout(() => setIsTransitioning(false), 300);
  }, [zoomStep, maxZoom]);

  const handleZoomOut = useCallback(() => {
    setIsTransitioning(true);
    setZoom(prev => Math.max(prev - zoomStep, minZoom));
    setTimeout(() => setIsTransitioning(false), 300);
  }, [zoomStep, minZoom]);

  const handleZoomReset = useCallback(() => {
    setIsTransitioning(true);
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setTimeout(() => setIsTransitioning(false), 300);
  }, []);

  const handleFitToWidth = useCallback(() => {
    if (containerRef.current && contentRef.current) {
      setIsTransitioning(true);
      const containerWidth = containerRef.current.clientWidth;
      const contentWidth = contentRef.current.scrollWidth;
      const newZoom = Math.min((containerWidth - 40) / contentWidth, maxZoom);
      setZoom(newZoom);
      setPanOffset({ x: 0, y: 0 });
      setTimeout(() => setIsTransitioning(false), 300);
    }
  }, [maxZoom]);

  // Mouse wheel zoom (like PDF viewers)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
      setZoom(prev => Math.max(minZoom, Math.min(maxZoom, prev + delta)));
    }
  }, [zoomStep, minZoom, maxZoom]);

  // Pan functionality for zoomed content
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1 && enablePan) {
      setIsPanning(true);
      setDragStart({
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y
      });
      e.preventDefault();
    }
  }, [zoom, enablePan, panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning && zoom > 1 && enablePan) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isPanning, zoom, enablePan, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Constrain pan to prevent content from moving too far
  const getConstrainedOffset = useCallback(() => {
    if (!containerRef.current || !contentRef.current || zoom <= 1) {
      return { x: 0, y: 0 };
    }

    const container = containerRef.current.getBoundingClientRect();
    const scaledContentWidth = contentRef.current.scrollWidth * zoom;
    const scaledContentHeight = contentRef.current.scrollHeight * zoom;

    const maxOffsetX = Math.max(0, (scaledContentWidth - container.width) / 2);
    const maxOffsetY = Math.max(0, (scaledContentHeight - container.height) / 2);

    return {
      x: Math.max(-maxOffsetX, Math.min(maxOffsetX, panOffset.x)),
      y: Math.max(-maxOffsetY, Math.min(maxOffsetY, panOffset.y))
    };
  }, [zoom, panOffset]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault();
            handleZoomIn();
            break;
          case '-':
            e.preventDefault();
            handleZoomOut();
            break;
          case '0':
            e.preventDefault();
            handleZoomReset();
            break;
          case '1':
            e.preventDefault();
            handleFitToWidth();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleZoomReset, handleFitToWidth]);

  const constrainedOffset = getConstrainedOffset();

  return (
    <div className={`relative ${className}`}>
      {/* Zoom Controls */}
      <motion.div
        className="absolute top-4 right-4 z-50 bg-white/90 backdrop-blur-sm border border-white/30 rounded-lg shadow-lg p-2 flex items-center space-x-1"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={handleZoomOut}
          disabled={zoom <= minZoom}
          className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Zoom Out (Ctrl + -)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <div className="px-3 py-1 text-sm font-medium min-w-[60px] text-center bg-gray-50 rounded">
          {Math.round(zoom * 100)}%
        </div>

        <button
          onClick={handleZoomIn}
          disabled={zoom >= maxZoom}
          className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Zoom In (Ctrl + +)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          onClick={handleFitToWidth}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Fit to Width (Ctrl + 1)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          onClick={handleZoomReset}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Reset Zoom (Ctrl + 0)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Zoom Level Indicator */}
      {zoom !== 1 && (
        <motion.div
          className="absolute top-4 left-4 z-50 bg-black/75 text-white px-3 py-2 rounded-lg text-sm font-medium"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
        >
          {Math.round(zoom * 100)}% {zoom > 1 && enablePan && '(Drag to pan)'}
        </motion.div>
      )}

      {/* Zoomable Container */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden relative bg-gray-50"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          cursor: zoom > 1 && enablePan ? (isPanning ? 'grabbing' : 'grab') : 'default'
        }}
      >
        {/* Content with PDF-like scaling */}
        <motion.div
          ref={contentRef}
          className={`w-full h-full origin-center ${isTransitioning ? 'transition-transform duration-300 ease-out' : ''}`}
          style={{
            transform: `scale(${zoom}) translate(${constrainedOffset.x / zoom}px, ${constrainedOffset.y / zoom}px)`,
            transformOrigin: 'center center'
          }}
        >
          {children}
        </motion.div>
      </div>

      {/* Zoom Instructions */}
      <div className="absolute bottom-4 right-4 z-50 bg-black/75 text-white px-3 py-2 rounded-lg text-xs">
        Ctrl + Scroll to zoom • Ctrl + 0 to reset
      </div>
    </div>
  );
};

export default ZoomableContainer;