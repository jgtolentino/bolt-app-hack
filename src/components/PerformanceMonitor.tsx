import React, { useEffect, useState } from 'react';
import { Activity, Cpu, HardDrive, Zap } from 'lucide-react';

interface PerformanceMetrics {
  fps: number;
  memory: number;
  loadTime: number;
  apiCalls: number;
  cacheHits: number;
  renderTime: number;
}

const PerformanceMonitor: React.FC<{ show?: boolean }> = ({ show = false }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memory: 0,
    loadTime: 0,
    apiCalls: 0,
    cacheHits: 0,
    renderTime: 0,
  });

  useEffect(() => {
    if (!show) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;

    const measureFPS = () => {
      const currentTime = performance.now();
      frameCount++;

      if (currentTime >= lastTime + 1000) {
        setMetrics(prev => ({
          ...prev,
          fps: Math.round((frameCount * 1000) / (currentTime - lastTime)),
          memory: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : 0,
        }));
        frameCount = 0;
        lastTime = currentTime;
      }

      rafId = requestAnimationFrame(measureFPS);
    };

    rafId = requestAnimationFrame(measureFPS);

    // Monitor API calls
    const originalFetch = window.fetch;
    let apiCallCount = 0;
    let cacheHitCount = 0;

    window.fetch = async (...args) => {
      apiCallCount++;
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const loadTime = performance.now() - startTime;
        
        // Check if response was from cache
        if (response.headers.get('x-from-cache') === 'true') {
          cacheHitCount++;
        }

        setMetrics(prev => ({
          ...prev,
          apiCalls: apiCallCount,
          cacheHits: cacheHitCount,
          loadTime: Math.round(loadTime),
        }));

        return response;
      } catch (error) {
        throw error;
      }
    };

    return () => {
      cancelAnimationFrame(rafId);
      window.fetch = originalFetch;
    };
  }, [show]);

  if (!show) return null;

  const getCacheHitRate = () => {
    if (metrics.apiCalls === 0) return 0;
    return Math.round((metrics.cacheHits / metrics.apiCalls) * 100);
  };

  const getFPSColor = () => {
    if (metrics.fps >= 55) return 'text-green-600';
    if (metrics.fps >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg shadow-xl backdrop-blur-sm z-50 font-mono text-xs">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold">Performance</h3>
        <Activity className="w-4 h-4" />
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-1">
            <Zap className="w-3 h-3" />
            <span>FPS:</span>
          </span>
          <span className={getFPSColor()}>{metrics.fps}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-1">
            <HardDrive className="w-3 h-3" />
            <span>Memory:</span>
          </span>
          <span>{metrics.memory} MB</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-1">
            <Cpu className="w-3 h-3" />
            <span>API Calls:</span>
          </span>
          <span>{metrics.apiCalls}</span>
        </div>

        <div className="flex items-center justify-between">
          <span>Cache Hit Rate:</span>
          <span className={getCacheHitRate() > 50 ? 'text-green-400' : 'text-yellow-400'}>
            {getCacheHitRate()}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span>Load Time:</span>
          <span>{metrics.loadTime}ms</span>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-gray-700">
        <div className="text-[10px] text-gray-400">
          Press Shift+P to toggle
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;