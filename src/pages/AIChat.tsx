import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Database, ChevronDown, Copy, RotateCcw } from 'lucide-react';
import { insightTemplates, getTemplatesByCategory } from '../lib/insightTemplates';
import { useDataStore } from '../stores/dataStore';
import { useFilterStore } from '../features/filters/filterStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  template?: string;
  data?: any;
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI retail analyst. I can help you understand patterns in your data, identify opportunities, and answer questions about your retail operations. What would you like to explore today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { kpiMetrics, salesTrendData, productPerformanceData } = useDataStore();
  const filters = useFilterStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI processing
    setTimeout(() => {
      const aiResponse = generateAIResponse(input);
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (query: string): Message => {
    const lowerQuery = query.toLowerCase();
    let response = '';
    let template = undefined;

    // Pattern matching for common queries
    if (lowerQuery.includes('sales') || lowerQuery.includes('revenue')) {
      const totalSales = kpiMetrics.find(m => m.id === 'total_sales')?.value || 0;
      response = `Based on current data, total sales are ₱${totalSales.toLocaleString()}. `;
      
      if (salesTrendData.length > 0) {
        const trend = salesTrendData[salesTrendData.length - 1].value > salesTrendData[0].value ? 'increasing' : 'decreasing';
        response += `Sales are ${trend} over the selected period. `;
      }
      
      response += '\n\nWould you like me to:\n• Analyze sales by region\n• Show top performing products\n• Identify growth opportunities\n• Compare time periods';
      template = 'priceSensitivity';
    }
    else if (lowerQuery.includes('product') || lowerQuery.includes('sku')) {
      const topProducts = productPerformanceData.slice(0, 3);
      response = 'Here are your top performing products:\n\n';
      topProducts.forEach((product, index) => {
        response += `${index + 1}. ${product.name} - ₱${product.sales.toLocaleString()}\n`;
      });
      response += '\nI can provide deeper analysis on product performance, substitution patterns, or category trends.';
      template = 'basketComposition';
    }
    else if (lowerQuery.includes('substitut') || lowerQuery.includes('switch')) {
      response = 'Brand substitution analysis shows:\n\n';
      response += '• Coke → Pepsi occurs in 15% of out-of-stock cases\n';
      response += '• Substitution rate is highest in beverages (18%)\n';
      response += '• Customer accepts substitution 68% of the time\n';
      response += '• Revenue impact: -₱45,000/month from lost sales\n\n';
      response += 'Would you like to see substitution patterns by region or category?';
      template = 'substitutionMap';
    }
    else if (lowerQuery.includes('customer') || lowerQuery.includes('demographic')) {
      response = 'Customer demographic insights:\n\n';
      response += '• Highest value segment: Female 35-44 (₱215.80 avg basket)\n';
      response += '• Fastest growing: Male 18-24 (+28% YoY)\n';
      response += '• Most frequent: Female 25-34 (3.2 visits/week)\n';
      response += '• Digital payment adoption highest in 25-34 age group\n\n';
      response += 'I can analyze purchase patterns by age, gender, or location.';
      template = 'genderPreference';
    }
    else if (lowerQuery.includes('peak') || lowerQuery.includes('time') || lowerQuery.includes('hour')) {
      response = 'Transaction timing analysis:\n\n';
      response += '• Peak hours: 6-7 PM (32% of daily transactions)\n';
      response += '• Morning rush: 7-8 AM (18% of transactions)\n';
      response += '• Slowest period: 2-4 PM\n';
      response += '• Weekend volume +23% vs weekdays\n\n';
      response += 'This data can help optimize staffing and inventory schedules.';
      template = 'peakHourAnalysis';
    }
    else {
      response = 'I can help you analyze:\n\n';
      response += '📊 **Sales & Revenue**: Trends, forecasts, price optimization\n';
      response += '🛍️ **Products**: Performance, substitutions, basket analysis\n';
      response += '👥 **Customers**: Demographics, behavior, segmentation\n';
      response += '⏰ **Operations**: Peak hours, staffing, inventory\n';
      response += '🎯 **Predictions**: Demand forecasting, churn risk, promotions\n\n';
      response += 'What aspect would you like to explore?';
    }

    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      template
    };
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
          
          {isTyping && (
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
              <span className="text-sm text-gray-500">AI is thinking...</span>
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
              disabled={!input.trim() || isTyping}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Template Sidebar */}
      <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-3">Analysis Templates</h2>
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
            {filteredTemplates.map((template) => (
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
        </div>
      </div>
    </div>
  );
};

export default AIChat;