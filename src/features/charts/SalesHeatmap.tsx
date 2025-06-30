import React, { useEffect, useRef, memo } from 'react';
import { useDashboardData } from '../../features/transactions/hooks/useOptimizedData';

interface SalesHeatmapProps {
  regionFilter?: string;
  categoryFilter?: string;
  dateRange?: string;
}

export function SalesHeatmap({ regionFilter, categoryFilter, dateRange = 'last7Days' }: SalesHeatmapProps) {
  const container = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useDashboardData({ dateRange, region: regionFilter });

  useEffect(() => {
    if (!container.current || isLoading || !data) return;

    // Transform Scout data to heatmap format
    const heatmapData = data.topCategories?.map((category, index) => ({
      name: category.name,
      value: category.value,
      change: Math.random() * 40 - 20, // Mock change percentage
      size: category.value,
      color: index % 2 === 0 ? '#10b981' : '#ef4444'
    })) || [];

    // Instead of TradingView script, render our own heatmap
    const heatmapHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 4px; height: 100%; padding: 16px;">
        ${heatmapData.map(item => `
          <div style="
            background-color: ${item.change > 0 ? '#dcfce7' : '#fee2e2'};
            border: 1px solid ${item.change > 0 ? '#86efac' : '#fca5a5'};
            border-radius: 8px;
            padding: 16px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            cursor: pointer;
            transition: all 0.2s;
          " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            <div style="font-weight: 600; color: #1f2937; margin-bottom: 8px;">${item.name}</div>
            <div style="font-size: 24px; font-weight: 700; color: #1f2937;">₱${(item.value / 1000).toFixed(1)}K</div>
            <div style="
              font-size: 14px;
              color: ${item.change > 0 ? '#16a34a' : '#dc2626'};
              font-weight: 500;
              display: flex;
              align-items: center;
              gap: 4px;
            ">
              ${item.change > 0 ? '▲' : '▼'} ${Math.abs(item.change).toFixed(1)}%
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.current.innerHTML = heatmapHTML;

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [data, isLoading]);

  if (isLoading) {
    return (
      <div style={{ height: '500px' }} className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div style={{ height: '500px' }}>
      <div
        className="bg-white rounded-lg shadow-sm"
        ref={container}
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
}

export default memo(SalesHeatmap);