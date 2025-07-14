/**
 * Scout Dash 2.0 - Sankey Diagram
 * Flow visualization using D3 Sankey for process and flow analysis
 * Inspired by retail-insights-dashboard-ph
 */

import React, { useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal, sankeyLeft, sankeyJustify } from 'd3-sankey';
import { BaseVisual } from '../BaseVisual';
import { VisualBlueprint } from '../../../types';

export interface SankeyDiagramProps {
  blueprint: VisualBlueprint;
  data: any[];
  width?: number;
  height?: number;
  onSelectionChange?: (selection: any) => void;
}

interface SankeyNode {
  id: string;
  name: string;
  category?: string;
  value?: number;
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
  category?: string;
}

interface ProcessedSankeyData {
  nodes: (SankeyNode & { x0?: number; x1?: number; y0?: number; y1?: number })[];
  links: (SankeyLink & { source: any; target: any; y0?: number; y1?: number })[];
}

export const SankeyDiagram: React.FC<SankeyDiagramProps> = ({
  blueprint,
  data,
  width = 800,
  height = 400,
  onSelectionChange
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const processedData = useMemo((): ProcessedSankeyData => {
    if (!data || data.length === 0) {
      return { nodes: [], links: [] };
    }

    const sourceField = blueprint.encoding.x?.field || 'source';
    const targetField = blueprint.encoding.y?.field || 'target';
    const valueField = blueprint.encoding.size?.field || 'value';

    // Extract unique nodes
    const nodeSet = new Set<string>();
    data.forEach(item => {
      if (item[sourceField]) nodeSet.add(item[sourceField]);
      if (item[targetField]) nodeSet.add(item[targetField]);
    });

    const nodes: SankeyNode[] = Array.from(nodeSet).map(id => ({
      id,
      name: id,
      category: 'default'
    }));

    // Process links
    const links: SankeyLink[] = data
      .filter(item => item[sourceField] && item[targetField] && item[valueField] > 0)
      .map(item => ({
        source: item[sourceField],
        target: item[targetField],
        value: item[valueField] || 0,
        category: item.category || 'default'
      }));

    return { nodes, links };
  }, [data, blueprint.encoding]);

  useEffect(() => {
    if (!svgRef.current || !processedData.nodes.length || !processedData.links.length) {
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create sankey generator
    const sankeyGenerator = sankey()
      .nodeId((d: any) => d.id)
      .nodeAlign(sankeyJustify)
      .nodeWidth(15)
      .nodePadding(10)
      .extent([[1, 1], [innerWidth - 1, innerHeight - 6]]);

    // Generate sankey layout
    const sankeyData = sankeyGenerator({
      nodes: processedData.nodes.map(d => ({ ...d })),
      links: processedData.links.map(d => ({ ...d }))
    });

    // Color scales
    const nodeColorScale = d3.scaleOrdinal()
      .domain(['default', 'source', 'target', 'intermediate'])
      .range(['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']);

    const linkColorScale = d3.scaleOrdinal()
      .domain(['default', 'primary', 'secondary'])
      .range(['#94a3b8', '#3b82f6', '#10b981']);

    // Add links
    const link = g
      .append('g')
      .selectAll('.link')
      .data(sankeyData.links)
      .join('path')
      .attr('class', 'link')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', (d: any) => linkColorScale(d.category || 'default'))
      .attr('stroke-width', (d: any) => Math.max(1, d.width || 0))
      .attr('stroke-opacity', 0.7)
      .attr('fill', 'none')
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d: any) {
        d3.select(this).attr('stroke-opacity', 1);
        
        // Show tooltip
        const tooltip = d3.select('body')
          .append('div')
          .attr('class', 'sankey-tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.8)')
          .style('color', 'white')
          .style('padding', '8px')
          .style('border-radius', '4px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('z-index', '1000')
          .html(`
            <div><strong>${d.source.name} → ${d.target.name}</strong></div>
            <div>Value: ${d.value.toLocaleString()}</div>
          `);

        tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function(event, d: any) {
        d3.select(this).attr('stroke-opacity', 0.7);
        d3.selectAll('.sankey-tooltip').remove();
      })
      .on('click', function(event, d: any) {
        if (onSelectionChange) {
          onSelectionChange({
            type: 'sankey-link',
            source: d.source.name,
            target: d.target.name,
            value: d.value,
            originalData: d
          });
        }
      });

    // Add nodes
    const node = g
      .append('g')
      .selectAll('.node')
      .data(sankeyData.nodes)
      .join('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => `translate(${d.x0},${d.y0})`)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d: any) {
        // Highlight connected links
        link
          .attr('stroke-opacity', (linkData: any) => 
            linkData.source === d || linkData.target === d ? 1 : 0.3
          );

        // Show node tooltip
        const tooltip = d3.select('body')
          .append('div')
          .attr('class', 'sankey-tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.8)')
          .style('color', 'white')
          .style('padding', '8px')
          .style('border-radius', '4px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('z-index', '1000')
          .html(`
            <div><strong>${d.name}</strong></div>
            <div>Total Value: ${d.value?.toLocaleString() || 'N/A'}</div>
          `);

        tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function(event, d: any) {
        link.attr('stroke-opacity', 0.7);
        d3.selectAll('.sankey-tooltip').remove();
      })
      .on('click', function(event, d: any) {
        if (onSelectionChange) {
          onSelectionChange({
            type: 'sankey-node',
            node: d.name,
            value: d.value,
            originalData: d
          });
        }
      });

    // Add node rectangles
    node
      .append('rect')
      .attr('height', (d: any) => d.y1 - d.y0)
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('fill', (d: any) => nodeColorScale(d.category || 'default'))
      .attr('stroke', '#000')
      .attr('stroke-width', 0.5)
      .attr('rx', 2);

    // Add node labels
    node
      .append('text')
      .attr('x', (d: any) => (d.x1 - d.x0) / 2)
      .attr('y', (d: any) => (d.y1 - d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', 'white')
      .text((d: any) => d.name.length > 10 ? d.name.substring(0, 10) + '...' : d.name);

    // Add external labels for nodes
    node
      .append('text')
      .attr('x', (d: any) => d.x0 < innerWidth / 2 ? (d.x1 - d.x0) + 6 : -6)
      .attr('y', (d: any) => (d.y1 - d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d: any) => d.x0 < innerWidth / 2 ? 'start' : 'end')
      .attr('font-size', '11px')
      .attr('fill', '#374151')
      .text((d: any) => d.name);

  }, [processedData, width, height, onSelectionChange]);

  if (!processedData.nodes.length || !processedData.links.length) {
    return (
      <BaseVisual blueprint={blueprint} width={width} height={height}>
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <div className="text-lg font-medium">No Flow Data Available</div>
            <div className="text-sm">Unable to generate Sankey diagram</div>
          </div>
        </div>
      </BaseVisual>
    );
  }

  return (
    <BaseVisual blueprint={blueprint} width={width} height={height}>
      <div className="space-y-4">
        {/* Summary Statistics */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {processedData.nodes.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Nodes
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {processedData.links.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Connections
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {processedData.links.reduce((sum, link) => sum + link.value, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Flow
            </div>
          </div>
        </div>

        {/* Sankey Diagram */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <svg
            ref={svgRef}
            width={width}
            height={height}
            className="w-full h-auto border border-gray-200 dark:border-gray-700 rounded"
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Default Nodes</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-2 bg-gray-400 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Flow Connections</span>
          </div>
        </div>
      </div>
    </BaseVisual>
  );
};

export default SankeyDiagram;