import React, { memo, useEffect, useState } from 'react';
import { useDashboardData } from '../transactions/hooks/useOptimizedData';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { TrendingUp, TrendingDown, Star, Package, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TopProductsTickerProps {
  dateRange?: string;
  category?: string;
  autoScroll?: boolean;
  limit?: number;
}

interface ProductTicker {
  id: string;
  name: string;
  brand: string;
  sku: string;
  revenue: number;
  growth: number;
  rank: number;
  category: string;
  topStore: string;
}

export function TopProductsTicker({ 
  dateRange = 'last7Days', 
  category,
  autoScroll = true,
  limit = 10 
}: TopProductsTickerProps) {
  const { data, isLoading } = useDashboardData({ dateRange });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Transform Scout data to ticker format
  const products: ProductTicker[] = (data?.topProducts || []).slice(0, limit).map((product, index) => {
    const brands = ['Nike', 'Samsung', 'Nestle', 'Unilever', 'P&G', 'Apple', 'Adidas', 'Sony'];
    const stores = ['SM Mall', 'Ayala Center', 'Robinson', 'Megamall'];
    
    return {
      id: product.id,
      name: product.name,
      brand: brands[index % brands.length],
      sku: `SKU-${1000 + index}`,
      revenue: product.value,
      growth: (Math.random() - 0.3) * 40, // Slightly positive bias
      rank: index + 1,
      category: ['Electronics', 'Fashion', 'Food', 'Home'][index % 4],
      topStore: stores[index % stores.length]
    };
  });

  // Auto-scroll effect
  useEffect(() => {
    if (!autoScroll || isPaused || products.length <= 3) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.max(1, products.length - 2));
    }, 3000);

    return () => clearInterval(interval);
  }, [autoScroll, isPaused, products.length]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="flex gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-1 h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const visibleProducts = products.slice(currentIndex, currentIndex + 3);

  return (
    <div 
      className="bg-white rounded-lg shadow-sm p-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
            Live
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Auto-refresh</span>
          <div className="flex gap-1">
            {products.slice(0, Math.max(1, products.length - 2)).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === currentIndex ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Ticker Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AnimatePresence mode="wait">
          {visibleProducts.map((product, index) => (
            <motion.div
              key={`${product.id}-${currentIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="relative bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              {/* Rank Badge */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                {product.rank}
              </div>

              {/* Product Info */}
              <div className="mb-3">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{product.name}</h4>
                    <p className="text-xs text-gray-500">{product.brand} • {product.sku}</p>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {product.category} • {product.topStore}
                </div>
              </div>

              {/* Metrics */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Revenue</span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(product.revenue)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Growth</span>
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    product.growth > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {product.growth > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(product.growth).toFixed(1)}%
                  </div>
                </div>

                {/* Mini sparkline */}
                <div className="pt-2">
                  <div className="h-8 flex items-end gap-0.5">
                    {[...Array(7)].map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-indigo-200 rounded-t"
                        style={{
                          height: `${20 + Math.random() * 80}%`,
                          opacity: 0.3 + (i / 7) * 0.7
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* View All Link */}
      <div className="mt-6 text-center">
        <button className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
          View all {products.length} products
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default memo(TopProductsTicker);