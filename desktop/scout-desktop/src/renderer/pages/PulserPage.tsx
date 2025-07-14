/**
 * Scout Desktop - Pulser AI Page
 * Interface for Pulser AI analytics and dashboard generation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Brain, 
  Play, 
  Square, 
  BarChart3, 
  FileText, 
  Zap, 
  MessageSquare,
  Settings,
  Upload,
  Download,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { TextArea } from '../components/UI/TextArea';
import { Select } from '../components/UI/Select';
import { Badge } from '../components/UI/Badge';
import { CodeEditor } from '../components/UI/CodeEditor';
import { DataViewer } from '../components/UI/DataViewer';
import { useToast } from '../components/UI/ToastProvider';

interface PulserStatus {
  running: boolean;
  config: any;
  workspace: string;
  connections: {
    process: boolean;
    websocket: boolean;
  };
}

interface AnalysisResult {
  id: string;
  type: string;
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    model: string;
    timestamp: string;
    processingTime: number;
  };
}

export const PulserPage: React.FC = () => {
  const [status, setStatus] = useState<PulserStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisType, setAnalysisType] = useState<'analyze' | 'generate' | 'optimize'>('analyze');
  const [inputText, setInputText] = useState('');
  const [uploadedData, setUploadedData] = useState<any[] | null>(null);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null);
  const { showToast } = useToast();

  // Load Pulser status
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const pulserStatus = await window.electronAPI.pulser.status();
        setStatus(pulserStatus);
      } catch (error) {
        console.error('Failed to load Pulser status:', error);
        showToast('Failed to load Pulser status', 'error');
      }
    };

    loadStatus();
    const interval = setInterval(loadStatus, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [showToast]);

  const handleStartPulser = async () => {
    setIsLoading(true);
    try {
      await window.electronAPI.pulser.start({
        model: 'claude-3-5-sonnet',
        temperature: 0.7
      });
      showToast('Pulser AI started successfully', 'success');
      
      // Refresh status
      const newStatus = await window.electronAPI.pulser.status();
      setStatus(newStatus);
    } catch (error) {
      console.error('Failed to start Pulser:', error);
      showToast('Failed to start Pulser AI', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopPulser = async () => {
    setIsLoading(true);
    try {
      await window.electronAPI.pulser.stop();
      showToast('Pulser AI stopped', 'success');
      
      // Refresh status
      const newStatus = await window.electronAPI.pulser.status();
      setStatus(newStatus);
    } catch (error) {
      console.error('Failed to stop Pulser:', error);
      showToast('Failed to stop Pulser AI', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAnalysis = async () => {
    if (!inputText.trim() && !uploadedData) {
      showToast('Please provide input text or upload data', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      let result: any;

      switch (analysisType) {
        case 'analyze':
          result = await window.electronAPI.pulser.execute({
            type: 'analyze',
            input: inputText,
            context: { data: uploadedData },
            options: {
              includeVisualization: true,
              generateInsights: true
            }
          });
          break;
          
        case 'generate':
          result = await window.electronAPI.pulser.execute({
            type: 'generate',
            input: inputText,
            context: { data: uploadedData, type: 'dashboard' },
            options: {
              outputFormat: 'scout-blueprint',
              includeCharts: true
            }
          });
          break;
          
        case 'optimize':
          result = await window.electronAPI.pulser.execute({
            type: 'optimize',
            input: inputText,
            context: { data: uploadedData },
            options: {
              optimizationType: 'performance',
              includeRecommendations: true
            }
          });
          break;
      }

      const analysisResult: AnalysisResult = {
        id: `analysis_${Date.now()}`,
        type: analysisType,
        success: result.success,
        data: result.data,
        error: result.error,
        metadata: {
          model: 'claude-3-5-sonnet',
          timestamp: new Date().toISOString(),
          processingTime: 0
        }
      };

      setResults(prev => [analysisResult, ...prev]);
      setSelectedResult(analysisResult);
      
      if (result.success) {
        showToast('Analysis completed successfully', 'success');
      } else {
        showToast('Analysis failed: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      showToast('Analysis execution failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = useCallback(async () => {
    try {
      const filePath = await window.electronAPI.fs.selectFile([
        { name: 'CSV Files', extensions: ['csv'] },
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'Excel Files', extensions: ['xlsx', 'xls'] }
      ]);

      if (filePath) {
        const content = await window.electronAPI.fs.readFile(filePath);
        
        // Parse based on file extension
        let data: any[] = [];
        if (filePath.endsWith('.json')) {
          data = JSON.parse(content);
        } else if (filePath.endsWith('.csv')) {
          // Simple CSV parsing (in reality, you'd use a proper CSV parser)
          const lines = content.split('\n');
          const headers = lines[0].split(',');
          data = lines.slice(1).map(line => {
            const values = line.split(',');
            return headers.reduce((obj: any, header, index) => {
              obj[header.trim()] = values[index]?.trim();
              return obj;
            }, {});
          });
        }

        setUploadedData(data);
        showToast(`Loaded ${data.length} rows of data`, 'success');
      }
    } catch (error) {
      console.error('File upload failed:', error);
      showToast('Failed to upload file', 'error');
    }
  }, [showToast]);

  const handleExportResult = async (result: AnalysisResult) => {
    try {
      const fileName = `pulser_${result.type}_${result.id}.json`;
      const content = JSON.stringify(result, null, 2);
      
      // In a real app, you'd use a save dialog
      await window.electronAPI.fs.writeFile(`/tmp/${fileName}`, content);
      showToast(`Result exported to ${fileName}`, 'success');
    } catch (error) {
      console.error('Export failed:', error);
      showToast('Failed to export result', 'error');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Pulser AI
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Intelligent analytics and dashboard generation
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {status && (
            <Badge variant={status.running ? 'success' : 'secondary'}>
              {status.running ? 'Running' : 'Stopped'}
            </Badge>
          )}
          
          {status?.running ? (
            <Button 
              onClick={handleStopPulser} 
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop
            </Button>
          ) : (
            <Button 
              onClick={handleStartPulser} 
              disabled={isLoading}
              size="sm"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Pulser
            </Button>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Process Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {status?.connections.process ? 'Connected' : 'Disconnected'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              WebSocket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {status?.connections.websocket ? 'Active' : 'Inactive'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Sparkles className="w-4 h-4 mr-2" />
              Analyses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {results.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Analysis Input
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Analysis Type */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Analysis Type
              </label>
              <Select
                value={analysisType}
                onValueChange={(value: any) => setAnalysisType(value)}
                options={[
                  { value: 'analyze', label: 'Analyze Data' },
                  { value: 'generate', label: 'Generate Dashboard' },
                  { value: 'optimize', label: 'Optimize Performance' }
                ]}
              />
            </div>

            {/* Input Text */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Question or Request
              </label>
              <TextArea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={getPlaceholderText(analysisType)}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Data Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Data (Optional)
              </label>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleFileUpload}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload CSV/JSON
                </Button>
                {uploadedData && (
                  <Badge variant="success">
                    {uploadedData.length} rows
                  </Badge>
                )}
              </div>
            </div>

            {/* Execute Button */}
            <Button
              onClick={handleExecuteAnalysis}
              disabled={isLoading || !status?.running}
              className="w-full"
            >
              <Zap className="w-4 h-4 mr-2" />
              {isLoading ? 'Processing...' : 'Execute Analysis'}
            </Button>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No analyses yet. Run your first analysis to see results here.
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedResult?.id === result.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedResult(result)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant={result.success ? 'success' : 'destructive'}>
                          {result.type}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {new Date(result.metadata?.timestamp || '').toLocaleTimeString()}
                        </span>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportResult(result);
                        }}
                        variant="ghost"
                        size="sm"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="mt-2 text-sm">
                      {result.success ? 'Analysis completed' : `Error: ${result.error}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Selected Result Detail */}
      {selectedResult && (
        <Card>
          <CardHeader>
            <CardTitle>
              Analysis Result: {selectedResult.type}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedResult.success ? (
              <div className="space-y-4">
                {selectedResult.data && (
                  <div>
                    <h4 className="font-medium mb-2">Result Data:</h4>
                    <CodeEditor
                      value={JSON.stringify(selectedResult.data, null, 2)}
                      language="json"
                      readOnly
                      height="300px"
                    />
                  </div>
                )}
                
                {selectedResult.metadata && (
                  <div className="text-sm text-gray-600">
                    <p>Model: {selectedResult.metadata.model}</p>
                    <p>Processing Time: {selectedResult.metadata.processingTime}ms</p>
                    <p>Timestamp: {new Date(selectedResult.metadata.timestamp).toLocaleString()}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-600 dark:text-red-400">
                <h4 className="font-medium mb-2">Error:</h4>
                <p>{selectedResult.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Data Preview */}
      {uploadedData && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Data Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <DataViewer 
              data={uploadedData.slice(0, 10)} 
              maxRows={10}
              title={`Showing first 10 of ${uploadedData.length} rows`}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

function getPlaceholderText(type: string): string {
  switch (type) {
    case 'analyze':
      return 'What insights can you find in this data? Are there any trends or patterns?';
    case 'generate':
      return 'Create a sales dashboard with KPI cards, trend charts, and regional breakdown...';
    case 'optimize':
      return 'How can I improve the performance of my dashboard? What optimizations do you recommend?';
    default:
      return 'Enter your question or request...';
  }
}