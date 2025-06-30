import React, { useEffect, useRef, memo } from 'react';
import { useDashboardData } from '../transactions/hooks/useOptimizedData';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { TrendingUp, TrendingDown, Grid3x3 } from 'lucide-react';

interface CategoryPerformanceHeatmapProps {
  dateRange?: string;
  groupBy?: 'category' | 'brand' | 'region';
  metric?: 'revenue' | 'growth' | 'volume' | 'margin';
}

interface HeatmapCell {
  id: string;
  name: string;
  parent: string;
  value: number;
  change: number;
  size: number;
  details: {
    topProduct: string;
    marketShare: number;
    avgPrice: number;
  };
}

export function CategoryPerformanceHeatmap({ 
  dateRange = 'last7Days',
  groupBy = 'category',
  metric = 'revenue'
}: CategoryPerformanceHeatmapProps) {
  const container = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useDashboardData({ dateRange });

  useEffect(() => {
    if (!container.current || isLoading || !data) return;

    // Generate hierarchical data based on groupBy
    const generateHeatmapData = (): HeatmapCell[] => {
      const categories = ['Electronics', 'Fashion', 'Food & Beverage', 'Home & Living', 'Health & Beauty', 'Sports & Outdoors'];
      const brands = ['Nike', 'Samsung', 'Nestle', 'Unilever', 'P&G', 'Apple', 'Adidas', 'Sony'];
      const regions = ['NCR', 'CALABARZON', 'Central Luzon', 'Central Visayas', 'Davao', 'Northern Mindanao'];

      const items = groupBy === 'category' ? categories : groupBy === 'brand' ? brands : regions;
      
      return items.map((item, index) => {
        const baseValue = (data?.totalRevenue || 0) * (0.3 - index * 0.04);
        const growth = (Math.random() - 0.3) * 50;
        
        return {
          id: `${groupBy}-${index}`,
          name: item,
          parent: groupBy === 'category' ? 'Retail' : groupBy === 'brand' ? 'Brands' : 'Philippines',
          value: baseValue,
          change: growth,
          size: baseValue,
          details: {
            topProduct: ['iPhone 15', 'Nike Air Max', 'Nescafe Gold', 'Dove Soap'][index % 4],
            marketShare: 30 - index * 4,
            avgPrice: 150 + Math.random() * 500
          }
        };
      });
    };

    const heatmapData = generateHeatmapData();
    
    // Calculate grid dimensions
    const cols = Math.ceil(Math.sqrt(heatmapData.length));
    const rows = Math.ceil(heatmapData.length / cols);

    // Find max value for scaling
    const maxValue = Math.max(...heatmapData.map(d => d.value));
    const totalValue = heatmapData.reduce((sum, d) => sum + d.value, 0);

    // Render treemap-style heatmap
    const heatmapHTML = `
      <div style="padding: 16px; height: 100%;">
        <div style="
          display: grid;
          grid-template-columns: repeat(${cols}, 1fr);
          gap: 4px;
          height: 100%;
        ">
          ${heatmapData.map(cell => {
            const sizePercent = (cell.value / maxValue) * 100;
            const isPositive = cell.change > 0;
            const intensity = Math.abs(cell.change) / 50; // Normalize to 0-1
            
            return `
              <div style="
                background: ${isPositive 
                  ? `rgba(16, 185, 129, ${0.1 + intensity * 0.4})` 
                  : `rgba(239, 68, 68, ${0.1 + intensity * 0.4})`};
                border: 2px solid ${isPositive 
                  ? `rgba(16, 185, 129, ${0.3 + intensity * 0.5})` 
                  : `rgba(239, 68, 68, ${0.3 + intensity * 0.5})`};
                border-radius: 8px;
                padding: 12px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                cursor: pointer;
                transition: all 0.2s;
                position: relative;
                overflow: hidden;
              " 
              onmouseover="
                this.style.transform='scale(1.02)';
                this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)';
                this.querySelector('.details').style.opacity='1';
              " 
              onmouseout="
                this.style.transform='scale(1)';
                this.style.boxShadow='none';
                this.querySelector('.details').style.opacity='0';
              ">
                <!-- Size indicator -->
                <div style="
                  position: absolute;
                  bottom: 0;
                  left: 0;
                  right: 0;
                  height: 4px;
                  background: ${isPositive ? '#10b981' : '#ef4444'};
                  opacity: 0.3;
                ">
                  <div style="
                    height: 100%;
                    width: ${sizePercent}%;
                    background: ${isPositive ? '#10b981' : '#ef4444'};
                  "></div>
                </div>
                
                <!-- Main content -->
                <div>
                  <div style="
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 4px;
                    font-size: 14px;
                  ">${cell.name}</div>
                  
                  <div style="
                    font-size: 20px;
                    font-weight: 700;
                    color: #1f2937;
                    margin-bottom: 4px;
                  ">₱${(cell.value / 1000).toFixed(1)}K</div>
                  
                  <div style="
                    font-size: 14px;
                    color: ${isPositive ? '#16a34a' : '#dc2626'};
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                  ">
                    ${isPositive ? '▲' : '▼'} ${Math.abs(cell.change).toFixed(1)}%
                  </div>
                </div>
                
                <!-- Hover details -->
                <div class="details" style="
                  opacity: 0;
                  transition: opacity 0.2s;
                  margin-top: 8px;
                  padding-top: 8px;
                  border-top: 1px solid rgba(0,0,0,0.1);
                  font-size: 11px;
                  color: #6b7280;
                ">
                  <div>Top: ${cell.details.topProduct}</div>
                  <div>Share: ${cell.details.marketShare}%</div>
                  <div>Avg: ₱${cell.details.avgPrice.toFixed(0)}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        
        <!-- Summary footer -->
        <div style="
          margin-top: 16px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
        ">
          <div>
            <span style="color: #6b7280;">Total ${groupBy}:</span>
            <span style="font-weight: 600; color: #1f2937; margin-left: 8px;">
              ${heatmapData.length}
            </span>
          </div>
          <div>
            <span style="color: #6b7280;">Total value:</span>
            <span style="font-weight: 600; color: #1f2937; margin-left: 8px;">
              ₱${(totalValue / 1000000).toFixed(1)}M
            </span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="color: #10b981; font-weight: 500;">
              ▲ ${heatmapData.filter(d => d.change > 0).length} growing
            </span>
            <span style="color: #ef4444; font-weight: 500;">
              ▼ ${heatmapData.filter(d => d.change < 0).length} declining
            </span>
          </div>
        </div>
      </div>
    `;

    container.current.innerHTML = heatmapHTML;

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [data, isLoading, groupBy, metric]);

  if (isLoading) {
    return (
      <div style={{ height: '600px' }} className="flex items-center justify-center bg-white rounded-lg shadow-sm">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header with controls */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid3x3 className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Performance Heatmap</h3>
          </div>
          
          <div className="flex items-center gap-3">
            <select 
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={groupBy}
              onChange={(e) => {/* Handle groupBy change */}}
            >
              <option value="category">By Category</option>
              <option value="brand">By Brand</option>
              <option value="region">By Region</option>
            </select>
            
            <select 
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={metric}
              onChange={(e) => {/* Handle metric change */}}
            >
              <option value="revenue">Revenue</option>
              <option value="growth">Growth Rate</option>
              <option value="volume">Volume</option>
              <option value="margin">Margin</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Heatmap container */}
      <div
        ref={container}
        style={{ height: '600px', width: '100%' }}
      />
    </div>
  );
}

export default memo(CategoryPerformanceHeatmap);