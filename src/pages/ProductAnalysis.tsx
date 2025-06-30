import React from 'react';
import { motion } from 'framer-motion';
import ProductPerfTabs from '../components/ProductPerf/Tabs';
import { Package } from 'lucide-react';

const ProductAnalysis: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Performance</h1>
            <p className="text-sm text-gray-600">
              Analyze sales performance by category, brand, and SKU
            </p>
          </div>
        </div>
      </div>

      {/* Product Performance Tabs */}
      <ProductPerfTabs />
    </motion.div>
  );
};

export default ProductAnalysis;