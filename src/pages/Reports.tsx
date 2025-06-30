import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFilterStore } from '../features/filters/filterStore';
import {
  FileText, Download, Share2, Mail, Calendar, Clock, Eye,
  BarChart3, PieChart, TrendingUp, MapPin, Users, Package,
  Settings, Plus, Edit, Trash2, Play, Pause, RefreshCcw, Banknote
} from 'lucide-react';

interface Report {
  id: string;
  name: string;
  type: 'executive' | 'detailed' | 'custom';
  format: 'pdf' | 'excel' | 'powerpoint';
  created: Date;
  size: string;
  status: 'ready' | 'generating' | 'scheduled';
}

interface ScheduledReport {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  nextRun: Date;
  recipients: string[];
  active: boolean;
}

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const { filters } = useFilterStore();
  const [activeTab, setActiveTab] = useState('executive-summary');
  const [selectedTemplate, setSelectedTemplate] = useState('executive-summary');
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel' | 'powerpoint'>('pdf');
  const [selectedPeriod, setSelectedPeriod] = useState('last-month');
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock data
  const [reports, setReports] = useState<Report[]>([
    {
      id: '1',
      name: 'Executive Summary - March 2024',
      type: 'executive',
      format: 'pdf',
      created: new Date('2024-03-01'),
      size: '2.4 MB',
      status: 'ready'
    },
    {
      id: '2',
      name: 'Product Analysis - Beverages',
      type: 'detailed',
      format: 'excel',
      created: new Date('2024-02-28'),
      size: '5.1 MB',
      status: 'ready'
    },
    {
      id: '3',
      name: 'Geographic Performance - NCR',
      type: 'custom',
      format: 'powerpoint',
      created: new Date('2024-02-25'),
      size: '8.7 MB',
      status: 'ready'
    },
    {
      id: '4',
      name: 'Q1 Summary Report',
      type: 'executive',
      format: 'pdf',
      created: new Date('2024-02-20'),
      size: '3.2 MB',
      status: 'ready'
    }
  ]);

  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([
    {
      id: '1',
      name: 'Weekly Summary',
      frequency: 'weekly',
      nextRun: new Date('2024-03-11'),
      recipients: ['manager@company.com', 'analyst@company.com'],
      active: true
    },
    {
      id: '2',
      name: 'Monthly Executive Report',
      frequency: 'monthly',
      nextRun: new Date('2024-04-01'),
      recipients: ['ceo@company.com', 'cfo@company.com'],
      active: true
    }
  ]);

  const tabs = [
    { id: 'executive-summary', label: 'Executive Summary', icon: BarChart3 },
    { id: 'detailed-reports', label: 'Detailed Reports', icon: FileText },
    { id: 'custom-reports', label: 'Custom Reports', icon: Settings },
    { id: 'export-center', label: 'Export Center', icon: Download }
  ];

  const reportTemplates = [
    {
      id: 'executive-summary',
      name: 'Executive Summary',
      description: 'High-level KPIs and key insights for leadership',
      icon: BarChart3,
      estimatedTime: '2-3 minutes',
      sections: ['KPI Overview', 'Growth Trends', 'Top Performers', 'Key Insights']
    },
    {
      id: 'sales-performance',
      name: 'Sales Performance',
      description: 'Detailed sales analysis and trends',
      icon: TrendingUp,
      estimatedTime: '3-4 minutes',
      sections: ['Sales Trends', 'Regional Performance', 'Product Analysis', 'Forecasts']
    },
    {
      id: 'product-analysis',
      name: 'Product Analysis',
      description: 'Comprehensive product performance report',
      icon: Package,
      estimatedTime: '4-5 minutes',
      sections: ['Category Performance', 'Brand Analysis', 'SKU Deep Dive', 'Opportunities']
    },
    {
      id: 'geographic-report',
      name: 'Geographic Report',
      description: 'Location-based performance and insights',
      icon: MapPin,
      estimatedTime: '3-4 minutes',
      sections: ['Regional Overview', 'City Performance', 'Market Penetration', 'Expansion']
    },
    {
      id: 'consumer-insights',
      name: 'Consumer Insights',
      description: 'Customer behavior and segmentation analysis',
      icon: Users,
      estimatedTime: '4-5 minutes',
      sections: ['Customer Segments', 'Behavior Patterns', 'Preferences', 'Retention']
    }
  ];

  const formatOptions = [
    { value: 'pdf', label: 'PDF Document', icon: FileText, description: 'Professional presentation format' },
    { value: 'excel', label: 'Excel Workbook', icon: BarChart3, description: 'Data analysis and manipulation' },
    { value: 'powerpoint', label: 'PowerPoint', icon: PieChart, description: 'Presentation slides' }
  ];

  const periodOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last-7-days', label: 'Last 7 Days' },
    { value: 'last-30-days', label: 'Last 30 Days' },
    { value: 'last-month', label: 'Last Month' },
    { value: 'last-quarter', label: 'Last Quarter' },
    { value: 'last-year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      const newReport: Report = {
        id: Date.now().toString(),
        name: `${reportTemplates.find(t => t.id === selectedTemplate)?.name} - ${new Date().toLocaleDateString()}`,
        type: selectedTemplate.includes('executive') ? 'executive' : 'detailed',
        format: selectedFormat,
        created: new Date(),
        size: '2.1 MB',
        status: 'ready'
      };
      
      setReports(prev => [newReport, ...prev]);
      setIsGenerating(false);
    }, 3000);
  };

  const renderExecutiveSummary = () => (
    <div className="space-y-6">
      {/* Report Generator */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Generate Executive Summary</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Current filters applied</span>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Template</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {reportTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {/* Period Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Output Format</label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {formatOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Template Preview */}
        {selectedTemplate && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                {React.createElement(
                  reportTemplates.find(t => t.id === selectedTemplate)?.icon || FileText,
                  { className: "w-6 h-6 text-primary-600" }
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">
                  {reportTemplates.find(t => t.id === selectedTemplate)?.name}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  {reportTemplates.find(t => t.id === selectedTemplate)?.description}
                </p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>⏱️ {reportTemplates.find(t => t.id === selectedTemplate)?.estimatedTime}</span>
                  <span>📄 {reportTemplates.find(t => t.id === selectedTemplate)?.sections.length} sections</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Report Sections:</h5>
              <div className="flex flex-wrap gap-2">
                {reportTemplates.find(t => t.id === selectedTemplate)?.sections.map((section, index) => (
                  <span key={index} className="px-2 py-1 bg-white text-xs text-gray-600 rounded border">
                    {section}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <div className="flex justify-center">
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Generating Report...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Generate Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Report Preview */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Executive Summary Preview</h3>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-sm text-primary-600 border border-primary-300 rounded hover:bg-primary-50">
              <Eye className="w-4 h-4 inline mr-1" />
              Preview
            </button>
            <button className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700">
              <Download className="w-4 h-4 inline mr-1" />
              Download
            </button>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Executive Summary</h2>
            <p className="text-gray-600">March 2024 Performance Report</p>
          </div>

          {/* KPI Overview */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">📊 Key Performance Indicators</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">₱2.4M</div>
                <div className="text-sm text-blue-700">Total Sales</div>
                <div className="text-xs text-green-600">+15.2% vs last month</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">8,547</div>
                <div className="text-sm text-green-700">Transactions</div>
                <div className="text-xs text-green-600">+8.7% vs last month</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">₱287</div>
                <div className="text-sm text-purple-700">Avg Basket</div>
                <div className="text-xs text-green-600">+6.1% vs last month</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">127</div>
                <div className="text-sm text-orange-700">Active Outlets</div>
                <div className="text-xs text-green-600">+5.8% vs last month</div>
              </div>
            </div>
          </div>

          {/* Top Performers */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">🏆 Top Performers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Top Regions</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>NCR</span>
                    <span className="font-medium">₱850K (35.4%)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Region VII</span>
                    <span className="font-medium">₱380K (15.8%)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Region III</span>
                    <span className="font-medium">₱320K (13.3%)</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Top Products</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Coca-Cola 355ml</span>
                    <span className="font-medium">₱180K</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Oishi Prawn Crackers</span>
                    <span className="font-medium">₱145K</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Alaska Evap Milk</span>
                    <span className="font-medium">₱125K</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Key Insights</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <span>Beverages category shows strongest growth at 28.5% YoY</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <span>Region XI (Davao) presents highest growth opportunity at 25.4%</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <span>Peak sales hours: 2-4 PM - consider staff optimization</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDetailedReports = () => (
    <div className="space-y-6">
      {/* Quick Report Generation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reportTemplates.slice(1).map((template) => (
          <motion.div
            key={template.id}
            className="chart-container cursor-pointer"
            whileHover={{ scale: 1.02 }}
            onClick={() => {
              setSelectedTemplate(template.id);
              setActiveTab('executive-summary');
            }}
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <template.icon className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{template.name}</h4>
                <p className="text-xs text-gray-600">{template.estimatedTime}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">{template.description}</p>
            <button className="w-full py-2 bg-primary-600 text-white text-sm rounded hover:bg-primary-700">
              Generate Now
            </button>
          </motion.div>
        ))}
      </div>

      {/* Recent Reports */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Reports</h3>
          <button className="text-sm text-primary-600 hover:text-primary-800">
            Manage Reports →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Report Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Format</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Created</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Size</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{report.name}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      report.type === 'executive' ? 'bg-blue-100 text-blue-800' :
                      report.type === 'detailed' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {report.type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600 uppercase">{report.format}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">{report.created.toLocaleDateString()}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">{report.size}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button className="text-primary-600 hover:text-primary-800">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-800">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-800">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCustomReports = () => (
    <div className="space-y-6">
      <div className="chart-container">
        <div className="text-center py-12">
          <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Custom Report Builder</h3>
          <p className="text-gray-600 mb-6">
            Create custom reports with your specific requirements and data selections
          </p>
          <button className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <Plus className="w-4 h-4 inline mr-2" />
            Build Custom Report
          </button>
        </div>
      </div>
    </div>
  );

  const renderExportCenter = () => (
    <div className="space-y-6">
      {/* Scheduled Reports */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Scheduled Reports</h3>
          <button className="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700">
            <Plus className="w-4 h-4 inline mr-1" />
            Add Schedule
          </button>
        </div>

        <div className="space-y-3">
          {scheduledReports.map((schedule) => (
            <div key={schedule.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${schedule.active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <div>
                  <h4 className="font-medium text-gray-900">{schedule.name}</h4>
                  <p className="text-sm text-gray-600">
                    {schedule.frequency} • Next: {schedule.nextRun.toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Recipients: {schedule.recipients.join(', ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-1 text-gray-600 hover:text-gray-800">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-600 hover:text-gray-800">
                  {schedule.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button className="p-1 text-red-600 hover:text-red-800">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="chart-container">
          <h4 className="font-semibold text-gray-900 mb-3">📧 Email Reports</h4>
          <p className="text-sm text-gray-600 mb-4">
            Send reports directly to stakeholders via email
          </p>
          <button className="w-full py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
            <Mail className="w-4 h-4 inline mr-2" />
            Setup Email Reports
          </button>
        </div>

        <div className="chart-container">
          <h4 className="font-semibold text-gray-900 mb-3">📅 Schedule Reports</h4>
          <p className="text-sm text-gray-600 mb-4">
            Automate report generation and delivery
          </p>
          <button className="w-full py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700">
            <Calendar className="w-4 h-4 inline mr-2" />
            Schedule Reports
          </button>
        </div>

        <div className="chart-container">
          <h4 className="font-semibold text-gray-900 mb-3">📊 Interactive Dashboard</h4>
          <p className="text-sm text-gray-600 mb-4">
            Share live dashboard with real-time data
          </p>
          <button className="w-full py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700">
            <Share2 className="w-4 h-4 inline mr-2" />
            Share Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports Dashboard</h1>
          <p className="text-gray-600">
            Generate, schedule, and share comprehensive analytics reports
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="filter-button flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Bulk Export</span>
          </button>
          <button className="filter-button flex items-center space-x-2">
            <RefreshCcw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* Tab Navigation - ALL TABS FUNCTIONAL */}
      <motion.div
        className="flex space-x-1 bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg p-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Tab Content - ALL TABS IMPLEMENTED */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'executive-summary' && renderExecutiveSummary()}
        {activeTab === 'detailed-reports' && renderDetailedReports()}
        {activeTab === 'custom-reports' && renderCustomReports()}
        {activeTab === 'export-center' && renderExportCenter()}
      </motion.div>
    </div>
  );
};

export default Reports;