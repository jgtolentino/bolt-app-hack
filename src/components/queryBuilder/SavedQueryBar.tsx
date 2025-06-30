import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  FolderOpen, 
  Trash2, 
  Play, 
  Clock, 
  Globe, 
  Tag,
  Search,
  Star,
  ChevronDown,
  Download
} from 'lucide-react';
import { useSavedQueries } from '../../features/savedQueries/useSavedQueries';
import ExportButton from '../common/ExportButton';
import type { QueryConfig } from '../../constants/registry';

interface SavedQueryBarProps {
  currentConfig: QueryConfig;
  onLoadQuery: (config: QueryConfig) => void;
  onRunQuery: () => void;
  userId?: string;
  queryResults?: any[];
  queryName?: string;
}

const SavedQueryBar: React.FC<SavedQueryBarProps> = ({
  currentConfig,
  onLoadQuery,
  onRunQuery,
  userId,
  queryResults,
  queryName: currentQueryName
}) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [queryName, setQueryName] = useState('');
  const [queryDescription, setQueryDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [activeTab, setActiveTab] = useState<'recent' | 'mine' | 'public'>('recent');

  const {
    queries,
    recentQueries,
    publicQueries,
    isLoading,
    saveQuery,
    loadQuery,
    deleteQuery,
    executeQuery
  } = useSavedQueries(userId);

  const handleSave = async () => {
    if (!queryName.trim()) return;

    try {
      await saveQuery(queryName, currentConfig, {
        description: queryDescription,
        is_public: isPublic,
        tags
      });
      
      // Reset form
      setQueryName('');
      setQueryDescription('');
      setIsPublic(false);
      setTags([]);
      setShowSaveDialog(false);
    } catch (err) {
      console.error('Failed to save query:', err);
    }
  };

  const handleLoad = async (queryId: string) => {
    try {
      const query = await loadQuery(queryId);
      if (query) {
        onLoadQuery(query.config);
        await executeQuery(queryId);
        setShowLoadDialog(false);
      }
    } catch (err) {
      console.error('Failed to load query:', err);
    }
  };

  const handleDelete = async (queryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this query?')) {
      await deleteQuery(queryId);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const getQueriesByTab = () => {
    switch (activeTab) {
      case 'recent':
        return recentQueries;
      case 'mine':
        return queries;
      case 'public':
        return publicQueries;
      default:
        return [];
    }
  };

  return (
    <>
      <div className="flex items-center space-x-2 mb-4">
        <button
          onClick={() => setShowSaveDialog(true)}
          className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save</span>
        </button>
        
        <button
          onClick={() => setShowLoadDialog(true)}
          className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FolderOpen className="w-4 h-4" />
          <span>Load</span>
          {recentQueries.length > 0 && (
            <span className="bg-primary-100 text-primary-700 text-xs px-1.5 py-0.5 rounded-full">
              {recentQueries.length}
            </span>
          )}
        </button>
        
        <button
          onClick={onRunQuery}
          className="flex items-center space-x-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Play className="w-4 h-4" />
          <span>Run</span>
        </button>
        
        {queryResults && queryResults.length > 0 && (
          <ExportButton
            data={queryResults}
            title={currentQueryName || 'Query Results'}
            subtitle={`${queryResults.length} records`}
            filters={currentConfig.filters?.reduce((acc, f) => ({
              ...acc,
              [f.dimension]: f.value
            }), {})}
            metadata={{
              metrics: currentConfig.metrics,
              dimensions: currentConfig.dimensions,
              queryDate: new Date().toISOString()
            }}
          />
        )}
      </div>

      {/* Save Dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSaveDialog(false)}
          >
            <motion.div
              className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Query</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Query Name
                  </label>
                  <input
                    type="text"
                    value={queryName}
                    onChange={(e) => setQueryName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., Monthly Sales by Region"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={queryDescription}
                    onChange={(e) => setQueryDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={2}
                    placeholder="What does this query analyze?"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Add tags..."
                    />
                    <button
                      onClick={handleAddTag}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                      >
                        <Tag className="w-3 h-3" />
                        <span>{tag}</span>
                        <button
                          onClick={() => setTags(tags.filter((_, i) => i !== idx))}
                          className="ml-1 hover:text-red-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 flex items-center">
                    <Globe className="w-4 h-4 mr-1" />
                    Make this query public
                  </span>
                </label>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!queryName.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 transition-colors"
                >
                  Save Query
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Load Dialog */}
      <AnimatePresence>
        {showLoadDialog && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLoadDialog(false)}
          >
            <motion.div
              className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] shadow-xl flex flex-col"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Load Saved Query</h3>
              
              {/* Tabs */}
              <div className="flex space-x-4 mb-4 border-b border-gray-200">
                {(['recent', 'mine', 'public'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2 px-1 text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? 'text-primary-600 border-b-2 border-primary-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab === 'recent' && <Clock className="w-4 h-4 inline mr-1" />}
                    {tab === 'mine' && <Star className="w-4 h-4 inline mr-1" />}
                    {tab === 'public' && <Globe className="w-4 h-4 inline mr-1" />}
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
              
              {/* Query List */}
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading queries...</div>
                ) : getQueriesByTab().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No queries found</div>
                ) : (
                  <div className="space-y-2">
                    {getQueriesByTab().map((query) => (
                      <div
                        key={query.id}
                        onClick={() => handleLoad(query.id)}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{query.query_name}</h4>
                            {query.description && (
                              <p className="text-sm text-gray-600 mt-1">{query.description}</p>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date(query.updated_at).toLocaleDateString()}
                              </span>
                              {query.execution_count > 0 && (
                                <span>Run {query.execution_count} times</span>
                              )}
                              {query.tags && query.tags.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  {query.tags.map((tag, idx) => (
                                    <span key={idx} className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDelete(query.id, e)}
                            className="ml-4 p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowLoadDialog(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SavedQueryBar;