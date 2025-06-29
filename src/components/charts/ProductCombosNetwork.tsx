import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';

interface ProductCombo {
  products: string[];
  frequency: number;
  value: number;
}

interface ProductCombosNetworkProps {
  data?: ProductCombo[];
  width?: number;
  height?: number;
}

const ProductCombosNetwork: React.FC<ProductCombosNetworkProps> = ({ 
  data,
  width = 400,
  height = 300
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Default data if not provided
  const combos = data || [
    { products: ['Marlboro', 'Coke'], frequency: 67, value: 125 },
    { products: ['Palmolive', 'Safeguard'], frequency: 45, value: 89 },
    { products: ['Kopiko', 'Sky Flakes'], frequency: 38, value: 45 },
    { products: ['Chippy', 'C2'], frequency: 32, value: 55 },
    { products: ['Lucky Me', 'Egg'], frequency: 28, value: 42 },
    { products: ['Bear Brand', 'Pandesal'], frequency: 25, value: 38 }
  ];

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);
    const g = svg.append('g');

    // Create nodes from products
    const nodeMap = new Map<string, any>();
    const links: any[] = [];

    combos.forEach(combo => {
      combo.products.forEach(product => {
        if (!nodeMap.has(product)) {
          nodeMap.set(product, {
            id: product,
            value: 0,
            connections: 0
          });
        }
        nodeMap.get(product).value += combo.value;
        nodeMap.get(product).connections += 1;
      });

      // Create links between products in combo
      if (combo.products.length >= 2) {
        links.push({
          source: combo.products[0],
          target: combo.products[1],
          frequency: combo.frequency,
          value: combo.value
        });
      }
    });

    const nodes = Array.from(nodeMap.values());

    // Create color scale
    const colorScale = d3.scaleOrdinal()
      .domain(['food', 'beverage', 'personal', 'tobacco'])
      .range(['#3B82F6', '#10B981', '#F59E0B', '#EF4444']);

    // Categorize products
    const getCategory = (product: string) => {
      const categories: { [key: string]: string } = {
        'Marlboro': 'tobacco',
        'Coke': 'beverage',
        'C2': 'beverage',
        'Palmolive': 'personal',
        'Safeguard': 'personal',
        'Kopiko': 'beverage',
        'Sky Flakes': 'food',
        'Chippy': 'food',
        'Lucky Me': 'food',
        'Egg': 'food',
        'Bear Brand': 'beverage',
        'Pandesal': 'food'
      };
      return categories[product] || 'other';
    };

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id((d: any) => d.id)
        .distance(d => 100 - (d as any).frequency / 2))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Create links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#E5E7EB')
      .attr('stroke-width', d => Math.sqrt(d.frequency / 10))
      .attr('stroke-opacity', 0.6);

    // Create link labels
    const linkLabel = g.append('g')
      .selectAll('text')
      .data(links)
      .enter().append('text')
      .attr('font-size', '10px')
      .attr('fill', '#6B7280')
      .attr('text-anchor', 'middle')
      .text(d => `${d.frequency}%`);

    // Create nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add circles to nodes
    node.append('circle')
      .attr('r', d => 15 + Math.sqrt(d.value) / 3)
      .attr('fill', d => colorScale(getCategory(d.id)) as string)
      .attr('fill-opacity', 0.8)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add labels to nodes
    node.append('text')
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .attr('fill', 'white')
      .text(d => d.id.length > 8 ? d.id.substring(0, 6) + '...' : d.id);

    // Add tooltips
    node.append('title')
      .text(d => `${d.id}\nValue: ₱${d.value}\nConnections: ${d.connections}`);

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkLabel
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [combos, width, height]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-full"
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="w-full h-full"
        viewBox={`0 0 ${width} ${height}`}
      />
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Beverage</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Food</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Personal Care</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Tobacco</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCombosNetwork;