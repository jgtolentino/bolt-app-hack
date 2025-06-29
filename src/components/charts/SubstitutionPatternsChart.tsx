import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Info, Filter, Download } from 'lucide-react';

interface SubstitutionLink {
  source: string;
  target: string;
  value: number;
  percentage: number;
}

interface SubstitutionPatternsChartProps {
  data: SubstitutionLink[];
  title?: string;
  height?: number;
  showFilters?: boolean;
}

const SubstitutionPatternsChart: React.FC<SubstitutionPatternsChartProps> = ({
  data,
  title = "Brand Substitution Patterns",
  height = 400,
  showFilters = true
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [minSubstitutionRate, setMinSubstitutionRate] = useState<number>(5);
  
  // Get unique categories from data
  const categories = ['All', ...new Set(data.map(item => item.source.split(' ')[0]))];
  
  // Filter data based on selected category and minimum substitution rate
  const filteredData = data.filter(item => 
    (selectedCategory === 'All' || item.source.includes(selectedCategory)) &&
    item.percentage >= minSubstitutionRate
  );

  // Group data by source for better visualization
  const groupedData: { [key: string]: SubstitutionLink[] } = {};
  filteredData.forEach(link => {
    if (!groupedData[link.source]) {
      groupedData[link.source] = [];
    }
    groupedData[link.source].push(link);
  });

  // Calculate max value for scaling
  const maxValue = Math.max(...filteredData.map(item => item.value));

  // Color scale based on substitution percentage
  const getColor = (percentage: number) => {
    if (percentage >= 50) return '#ef4444'; // High substitution - red
    if (percentage >= 30) return '#f97316'; // Medium-high - orange
    if (percentage >= 15) return '#eab308'; // Medium - yellow
    return '#22c55e'; // Low - green
  };

  // Calculate link width based on value
  const getLinkWidth = (value: number) => {
    return Math.max(1, Math.min(8, (value / maxValue) * 8));
  };

  return (
    <motion.div
      className="chart-container"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        
        {showFilters && (
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Min Rate:</label>
              <select
                value={minSubstitutionRate}
                onChange={(e) => setMinSubstitutionRate(Number(e.target.value))}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value={0}>All</option>
                <option value={5}>5%+</option>
                <option value={10}>10%+</option>
                <option value={20}>20%+</option>
                <option value={30}>30%+</option>
              </select>
            </div>
            
            <button className="p-1 text-gray-600 hover:text-gray-900">
              <Download className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Sankey-style Diagram */}
      <div 
        className="bg-white/50 rounded-lg p-4 overflow-x-auto"
        style={{ height, minWidth: '100%' }}
      >
        {Object.keys(groupedData).length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No substitution data matching the current filters</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-8 min-w-[800px]">
            {Object.entries(groupedData).map(([source, links], sourceIndex) => (
              <div key={source} className="flex items-center">
                {/* Source Brand */}
                <div className="w-1/4 pr-4">
                  <div className="bg-blue-100 p-3 rounded-lg text-right">
                    <div className="font-medium text-blue-800">{source}</div>
                    <div className="text-xs text-blue-600">
                      {links.reduce((sum, link) => sum + link.value, 0)} substitutions
                    </div>
                  </div>
                </div>
                
                {/* Flow Links */}
                <div className="w-1/2 flex flex-col space-y-2">
                  {links.map((link, linkIndex) => (
                    <div key={`${source}-${link.target}`} className="flex items-center">
                      <div className="flex-1 h-8 relative">
                        <div 
                          className="absolute inset-y-0 left-0 right-0 flex items-center"
                          style={{ 
                            height: `${Math.max(2, Math.min(32, (link.value / maxValue) * 32))}px`,
                            marginTop: 'auto',
                            marginBottom: 'auto'
                          }}
                        >
                          <div 
                            className="w-full h-full transition-all duration-300 hover:opacity-80"
                            style={{ 
                              backgroundColor: getColor(link.percentage),
                              borderRadius: '4px'
                            }}
                          ></div>
                          <ArrowRight 
                            className="absolute right-0 text-white" 
                            style={{ 
                              transform: 'translateX(50%)',
                              width: '16px',
                              height: '16px',
                              filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))'
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 w-16 text-center">
                        {link.percentage}%
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Target Brands */}
                <div className="w-1/4 pl-4">
                  <div className="space-y-2">
                    {links.map((link, linkIndex) => (
                      <div 
                        key={`${source}-${link.target}-target`}
                        className="bg-green-100 p-2 rounded-lg"
                      >
                        <div className="font-medium text-green-800">{link.target}</div>
                        <div className="text-xs text-green-600">
                          {link.value} substitutions
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-sm bg-green-500"></div>
            <span className="text-gray-600">&lt;15%</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-sm bg-yellow-500"></div>
            <span className="text-gray-600">15-30%</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-sm bg-orange-500"></div>
            <span className="text-gray-600">30-50%</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-sm bg-red-500"></div>
            <span className="text-gray-600">&gt;50%</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded-lg">
          <Info className="w-4 h-4 text-blue-500" />
          <span className="text-blue-700 text-xs">Substitution rate: % of customers who accept alternative</span>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">📊 Substitution Insights</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• High substitution rates (red) indicate low brand loyalty - consider pricing strategies</p>
          <p>• Low substitution rates (green) indicate high brand loyalty - maintain stock levels</p>
          <p>• Most common substitution: {filteredData.length > 0 ? 
              `${filteredData.sort((a, b) => b.value - a.value)[0].source} → ${filteredData.sort((a, b) => b.value - a.value)[0].target}` : 
              'No data available'}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default SubstitutionPatternsChart;