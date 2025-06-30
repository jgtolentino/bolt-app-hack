import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, FileSpreadsheet, ChevronDown, Loader2 } from 'lucide-react';
import { ExportService } from '../../utils/exportService';

interface ExportButtonProps {
  data: any[];
  title: string;
  subtitle?: string;
  columns?: string[];
  filters?: Record<string, any>;
  metadata?: Record<string, any>;
  chartRef?: React.RefObject<HTMLElement>;
  className?: string;
  buttonText?: string;
  onExportStart?: () => void;
  onExportComplete?: () => void;
  onExportError?: (error: Error) => void;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  title,
  subtitle,
  columns,
  filters,
  metadata,
  chartRef,
  className = '',
  buttonText = 'Export',
  onExportStart,
  onExportComplete,
  onExportError
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format: 'pdf' | 'excel') => {
    setIsExporting(true);
    setShowDropdown(false);
    
    try {
      onExportStart?.();
      
      let chartImage: string | undefined;
      
      // Capture chart image if ref provided
      if (chartRef?.current && format === 'pdf') {
        try {
          // In production, use html2canvas
          chartImage = await ExportService.chartToImage(chartRef.current);
        } catch (err) {
          console.warn('Failed to capture chart image:', err);
        }
      }
      
      // Prepare export options
      const exportOptions = {
        title,
        subtitle,
        data,
        columns,
        filters,
        metadata: {
          ...metadata,
          exportDate: new Date().toISOString(),
          recordCount: data.length,
          exportedBy: localStorage.getItem('authUser') || 'Unknown'
        },
        format,
        chartImage
      };
      
      // Perform export
      if (format === 'pdf') {
        await ExportService.exportToPDF(exportOptions);
      } else {
        await ExportService.exportToExcel(exportOptions);
      }
      
      onExportComplete?.();
    } catch (error) {
      console.error('Export failed:', error);
      onExportError?.(error as Error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <motion.button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isExporting || !data || data.length === 0}
        className={`
          flex items-center space-x-2 px-4 py-2 
          bg-white border border-gray-300 rounded-lg 
          hover:bg-gray-50 disabled:bg-gray-100 
          disabled:cursor-not-allowed transition-colors
          ${isExporting ? 'cursor-wait' : ''}
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">{buttonText}</span>
        <ChevronDown 
          className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} 
        />
      </motion.button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden"
          >
            <button
              onClick={() => handleExport('pdf')}
              className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <FileText className="w-5 h-5 text-red-600" />
              <div>
                <div className="text-sm font-medium text-gray-900">Export as PDF</div>
                <div className="text-xs text-gray-500">With charts & formatting</div>
              </div>
            </button>
            
            <button
              onClick={() => handleExport('excel')}
              className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-t border-gray-100"
            >
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-sm font-medium text-gray-900">Export as Excel</div>
                <div className="text-xs text-gray-500">Raw data for analysis</div>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export progress indicator */}
      {isExporting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg"
        >
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Exporting...</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ExportButton;