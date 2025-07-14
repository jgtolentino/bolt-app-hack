/**
 * Import Wizard Component
 * React UI for importing PowerBI and Tableau files
 */

import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, X, Info } from 'lucide-react';
import { ImportProgress, ImportResult, ImportError } from '../../packages/importers/types';

interface ImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (result: ImportResult) => void;
}

interface FileWithPreview {
  file: File;
  path?: string; // For Electron file paths
  preview: {
    name: string;
    size: string;
    type: string;
    extension: string;
  };
}

export const ImportWizard: React.FC<ImportWizardProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [currentStep, setCurrentStep] = useState<'select' | 'upload' | 'progress' | 'results'>('select');
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedExtensions = ['.pbix', '.pbit', '.pbip', '.twb', '.twbx', '.hyper'];
  const acceptString = supportedExtensions.join(',');

  const handleFileSelect = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: FileWithPreview[] = [];

    fileArray.forEach(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (supportedExtensions.includes(extension)) {
        validFiles.push({
          file,
          preview: {
            name: file.name,
            size: formatFileSize(file.size),
            type: getFileTypeDescription(extension),
            extension
          }
        });
      }
    });

    setSelectedFiles(validFiles);
    if (validFiles.length > 0) {
      setCurrentStep('upload');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  }, [handleFileSelect]);

  const startImport = async () => {
    if (selectedFiles.length === 0) return;

    setIsImporting(true);
    setCurrentStep('progress');
    setImportResults([]);

    try {
      for (const fileWithPreview of selectedFiles) {
        const { importBIFile } = await import('../../packages/importers');
        
        // For web environment, we need to handle File objects differently
        // In a real implementation, you'd upload to server or use File System Access API
        const filePath = fileWithPreview.path || fileWithPreview.file.name;
        
        const result = await importBIFile(filePath, (progress) => {
          setImportProgress(progress);
        });

        setImportResults(prev => [...prev, result]);
      }

      setCurrentStep('results');
    } catch (error: any) {
      console.error('Import failed:', error);
      setImportResults([{
        success: false,
        dataFrames: [],
        blueprints: [],
        metadata: {
          sourceFile: selectedFiles[0]?.file.name || 'unknown',
          fileType: 'unknown' as any,
          importedAt: new Date(),
          originalFileSize: 0,
          tablesCount: 0,
          visualsCount: 0,
          unsupportedVisualsCount: 0
        },
        errors: [{
          code: 'IMPORT_FAILED',
          message: error.message,
          severity: 'error'
        }]
      }]);
      setCurrentStep('results');
    } finally {
      setIsImporting(false);
    }
  };

  const resetWizard = () => {
    setCurrentStep('select');
    setSelectedFiles([]);
    setImportProgress(null);
    setImportResults([]);
    setIsImporting(false);
  };

  const handleComplete = () => {
    const successfulResults = importResults.filter(r => r.success);
    if (successfulResults.length > 0) {
      // For simplicity, pass the first successful result
      onImportComplete(successfulResults[0]);
    }
    onClose();
    resetWizard();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Import BI Files</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {currentStep === 'select' && (
            <FileSelectStep
              onFileSelect={handleFileSelect}
              onDrop={handleDrop}
              onFileInputChange={handleFileInputChange}
              fileInputRef={fileInputRef}
              acceptString={acceptString}
              supportedExtensions={supportedExtensions}
            />
          )}

          {currentStep === 'upload' && (
            <FileUploadStep
              selectedFiles={selectedFiles}
              onRemoveFile={(index) => {
                const newFiles = selectedFiles.filter((_, i) => i !== index);
                setSelectedFiles(newFiles);
                if (newFiles.length === 0) {
                  setCurrentStep('select');
                }
              }}
              onBack={() => setCurrentStep('select')}
              onStartImport={startImport}
              isImporting={isImporting}
            />
          )}

          {currentStep === 'progress' && (
            <ProgressStep
              progress={importProgress}
              selectedFiles={selectedFiles}
            />
          )}

          {currentStep === 'results' && (
            <ResultsStep
              results={importResults}
              onComplete={handleComplete}
              onStartOver={resetWizard}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const FileSelectStep: React.FC<{
  onFileSelect: (files: FileList) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  acceptString: string;
  supportedExtensions: string[];
}> = ({ onFileSelect, onDrop, onFileInputChange, fileInputRef, acceptString, supportedExtensions }) => {
  return (
    <div>
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium mb-2">Select BI Files to Import</h3>
        <p className="text-gray-600">
          Import PowerBI and Tableau files to convert them into Scout dashboards
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium mb-2">Drop files here or click to browse</p>
        <p className="text-gray-600 mb-4">
          Supported formats: {supportedExtensions.join(', ')}
        </p>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Choose Files
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptString}
        onChange={onFileInputChange}
        className="hidden"
      />

      {/* Supported Formats Info */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Supported File Types</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li><strong>.pbix, .pbit:</strong> PowerBI report and template files</li>
              <li><strong>.pbip:</strong> PowerBI project folders (drag entire folder)</li>
              <li><strong>.twb, .twbx:</strong> Tableau workbook files</li>
              <li><strong>.hyper:</strong> Tableau extract files</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const FileUploadStep: React.FC<{
  selectedFiles: FileWithPreview[];
  onRemoveFile: (index: number) => void;
  onBack: () => void;
  onStartImport: () => void;
  isImporting: boolean;
}> = ({ selectedFiles, onRemoveFile, onBack, onStartImport, isImporting }) => {
  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Review Selected Files</h3>
        <p className="text-gray-600">
          {selectedFiles.length} file(s) selected for import
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {selectedFiles.map((fileWithPreview, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-blue-600 mr-3" />
              <div>
                <div className="font-medium">{fileWithPreview.preview.name}</div>
                <div className="text-sm text-gray-600">
                  {fileWithPreview.preview.type} • {fileWithPreview.preview.size}
                </div>
              </div>
            </div>
            <button
              onClick={() => onRemoveFile(index)}
              className="p-1 hover:bg-gray-200 rounded"
              disabled={isImporting}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          disabled={isImporting}
        >
          Back
        </button>
        <button
          onClick={onStartImport}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          disabled={isImporting || selectedFiles.length === 0}
        >
          {isImporting ? 'Starting Import...' : 'Start Import'}
        </button>
      </div>
    </div>
  );
};

const ProgressStep: React.FC<{
  progress: ImportProgress | null;
  selectedFiles: FileWithPreview[];
}> = ({ progress, selectedFiles }) => {
  return (
    <div className="text-center">
      <h3 className="text-lg font-medium mb-6">Importing Files</h3>
      
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress?.progress || 0}%` }}
          />
        </div>
        <p className="text-sm text-gray-600">
          {progress?.message || 'Preparing import...'}
        </p>
      </div>

      <div className="text-left">
        <h4 className="font-medium mb-2">Processing:</h4>
        <div className="space-y-2">
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center text-sm">
              <div className="w-4 h-4 border-2 border-blue-600 rounded-full mr-2 flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              </div>
              {file.preview.name}
            </div>
          ))}
        </div>
      </div>

      {progress?.errors && progress.errors.length > 0 && (
        <div className="mt-6 p-4 bg-red-50 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2" />
            <div className="text-left">
              <h4 className="font-medium text-red-800 mb-2">Warnings</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {progress.errors.map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ResultsStep: React.FC<{
  results: ImportResult[];
  onComplete: () => void;
  onStartOver: () => void;
}> = ({ results, onComplete, onStartOver }) => {
  const successfulResults = results.filter(r => r.success);
  const failedResults = results.filter(r => !r.success);

  return (
    <div>
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium mb-2">Import Complete</h3>
        <p className="text-gray-600">
          {successfulResults.length} of {results.length} files imported successfully
        </p>
      </div>

      {/* Success Summary */}
      {successfulResults.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          <div className="flex items-start">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 mr-2" />
            <div>
              <h4 className="font-medium text-green-800 mb-2">Successfully Imported</h4>
              {successfulResults.map((result, index) => (
                <div key={index} className="text-sm text-green-700 mb-2">
                  <div className="font-medium">{result.metadata.sourceFile}</div>
                  <div>
                    {result.metadata.tablesCount} tables, {result.metadata.visualsCount} visuals
                    {result.metadata.unsupportedVisualsCount > 0 && 
                      ` (${result.metadata.unsupportedVisualsCount} unsupported)`
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error Summary */}
      {failedResults.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2" />
            <div>
              <h4 className="font-medium text-red-800 mb-2">Import Errors</h4>
              {failedResults.map((result, index) => (
                <div key={index} className="text-sm text-red-700 mb-2">
                  <div className="font-medium">{result.metadata.sourceFile}</div>
                  {result.errors?.map((error, errorIndex) => (
                    <div key={errorIndex}>{error.message}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onStartOver}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Import More Files
        </button>
        <button
          onClick={onComplete}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          disabled={successfulResults.length === 0}
        >
          Open Imported Dashboards
        </button>
      </div>
    </div>
  );
};

// Utility functions
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileTypeDescription(extension: string): string {
  const descriptions: Record<string, string> = {
    '.pbix': 'PowerBI Report',
    '.pbit': 'PowerBI Template',
    '.pbip': 'PowerBI Project',
    '.twb': 'Tableau Workbook',
    '.twbx': 'Tableau Packaged Workbook',
    '.hyper': 'Tableau Extract'
  };
  
  return descriptions[extension] || 'Unknown';
}