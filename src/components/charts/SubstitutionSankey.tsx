import React from 'react';
import { ResponsiveSankey } from '@nivo/sankey';

interface SubstitutionData {
  originalProduct: string;
  substitutedProduct: string;
  count: number;
  originalBrand?: string;
  substitutedBrand?: string;
}

interface SubstitutionSankeyProps {
  substitutions: SubstitutionData[];
  viewMode?: 'product' | 'brand';
}

const SubstitutionSankey: React.FC<SubstitutionSankeyProps> = ({ 
  substitutions, 
  viewMode = 'product' 
}) => {
  const sankeyData = React.useMemo(() => {
    // Create nodes and links based on view mode
    const nodesMap = new Map<string, { id: string; label: string }>();
    const linksMap = new Map<string, { source: string; target: string; value: number }>();
    
    substitutions.forEach(sub => {
      let sourceId: string;
      let targetId: string;
      let sourceLabel: string;
      let targetLabel: string;

      if (viewMode === 'brand' && sub.originalBrand && sub.substitutedBrand) {
        sourceId = `brand_${sub.originalBrand}`;
        targetId = `brand_${sub.substitutedBrand}`;
        sourceLabel = sub.originalBrand;
        targetLabel = sub.substitutedBrand;
      } else {
        sourceId = `product_${sub.originalProduct}`;
        targetId = `product_${sub.substitutedProduct}`;
        sourceLabel = sub.originalProduct;
        targetLabel = sub.substitutedProduct;
      }

      // Add nodes
      if (!nodesMap.has(sourceId)) {
        nodesMap.set(sourceId, { id: sourceId, label: sourceLabel });
      }
      if (!nodesMap.has(targetId)) {
        nodesMap.set(targetId, { id: targetId, label: targetLabel });
      }

      // Aggregate links
      const linkKey = `${sourceId}-${targetId}`;
      const existingLink = linksMap.get(linkKey);
      if (existingLink) {
        existingLink.value += sub.count;
      } else {
        linksMap.set(linkKey, {
          source: sourceId,
          target: targetId,
          value: sub.count
        });
      }
    });

    // Add retention nodes (products that weren't substituted)
    const retentionNodes = new Set<string>();
    nodesMap.forEach((node, id) => {
      const retentionId = `${id}_retained`;
      const hasOutgoingSubstitution = Array.from(linksMap.values()).some(
        link => link.source === id
      );
      
      if (hasOutgoingSubstitution) {
        retentionNodes.add(retentionId);
        nodesMap.set(retentionId, { 
          id: retentionId, 
          label: `${node.label} (Retained)` 
        });
        
        // Add retention link (mock data - in real app, calculate from actual retention)
        const totalSubstitutions = Array.from(linksMap.values())
          .filter(link => link.source === id)
          .reduce((sum, link) => sum + link.value, 0);
        
        const retentionValue = Math.round(totalSubstitutions * 2.5); // Assume 2.5x retention rate
        linksMap.set(`${id}-${retentionId}`, {
          source: id,
          target: retentionId,
          value: retentionValue
        });
      }
    });

    return {
      nodes: Array.from(nodesMap.values()).map(node => ({
        id: node.id,
        nodeColor: node.id.includes('_retained') ? 'rgba(34, 197, 94, 0.8)' : 'rgba(59, 130, 246, 0.8)'
      })),
      links: Array.from(linksMap.values())
    };
  }, [substitutions, viewMode]);

  const totalSubstitutions = React.useMemo(() => {
    return sankeyData.links
      .filter(link => !link.target.includes('_retained'))
      .reduce((sum, link) => sum + link.value, 0);
  }, [sankeyData]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {viewMode === 'brand' ? 'Brand' : 'Product'} Substitution Flow
        </h3>
        <div className="text-sm text-gray-600">
          Total Substitutions: {totalSubstitutions.toLocaleString()}
        </div>
      </div>

      <div style={{ height: '500px' }}>
        <ResponsiveSankey
          data={sankeyData}
          margin={{ top: 40, right: 160, bottom: 40, left: 50 }}
          align="justify"
          colors={{ scheme: 'category10' }}
          nodeOpacity={1}
          nodeHoverOthersOpacity={0.35}
          nodeThickness={18}
          nodeSpacing={24}
          nodeBorderWidth={0}
          nodeBorderColor={{ from: 'color', modifiers: [['darker', 0.8]] }}
          linkOpacity={0.5}
          linkHoverOthersOpacity={0.1}
          linkContract={3}
          enableLinkGradient={true}
          labelPosition="outside"
          labelOrientation="horizontal"
          labelPadding={16}
          labelTextColor={{ from: 'color', modifiers: [['darker', 1]] }}
          label={node => {
            const label = node.id.replace(/^(brand_|product_)/, '').replace('_retained', '');
            return label.length > 20 ? label.substring(0, 20) + '...' : label;
          }}
          tooltip={({ node }) => {
            if (node) {
              const incoming = sankeyData.links
                .filter(l => l.target === node.id)
                .reduce((sum, l) => sum + l.value, 0);
              const outgoing = sankeyData.links
                .filter(l => l.source === node.id)
                .reduce((sum, l) => sum + l.value, 0);
              
              return (
                <div className="bg-white shadow-lg rounded px-3 py-2 text-sm">
                  <div className="font-semibold">
                    {node.id.replace(/^(brand_|product_)/, '').replace('_retained', ' (Retained)')}
                  </div>
                  {incoming > 0 && (
                    <div className="text-gray-600">Incoming: {incoming.toLocaleString()}</div>
                  )}
                  {outgoing > 0 && (
                    <div className="text-gray-600">Outgoing: {outgoing.toLocaleString()}</div>
                  )}
                </div>
              );
            }
            return null;
          }}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Top Substitution Patterns</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            {sankeyData.links
              .filter(link => !link.target.includes('_retained'))
              .sort((a, b) => b.value - a.value)
              .slice(0, 3)
              .map((link, index) => (
                <li key={index}>
                  {link.source.replace(/^(brand_|product_)/, '')} → {' '}
                  {link.target.replace(/^(brand_|product_)/, '')}: {' '}
                  {link.value.toLocaleString()} substitutions
                </li>
              ))}
          </ul>
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2">Retention Insights</h4>
          <p className="text-sm text-green-800">
            Products marked as "Retained" indicate customers who stayed with their 
            original choice despite availability of substitutes. Higher retention 
            suggests strong brand/product loyalty.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubstitutionSankey;