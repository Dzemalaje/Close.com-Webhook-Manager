import React, { useState } from 'react';

interface ApiKeyModalProps {
  onSave: (key: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave }) => {
  const [key, setKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      onSave(key.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in-up">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-zoom-in">
        <div className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center animate-float">
              <i className="fa-solid fa-lock text-blue-400 text-xl"></i>
            </div>
            <h2 className="text-xl font-semibold text-white">Authenticate with Close</h2>
            
            <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-200 text-left space-y-3 shadow-inner">
                <div className="flex gap-3">
                    <i className="fa-solid fa-shield-halved mt-1 text-blue-400 flex-shrink-0"></i>
                    <span>The API key is only used in your browser and is <strong>never</strong> sent to any third-party server.</span>
                </div>
                <div className="flex gap-3">
                    <i className="fa-solid fa-hourglass-half mt-1 text-blue-400 flex-shrink-0"></i>
                    <span>It is stored only in memory for this session. <strong>After a full page reload, the API key needs to be entered again.</strong></span>
                </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="apiKey" className="text-xs font-medium text-slate-300 uppercase tracking-wider flex items-center justify-between">
                API Key
                <span className="text-slate-500 text-[10px] normal-case cursor-help" title="Found in Close Settings > API Keys">Required</span>
              </label>
              <div className="relative group" title="Paste your Close.com API Key here">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fa-solid fa-key text-slate-500 text-sm group-focus-within:text-blue-500 transition-colors"></i>
                </div>
                <input
                  type="password"
                  id="apiKey"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all"
                  placeholder="api_..."
                  autoFocus
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={!key}
              title={!key ? "Please enter an API key to continue" : "Connect to Close.com API"}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-4 rounded-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-blue-900/20"
            >
              <i className="fa-solid fa-shield-check"></i>
              Access Dashboard
            </button>
          </form>
          
          <div className="text-xs text-center text-slate-500">
            You can find your API key in Close under Settings &gt; API Keys.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;