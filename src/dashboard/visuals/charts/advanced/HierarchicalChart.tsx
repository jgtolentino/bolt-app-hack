/**
 * Scout Dash 2.0 - Hierarchical Chart
 * Treemap and Sunburst visualization for hierarchical data
 * Inspired by retail-insights-dashboard-ph
 */

import React, { useMemo, useState } from 'react';
import {
  Treemap,
  ResponsiveContainer,
  Tooltip,
  Cell
} from 'recharts';
import { BaseVisual } from '../BaseVisual';
import { VisualBlueprint } from '../../../types';

export interface HierarchicalChartProps {
  blueprint: VisualBlueprint;
  data: any[];
  width?: number;
  height?: number;
  onSelectionChange?: (selection: any) => void;
  chartType?: 'treemap' | 'sunburst';
}

interface HierarchicalNode {
  name: string;
  value: number;
  children?: HierarchicalNode[];
  category?: string;
  level?: number;
  parent?: string;
  originalData?: any;
}

interface ProcessedData {
  nodes: HierarchicalNode[];
  maxDepth: number;
  totalValue: number;
}

export const HierarchicalChart: React.FC<HierarchicalChartProps> = ({
  blueprint,
  data,
  width,
  height = 400,
  onSelectionChange,
  chartType = 'treemap'
}) => {
  const [selectedPath, setSelectedPath] = useState<string[]>([]);

  const processedData = useMemo((): ProcessedData => {
    if (!data || data.length === 0) {
      return { nodes: [], maxDepth: 0, totalValue: 0 };
    }

    const nameField = blueprint.encoding.text?.field || 'name';
    const valueField = blueprint.encoding.size?.field || 'value';
    const categoryField = blueprint.encoding.color?.field || 'category';
    const parentField = 'parent'; // Could be made configurable

    // Group data by hierarchy levels
    const hierarchy: { [key: string]: HierarchicalNode } = {};
    let maxDepth = 0;
    let totalValue = 0;

    // First pass: create all nodes
    data.forEach(item => {
      const name = item[nameField] || 'Unknown';
      const value = parseFloat(item[valueField]) || 0;
      const category = item[categoryField] || 'default';
      const parent = item[parentField];

      totalValue += value;

      if (!hierarchy[name]) {
        hierarchy[name] = {
          name,
          value: 0,
          category,
          children: [],
          parent,
          originalData: item
        };
      }

      hierarchy[name].value += value;
      hierarchy[name].originalData = item;
    });

    // Second pass: build parent-child relationships
    const roots: HierarchicalNode[] = [];
    
    Object.values(hierarchy).forEach(node => {
      if (node.parent && hierarchy[node.parent]) {
        if (!hierarchy[node.parent].children) {
          hierarchy[node.parent].children = [];
        }
        hierarchy[node.parent].children!.push(node);
      } else {
        roots.push(node);
      }
    });

    // Calculate depth
    const calculateDepth = (node: HierarchicalNode, depth = 0): number => {
      node.level = depth;
      maxDepth = Math.max(maxDepth, depth);
      
      if (node.children && node.children.length > 0) {
        return Math.max(...node.children.map(child => calculateDepth(child, depth + 1)));
      }
      return depth;
    };

    roots.forEach(root => calculateDepth(root));

    return { nodes: roots, maxDepth, totalValue };
  }, [data, blueprint.encoding]);

  // Color generation
  const generateColors = (count: number, baseHue = 200): string[] => {
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      const hue = (baseHue + (i * 360 / count)) % 360;
      const saturation = 60 + (i % 3) * 15;
      const lightness = 45 + (i % 4) * 10;
      colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    return colors;
  };

  const flattenForTreemap = (nodes: HierarchicalNode[]): any[] => {
    const flattened: any[] = [];
    
    const traverse = (nodeList: HierarchicalNode[], path: string[] = []) => {
      nodeList.forEach(node => {
        const currentPath = [...path, node.name];
        
        if (!node.children || node.children.length === 0) {
          // Leaf node
          flattened.push({
            name: node.name,
            value: node.value,
            category: node.category,
            level: node.level,
            path: currentPath,
            fullName: currentPath.join(' > '),
            originalData: node.originalData
          });
        } else {
          // Parent node - include if it has its own value
          if (node.value > 0) {
            const childrenValue = node.children.reduce((sum, child) => sum + child.value, 0);
            const ownValue = node.value - childrenValue;
            
            if (ownValue > 0) {
              flattened.push({
                name: `${node.name} (direct)`,
                value: ownValue,
                category: node.category,
                level: node.level,
                path: currentPath,
                fullName: currentPath.join(' > '),
                originalData: node.originalData
              });
            }
          }
          
          // Traverse children
          traverse(node.children, currentPath);
        }
      });
    };

    traverse(nodes);
    return flattened;
  };

  const treemapData = flattenForTreemap(processedData.nodes);
  const colors = generateColors(treemapData.length);

  const formatValue = (value: number): string => {
    const format = blueprint.encoding.size?.format;
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    }
    if (format === 'percentage') {
      return `${((value / processedData.totalValue) * 100).toFixed(1)}%`;
    }
    return new Intl.NumberFormat().format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    const percentage = ((data.value / processedData.totalValue) * 100).toFixed(1);

    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-w-xs">
        <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">
          {data.fullName}
        </p>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Value:</span>
            <span className="font-medium text-blue-600">
              {formatValue(data.value)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Percentage:</span>
            <span className="font-medium text-green-600">
              {percentage}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Level:</span>
            <span className="font-medium text-purple-600">
              {data.level}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const handleTreemapClick = (data: any) => {
    if (onSelectionChange) {
      onSelectionChange({
        type: 'hierarchical-node',
        node: data.name,
        value: data.value,
        path: data.path,
        level: data.level,
        percentage: (data.value / processedData.totalValue) * 100,
        originalData: data.originalData
      });
    }

    setSelectedPath(data.path);
  };

  if (!processedData.nodes.length || !treemapData.length) {
    return (
      <BaseVisual blueprint={blueprint} width={width} height={height}>
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <div className="text-lg font-medium">No Hierarchical Data</div>
            <div className="text-sm">Unable to generate hierarchy visualization</div>
          </div>
        </div>
      </BaseVisual>
    );
  }

  return (
    <BaseVisual blueprint={blueprint} width={width} height={height}>
      <div className="space-y-4">
        {/* Summary Statistics */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {processedData.nodes.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Root Nodes
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {treemapData.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Nodes
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {processedData.maxDepth + 1}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Max Depth
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {formatValue(processedData.totalValue)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Value
            </div>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        {selectedPath.length > 0 && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-blue-700 dark:text-blue-300 font-medium">Selected:</span>
              {selectedPath.map((segment, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span className="text-blue-500">›</span>}
                  <span className="text-blue-800 dark:text-blue-200 font-medium">
                    {segment}
                  </span>
                </React.Fragment>
              ))}
              <button
                onClick={() => setSelectedPath([])}
                className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Treemap Visualization */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <ResponsiveContainer width="100%" height={height}>
            <Treemap
              data={treemapData}
              dataKey="value"
              aspectRatio={4/3}
              stroke="#fff"
              strokeWidth={2}
              onClick={handleTreemapClick}
              style={{ cursor: 'pointer' }}
            >
              <Tooltip content={<CustomTooltip />} />
              {treemapData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={colors[index % colors.length]}
                  style={{
                    opacity: selectedPath.length === 0 || 
                      selectedPath.some(segment => entry.path.includes(segment)) ? 1 : 0.3
                  }}
                />
              ))}
            </Treemap>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
            Top Categories by Value
          </h4>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {treemapData
              .sort((a, b) => b.value - a.value)
              .slice(0, 6)
              .map((item, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleTreemapClick(item)}
                >
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: colors[treemapData.indexOf(item) % colors.length] }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {item.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatValue(item.value)} ({((item.value / processedData.totalValue) * 100).toFixed(1)}%)
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </BaseVisual>
  );
};

export default HierarchicalChart;