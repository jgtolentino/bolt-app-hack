import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Mail, Calendar, CheckCircle } from 'lucide-react';

interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  format: 'pdf' | 'ppt' | 'excel';
  sections: string[];
  schedule?: 'daily' | 'weekly' | 'monthly';
}

interface ExportManagerProps {
  onExport: (template: ExportTemplate) => void;
  availableData?: string[];
}

const ExportManager: React.FC<ExportManagerProps> = ({
  onExport,
  availableData = []
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const templates: ExportTemplate[] = [
    {
      id: 'executive-weekly',
      name: 'Executive Weekly Report',
      description: 'Monday morning snapshot for C-suite',
      format: 'ppt',
      sections: ['Market Share', 'Revenue Trends', 'Competitive Analysis', 'Action Items'],
      schedule: 'weekly'
    },
    {
      id: 'sales-performance',
      name: 'Sales Performance Dashboard',
      description: 'Detailed sales analysis with regional breakdown',
      format: 'pdf',
      sections: ['Sales Overview', 'Brand Performance', 'Regional Analysis', 'SKU Health']
    },
    {
      id: 'inventory-report',
      name: 'Inventory & Stock Report',
      description: 'Stock levels, reorder alerts, and velocity analysis',
      format: 'excel',
      sections: ['Stock Levels', 'Reorder Points', 'Dead Stock', 'Velocity Trends']
    },
    {
      id: 'competitor-intelligence',
      name: 'Competitive Intelligence Brief',
      description: 'Market share movements and competitor activities',
      format: 'ppt',
      sections: ['Market Share Changes', 'Price Comparisons', 'New Product Launches', 'Regional Wins/Losses']
    }
  ];

  const handleExport = async (template: ExportTemplate) => {
    setIsExporting(true);
    setExportSuccess(false);
    
    // Simulate export process
    setTimeout(() => {
      onExport(template);
      setIsExporting(false);
      setExportSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => setExportSuccess(false), 3000);
    }, 2000);
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'ppt': return '📊';
      case 'pdf': return '📄';
      case 'excel': return '📈';
      default: return '📋';
    }
  };

  const getFormatColor = (format: string) => {
    switch (format) {
      case 'ppt': return 'bg-orange-100 text-orange-700';
      case 'pdf': return 'bg-red-100 text-red-700';
      case 'excel': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Export & Reporting Center</h3>
        {exportSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center space-x-2 text-green-600"
          >
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Export successful!</span>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <motion.div
            key={template.id}
            whileHover={{ scale: 1.02 }}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedTemplate === template.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedTemplate(template.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{getFormatIcon(template.format)}</span>
                <div>
                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getFormatColor(template.format)}`}>
                    {template.format.toUpperCase()}
                  </span>
                </div>
              </div>
              {template.schedule && (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>{template.schedule}</span>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-600 mb-3">{template.description}</p>

            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-700">Includes:</p>
              <div className="flex flex-wrap gap-1">
                {template.sections.map((section) => (
                  <span
                    key={section}
                    className="text-xs px-2 py-0.5 bg-gray-100 rounded"
                  >
                    {section}
                  </span>
                ))}
              </div>
            </div>

            {selectedTemplate === template.id && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex space-x-2"
              >
                <button
                  onClick={() => handleExport(template)}
                  disabled={isExporting}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {isExporting ? 'Generating...' : 'Export Now'}
                  </span>
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Mail className="w-4 h-4 text-gray-600" />
                </button>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h4>
        <div className="grid grid-cols-3 gap-2">
          <button className="px-3 py-2 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50">
            Schedule Reports
          </button>
          <button className="px-3 py-2 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50">
            Email Settings
          </button>
          <button className="px-3 py-2 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50">
            Custom Template
          </button>
        </div>
      </div>

      {/* Available Data Notice */}
      {availableData.length > 0 && (
        <div className="mt-4 text-xs text-gray-500">
          <span className="font-medium">Available data:</span> {availableData.join(', ')}
        </div>
      )}
    </motion.div>
  );
};

export default ExportManager;