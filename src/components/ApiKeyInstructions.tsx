import React from 'react';
import { AlertCircle, Key, ExternalLink } from 'lucide-react';
import { hasAIProvider } from '../config/credentials';

export const ApiKeyInstructions: React.FC = () => {
  const hasOpenAI = hasAIProvider('openai');
  const hasAnthropic = hasAIProvider('anthropic');
  
  if (hasOpenAI || hasAnthropic) {
    return null; // Keys are configured
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
      <div className="flex items-start">
        <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5" />
        <div className="ml-3 flex-1">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            AI Features Require API Keys
          </h3>
          <p className="text-yellow-700 mb-4">
            To enable AI-powered features like natural language queries and intelligent insights, 
            you need to add your OpenAI or Anthropic API keys.
          </p>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-yellow-800 mb-2">Quick Setup:</h4>
              <ol className="list-decimal list-inside space-y-2 text-yellow-700">
                <li>Copy <code className="bg-yellow-100 px-1 py-0.5 rounded">.env.example</code> to <code className="bg-yellow-100 px-1 py-0.5 rounded">.env.local</code></li>
                <li>Add your API keys to the file</li>
                <li>Restart the development server</li>
              </ol>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-yellow-300 rounded-md text-yellow-700 hover:bg-yellow-50 transition-colors"
              >
                <Key className="w-4 h-4" />
                Get OpenAI Key
                <ExternalLink className="w-3 h-3" />
              </a>
              
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-yellow-300 rounded-md text-yellow-700 hover:bg-yellow-50 transition-colors"
              >
                <Key className="w-4 h-4" />
                Get Anthropic Key
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="text-sm text-yellow-600">
              <p>
                For detailed instructions, see the 
                <a href="/API_KEYS_SETUP.md" className="underline ml-1">API Keys Setup Guide</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};