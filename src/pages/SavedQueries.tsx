import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Clock, Share2, Lock, Download, Play, Trash2, Copy } from 'lucide-react';

interface SavedQuery {
  id: string;
  name: string;
  description: string;
  query: string;
  createdAt: Date;
  lastRun: Date;
  visibility: 'private' | 'public';
  resultCount?: number;
  tags: string[];
}

const SavedQueries: React.FC = () => {
  const [selectedQuery, setSelectedQuery] = useState<SavedQuery | null>(null);

  // Mock saved queries
  const savedQueries: SavedQuery[] = [
    {
      id: '1',
      name: 'Weekly Sales by Region',
      description: 'Aggregated sales data broken down by region for the past 7 days',
      query: 'SELECT region, SUM(total_amount) as sales FROM transactions WHERE datetime >= NOW() - INTERVAL 7 DAY GROUP BY region',
      createdAt: new Date('2024-01-15'),
      lastRun: new Date('2024-01-20'),
      visibility: 'public',
      resultCount: 18,
      tags: ['sales', 'regional', 'weekly']
    },
    {
      id: '2',
      name: 'Top Substituted Products',
      description: 'Products with highest substitution rates in the last month',
      query: 'WITH substitutions AS (...) SELECT * FROM substitutions ORDER BY rate DESC LIMIT 20',
      createdAt: new Date('2024-01-10'),
      lastRun: new Date('2024-01-19'),
      visibility: 'private',
      resultCount: 20,
      tags: ['products', 'substitution', 'analysis']
    },
    {
      id: '3',
      name: 'GCash Adoption Trend',
      description: 'Monthly trend of GCash payment adoption across all stores',
      query: 'SELECT DATE_TRUNC(\'month\', datetime) as month, COUNT(*) FROM transactions WHERE payment_method = \'GCash\' GROUP BY month',
      createdAt: new Date('2024-01-08'),
      lastRun: new Date('2024-01-18'),
      visibility: 'public',
      resultCount: 12,
      tags: ['payments', 'gcash', 'trends']
    }
  ];

  const exportFormats = [
    { format: 'JSON', icon: '{ }', color: 'bg-blue-100 text-blue-700' },
    { format: 'CSV', icon: '⊞', color: 'bg-green-100 text-green-700' },
    { format: 'PPT', icon: '▢', color: 'bg-orange-100 text-orange-700' }
  ];

  return (
    <div className="space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-gray-900">Saved Queries & Analyst Views</h1>
        <p className="text-gray-600">Empower advanced users with memory and reusability</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Query List */}
        <motion.div
          className="lg:col-span-2 space-y-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Query History</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {savedQueries.map((query) => (
                <motion.div
                  key={query.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedQuery?.id === query.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedQuery(query)}
                  whileHover={{ x: 4 }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 flex items-center space-x-2">
                        <span>{query.name}</span>
                        {query.visibility === 'public' ? (
                          <Share2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <Lock className="w-4 h-4 text-gray-400" />
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{query.description}</p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button className="p-1 hover:bg-gray-200 rounded">
                        <Play className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-200 rounded">
                        <Copy className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-200 rounded">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Last run: {query.lastRun.toLocaleDateString()}</span>
                    </span>
                    {query.resultCount && (
                      <span>{query.resultCount} results</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {query.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Query Details */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {selectedQuery ? (
            <>
              {/* Replay Controls */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Replay Controls</h3>
                <div className="space-y-3">
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2">
                    <Play className="w-4 h-4" />
                    <span>Run Query</span>
                  </button>
                  <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-2">
                    <Save className="w-4 h-4" />
                    <span>Save Results</span>
                  </button>
                </div>
              </div>

              {/* Export Options */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Export Options</h3>
                <div className="grid grid-cols-3 gap-2">
                  {exportFormats.map((format) => (
                    <button
                      key={format.format}
                      className={`p-3 rounded-lg ${format.color} hover:opacity-80 transition-opacity`}
                    >
                      <div className="text-lg font-bold">{format.icon}</div>
                      <div className="text-xs mt-1">{format.format}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Visibility Toggle */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Sharing Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Make Public</span>
                    <input
                      type="checkbox"
                      checked={selectedQuery.visibility === 'public'}
                      className="toggle"
                      readOnly
                    />
                  </label>
                  <p className="text-xs text-gray-500">
                    Public queries can be accessed by all team members
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <Save className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Select a query to view details</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Query Editor */}
      {selectedQuery && (
        <motion.div
          className="bg-white rounded-lg shadow p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="font-semibold text-gray-900 mb-4">Query Editor</h3>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
            <pre className="whitespace-pre-wrap">{selectedQuery.query}</pre>
          </div>
          <div className="mt-4 flex justify-end space-x-3">
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              Edit Query
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Save Changes
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SavedQueries;