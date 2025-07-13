import React from 'react';
import Plot from 'react-plotly.js';

interface BoxPlotProps {
  data: number[];
  title: string;
  yAxisLabel?: string;
  color?: string;
}

const BoxPlot: React.FC<BoxPlotProps> = ({ 
  data, 
  title, 
  yAxisLabel = 'Value',
  color = '#3B82F6' 
}) => {
  // Calculate statistics for annotation
  const stats = React.useMemo(() => {
    if (data.length === 0) return null;
    
    const sorted = [...data].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const medianIndex = Math.floor(sorted.length * 0.5);
    const q3Index = Math.floor(sorted.length * 0.75);
    
    return {
      min: sorted[0],
      q1: sorted[q1Index],
      median: sorted[medianIndex],
      q3: sorted[q3Index],
      max: sorted[sorted.length - 1],
      mean: data.reduce((sum, val) => sum + val, 0) / data.length,
      count: data.length
    };
  }, [data]);

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded p-3">
          <p className="text-sm text-gray-600">Sample Size</p>
          <p className="text-xl font-bold">{stats.count.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 rounded p-3">
          <p className="text-sm text-gray-600">Mean Value</p>
          <p className="text-xl font-bold">₱{stats.mean.toFixed(2)}</p>
        </div>
      </div>

      <Plot
        data={[
          {
            y: data,
            type: 'box' as const,
            name: yAxisLabel,
            marker: { 
              color: color,
              outliercolor: 'rgba(219, 64, 82, 0.6)',
              line: {
                outliercolor: 'rgba(219, 64, 82, 1)',
                outlierwidth: 2
              }
            },
            boxpoints: 'outliers' as const,
            jitter: 0.3,
            pointpos: -1.8,
            boxmean: 'sd' as const,
            hovertemplate: '%{y}<extra></extra>'
          }
        ]}
        layout={{
          autosize: true,
          height: 400,
          margin: { t: 20, r: 20, b: 40, l: 60 },
          yaxis: {
            title: {
              text: yAxisLabel
            },
            tickformat: ',.0f',
            tickprefix: '₱'
          },
          xaxis: {
            showticklabels: false
          },
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
          hovermode: 'closest' as const
        }}
        config={{
          displayModeBar: false,
          responsive: true
        }}
        className="w-full"
      />

      <div className="mt-4 grid grid-cols-5 gap-2 text-center">
        <div className="bg-gray-50 rounded p-2">
          <p className="text-xs text-gray-500">Min</p>
          <p className="font-semibold">₱{stats.min.toFixed(2)}</p>
        </div>
        <div className="bg-blue-50 rounded p-2">
          <p className="text-xs text-gray-500">Q1</p>
          <p className="font-semibold">₱{stats.q1.toFixed(2)}</p>
        </div>
        <div className="bg-blue-100 rounded p-2">
          <p className="text-xs text-gray-500">Median</p>
          <p className="font-semibold text-blue-700">₱{stats.median.toFixed(2)}</p>
        </div>
        <div className="bg-blue-50 rounded p-2">
          <p className="text-xs text-gray-500">Q3</p>
          <p className="font-semibold">₱{stats.q3.toFixed(2)}</p>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <p className="text-xs text-gray-500">Max</p>
          <p className="font-semibold">₱{stats.max.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default BoxPlot;