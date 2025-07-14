/**
 * Scout Dash 2.0 - Layout Toolbar
 * Toolbar for layout management with responsive controls
 */

import React, { useState } from 'react';
import {
  Grid3x3,
  Plus,
  RotateCcw,
  Shuffle,
  Trash2,
  Copy,
  Monitor,
  Smartphone,
  Tablet,
  Settings,
  ChevronDown
} from 'lucide-react';
import { Button } from '../../components/UI/Button';
import { Select } from '../../components/UI/Select';
import { Badge } from '../../components/UI/Badge';
import { DropdownMenu } from '../../components/UI/DropdownMenu';
import { VisualBlueprint, DashboardLayout } from '../types';
import { ResponsiveBreakpoints, BREAKPOINT_NAMES, BREAKPOINT_ICONS, BREAKPOINT_DESCRIPTIONS } from './ResponsiveBreakpoints';

export interface LayoutToolbarProps {
  currentBreakpoint: keyof ResponsiveBreakpoints;
  layouts: Record<keyof ResponsiveBreakpoints, DashboardLayout>;
  onBreakpointChange: (breakpoint: keyof ResponsiveBreakpoints) => void;
  onLayoutChange: (breakpoint: keyof ResponsiveBreakpoints, layout: DashboardLayout) => void;
  onAddItem: (item: Omit<VisualBlueprint, 'id'>) => string;
  onResetLayout: () => void;
  onAutoArrange: () => void;
  selectedItemId?: string;
  onRemoveSelectedItem: () => void;
  onDuplicateSelectedItem: () => string;
  enableResponsive: boolean;
}

const CHART_TEMPLATES = [
  {
    type: 'kpi.card',
    title: 'KPI Card',
    icon: '📊',
    layout: { x: 0, y: 0, w: 3, h: 2 }
  },
  {
    type: 'bar.vertical',
    title: 'Bar Chart',
    icon: '📊',
    layout: { x: 0, y: 0, w: 6, h: 4 }
  },
  {
    type: 'line.basic',
    title: 'Line Chart',
    icon: '📈',
    layout: { x: 0, y: 0, w: 8, h: 4 }
  },
  {
    type: 'pie.basic',
    title: 'Pie Chart',
    icon: '🥧',
    layout: { x: 0, y: 0, w: 4, h: 4 }
  },
  {
    type: 'table.basic',
    title: 'Data Table',
    icon: '📋',
    layout: { x: 0, y: 0, w: 8, h: 6 }
  }
];

export const LayoutToolbar: React.FC<LayoutToolbarProps> = ({
  currentBreakpoint,
  layouts,
  onBreakpointChange,
  onLayoutChange,
  onAddItem,
  onResetLayout,
  onAutoArrange,
  selectedItemId,
  onRemoveSelectedItem,
  onDuplicateSelectedItem,
  enableResponsive
}) => {
  const [showLayoutSettings, setShowLayoutSettings] = useState(false);

  const currentLayout = layouts[currentBreakpoint];

  const handleAddChart = (template: typeof CHART_TEMPLATES[0]) => {
    onAddItem({
      type: template.type,
      title: template.title,
      layout: template.layout,
      config: {},
      data: { query: '', params: {} }
    });
  };

  const handleLayoutSettingChange = (key: keyof DashboardLayout, value: any) => {
    const updatedLayout = {
      ...currentLayout,
      [key]: value
    };
    onLayoutChange(currentBreakpoint, updatedLayout);
  };

  const getBreakpointIcon = (breakpoint: keyof ResponsiveBreakpoints) => {
    switch (breakpoint) {
      case 'xs':
      case 'sm':
        return <Smartphone className="w-4 h-4" />;
      case 'md':
        return <Tablet className="w-4 h-4" />;
      case 'lg':
      case 'xl':
        return <Monitor className="w-4 h-4" />;
      default:
        return <Grid3x3 className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-wrap gap-2">
      {/* Left Section - Add Items */}
      <div className="flex items-center space-x-2">
        <DropdownMenu
          trigger={
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Chart
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          }
          items={CHART_TEMPLATES.map(template => ({
            label: (
              <div className="flex items-center space-x-2">
                <span>{template.icon}</span>
                <span>{template.title}</span>
              </div>
            ),
            onClick: () => handleAddChart(template)
          }))}
        />

        {selectedItemId && (
          <div className="flex items-center space-x-1">
            <Button
              onClick={onDuplicateSelectedItem}
              variant="ghost"
              size="sm"
              title="Duplicate selected item"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              onClick={onRemoveSelectedItem}
              variant="ghost"
              size="sm"
              title="Remove selected item"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Center Section - Responsive Controls */}
      {enableResponsive && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Breakpoint:</span>
          <Select
            value={currentBreakpoint}
            onValueChange={onBreakpointChange}
            options={Object.entries(BREAKPOINT_NAMES).map(([key, name]) => ({
              value: key,
              label: (
                <div className="flex items-center space-x-2">
                  {getBreakpointIcon(key as keyof ResponsiveBreakpoints)}
                  <span>{name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {BREAKPOINT_DESCRIPTIONS[key as keyof ResponsiveBreakpoints]}
                  </Badge>
                </div>
              )
            }))}
          />
          <Badge variant="outline" className="text-xs">
            {currentLayout.columns} cols
          </Badge>
        </div>
      )}

      {/* Right Section - Layout Actions */}
      <div className="flex items-center space-x-2">
        <Button
          onClick={onAutoArrange}
          variant="ghost"
          size="sm"
          title="Auto-arrange items"
        >
          <Shuffle className="w-4 h-4" />
        </Button>

        <Button
          onClick={onResetLayout}
          variant="ghost"
          size="sm"
          title="Reset layout"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        <DropdownMenu
          trigger={
            <Button variant="ghost" size="sm" title="Layout settings">
              <Settings className="w-4 h-4" />
            </Button>
          }
          items={[
            {
              label: 'Layout Settings',
              disabled: true
            },
            {
              label: (
                <div className="p-3 space-y-3 min-w-[250px]">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Columns
                    </label>
                    <Select
                      value={currentLayout.columns.toString()}
                      onValueChange={(value) => handleLayoutSettingChange('columns', parseInt(value))}
                      options={[
                        { value: '6', label: '6 columns' },
                        { value: '8', label: '8 columns' },
                        { value: '12', label: '12 columns' },
                        { value: '16', label: '16 columns' },
                        { value: '24', label: '24 columns' }
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Row Height
                    </label>
                    <Select
                      value={currentLayout.rowHeight.toString()}
                      onValueChange={(value) => handleLayoutSettingChange('rowHeight', parseInt(value))}
                      options={[
                        { value: '60', label: '60px' },
                        { value: '80', label: '80px' },
                        { value: '100', label: '100px' },
                        { value: '120', label: '120px' },
                        { value: '150', label: '150px' }
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Margin
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        value={currentLayout.margin[0]}
                        onChange={(e) => handleLayoutSettingChange('margin', [
                          parseInt(e.target.value),
                          currentLayout.margin[1]
                        ])}
                        className="w-20 px-2 py-1 text-sm border rounded"
                        placeholder="X"
                      />
                      <input
                        type="number"
                        value={currentLayout.margin[1]}
                        onChange={(e) => handleLayoutSettingChange('margin', [
                          currentLayout.margin[0],
                          parseInt(e.target.value)
                        ])}
                        className="w-20 px-2 py-1 text-sm border rounded"
                        placeholder="Y"
                      />
                    </div>
                  </div>
                </div>
              ),
              customContent: true
            }
          ]}
        />
      </div>
    </div>
  );
};

export default LayoutToolbar;