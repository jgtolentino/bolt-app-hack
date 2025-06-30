import React, { useState } from 'react';
import CategoryTab from './tabs/CategoryTab';
import BrandTab from './tabs/BrandTab';
import SkuTab from './tabs/SkuTab';
import MixTab from './tabs/MixTab';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

const tabs = [
  { key: 'category', label: 'Category', Comp: CategoryTab },
  { key: 'brand', label: 'Brand', Comp: BrandTab },
  { key: 'sku', label: 'SKU', Comp: SkuTab },
  { key: 'mix', label: 'Mix', Comp: MixTab },
];

export default function ProductPerfTabs() {
  const [active, setActive] = useState('category');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const ActiveComponent = tabs.find(t => t.key === active)!.Comp;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const { error } = await supabase.rpc('refresh_all_views');
      if (error) throw error;
      
      toast.success('Views refreshed successfully');
      // Reload to get fresh data
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing views:', error);
      toast.error('Failed to refresh views');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = () => {
    window.dispatchEvent(new CustomEvent('pp-export'));
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* Tab buttons */}
        <div className="flex space-x-2">
          {tabs.map(t => (
            <button
              key={t.key}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                active === t.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setActive(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-2 ml-auto">
          <button
            className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            onClick={handleExport}
          >
            Export CSV
          </button>
        </div>
      </div>
      
      {/* Active tab content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <ActiveComponent />
      </div>
    </div>
  );
}