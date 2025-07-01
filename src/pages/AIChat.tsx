import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Database, ChevronDown, Copy, RotateCcw, BarChart3, Zap } from 'lucide-react';
import { insightTemplates, getTemplatesByCategory } from '../lib/insightTemplates';
import { useDataStore } from '../stores/dataStore';
import { useFilterStore } from '../features/filters/filterStore';
import { useQueryOrchestrator, useQuerySuggestions } from '../hooks/useQueryOrchestrator';
import { QueryResponse } from '../services/query-orchestrator';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  template?: string;
  data?: any;
  queryResponse?: QueryResponse;
  responseType?: 'sql_result' | 'ai_insight' | 'visualization' | 'alert' | 'hybrid';
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your enhanced AI retail analyst. I can answer any question about your data, generate SQL queries, provide insights, and help you make data-driven decisions. I now have access to your complete database schema and can handle complex analytical queries. What would you like to explore?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Use the new query orchestrator
  const { query, isLoading, lastResponse } = useQueryOrchestrator({
    context: 'chat',
    autoIncludeFilters: true
  });
  
  const suggestions = useQuerySuggestions({ page: 'ai-chat' });
  
  const { kpiMetrics, salesTrendData, productPerformanceData } = useDataStore();
  const filters = useFilterStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');

    try {
      // Use the query orchestrator to process the query
      const response = await query(currentInput);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: formatResponseContent(response),
        timestamp: new Date(),
        queryResponse: response,
        responseType: response.type
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Query failed:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your query. Please try rephrasing your question or check if the data is available.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const formatResponseContent = (response: QueryResponse): string => {
    let content = '';

    // Add main insight or result
    if (response.insight) {
      content += response.insight + '\n\n';
    }

    // Add data summary for SQL results
    if (response.type === 'sql_result' && response.data) {
      if (response.data.length > 0) {
        content += `📊 **Data Results** (${response.data.length} rows):\n\n`;
        
        // Show first few rows as preview
        const preview = response.data.slice(0, 5);
        const columns = Object.keys(preview[0] || {});
        
        preview.forEach((row, index) => {
          content += `${index + 1}. `;
          columns.slice(0, 3).forEach(col => {
            const value = row[col];
            if (typeof value === 'number' && col.toLowerCase().includes('amount') || col.toLowerCase().includes('sales')) {
              content += `${col}: ₱${value.toLocaleString()} `;
            } else {
              content += `${col}: ${value} `;
            }
          });
          content += '\n';
        });
        
        if (response.data.length > 5) {
          content += `... and ${response.data.length - 5} more rows\n`;
        }
      } else {
        content += '📊 No data found for your query.\n';
      }
    }

    // Add alert information
    if (response.type === 'alert' && response.data) {
      content += `🚨 **Active Alerts** (${response.data.length}):\n\n`;
      response.data.forEach((alert: any, index: number) => {
        content += `${index + 1}. **${alert.type.toUpperCase()}**: ${alert.message}\n`;
        if (alert.region) content += `   Region: ${alert.region}\n`;
        if (alert.priority) content += `   Priority: ${alert.priority}\n`;
        content += '\n';
      });
    }

    // Add SQL query for transparency (if available)
    if (response.sql_executed && (response.type === 'sql_result' || response.type === 'hybrid')) {
      content += `\n💻 **SQL Query Executed**:\n\`\`\`sql\n${response.sql_executed}\n\`\`\`\n`;
    }

    // Add next suggestions
    if (response.next_suggestions && response.next_suggestions.length > 0) {
      content += '\n**💡 Follow-up questions you might ask:**\n';
      response.next_suggestions.slice(0, 3).forEach(suggestion => {
        content += `• ${suggestion}\n`;
      });
    }

    // Add performance info
    if (response.processing_time) {
      content += `\n⚡ *Query processed in ${response.processing_time}ms*`;
      if (response.confidence) {
        content += ` • Confidence: ${Math.round(response.confidence * 100)}%`;
      }
      if (response.fallback_used) {
        content += ` • Used fallback method`;
      }
    }

    return content || 'I processed your query but didn\'t get a clear result. Please try rephrasing your question.';
  };

  const handleTemplateClick = (templateId: string) => {
    const template = insightTemplates.find(t => t.id === templateId);
    if (template) {
      setInput(`Analyze ${template.name.toLowerCase()} for ${filters.region || 'all regions'}`);
    }
  };

  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'sales', label: 'Sales & Revenue' },
    { value: 'behavior', label: 'Consumer Behavior' },
    { value: 'demographic', label: 'Demographics' },
    { value: 'operational', label: 'Operations' },
    { value: 'predictive', label: 'Predictions' }
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? insightTemplates 
    : getTemplatesByCategory(selectedCategory as any);

  return (
    <div className="flex h-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Retail Analyst</h1>
                <p className="text-sm text-gray-600">Powered by advanced analytics</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <RotateCcw className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-3 max-w-2xl ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`p-2 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-blue-600' 
                      : 'bg-gradient-to-br from-gray-100 to-gray-200'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-gray-700" />
                    )}
                  </div>
                  <div className={`px-4 py-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200'
                  }`}>
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs ${message.role === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      {message.role === 'assistant' && (
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Copy className="w-3 h-3 text-gray-500" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-2"
            >
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-sm text-gray-500">Processing your query...</span>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about sales patterns, customer behavior, or any retail insights..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={2}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Sidebar with Suggestions and Templates */}
      <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col">
        {/* Query Suggestions */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <Zap className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Smart Suggestions</h2>
          </div>
          <div className="space-y-2">
            {suggestions.slice(0, 4).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setInput(suggestion)}
                className="w-full text-left text-xs px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Analysis Templates */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <BarChart3 className="w-4 h-4 text-green-600" />
            <h2 className="font-semibold text-gray-900">Analysis Templates</h2>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {filteredTemplates.slice(0, 6).map((template) => (
              <motion.button
                key={template.id}
                onClick={() => handleTemplateClick(template.id)}
                className="w-full text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <h3 className="font-medium text-gray-900 text-sm">{template.name}</h3>
                <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                <div className="mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    template.category === 'sales' ? 'bg-green-100 text-green-700' :
                    template.category === 'behavior' ? 'bg-blue-100 text-blue-700' :
                    template.category === 'demographic' ? 'bg-purple-100 text-purple-700' :
                    template.category === 'operational' ? 'bg-orange-100 text-orange-700' :
                    'bg-pink-100 text-pink-700'
                  }`}>
                    {template.category}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
          
          {/* Query Help */}
          <div className="mt-6 p-3 bg-white rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 text-sm mb-2">💡 Query Examples:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>• "Show daily sales for last 30 days"</div>
              <div>• "Which regions are underperforming?"</div>
              <div>• "Compare JTI vs Philip Morris"</div>
              <div>• "What alerts need attention?"</div>
              <div>• "Analyze substitution patterns"</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;