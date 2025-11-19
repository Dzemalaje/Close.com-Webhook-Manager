import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import ApiKeyModal from './components/ApiKeyModal';
import WebhookCard from './components/WebhookCard';
import { closeService } from './services/closeService';
import { WebhookSubscription, WebhookEvent } from './types';

// Lazy load the heavy modal component
const CreateWebhookModal = React.lazy(() => import('./components/CreateWebhookModal'));

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookSubscription | null>(null);

  const fetchWebhooks = useCallback(async (key: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await closeService.listWebhooks(key);
      setWebhooks(response.data);
    } catch (err: any) {
      console.error("Fetch error:", err);
      let msg = err.message || 'Failed to fetch webhooks';
      
      if (msg === 'Failed to fetch' || msg.includes('NetworkError')) {
        msg = 'Unable to connect to Close API. Please check your internet connection. If you are using an Ad Blocker, try disabling it.';
      } else if (msg.includes('401') || msg.includes('Unauthorized')) {
        setApiKey(null); // Force re-auth
        msg = 'Invalid API Key. Please try again.';
      }
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (apiKey) {
      fetchWebhooks(apiKey);
    }
  }, [apiKey, fetchWebhooks]);

  const handleCreate = useCallback(async (data: { url: string; events: WebhookEvent[] }) => {
    if (!apiKey) return;
    try {
      if (editingWebhook) {
        // Update existing
        await closeService.updateWebhook(apiKey, editingWebhook.id, data);
      } else {
        // Create new
        await closeService.createWebhook(apiKey, data);
      }
      // Refetch to get latest state
      fetchWebhooks(apiKey);
    } catch (err: any) {
      console.error("Create/Update failed", err);
      alert(err.message || "Failed to save webhook");
    }
  }, [apiKey, editingWebhook, fetchWebhooks]);

  const handleToggleStatus = useCallback(async (id: string, currentStatus: 'active' | 'paused') => {
    if (!apiKey) return;
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    // Optimistic update
    setWebhooks(prev => prev.map(wh => wh.id === id ? { ...wh, status: newStatus } : wh));

    try {
      await closeService.updateWebhook(apiKey, id, { status: newStatus });
    } catch (err) {
      // Revert on fail
      console.error("Status toggle failed", err);
      fetchWebhooks(apiKey); 
      alert("Failed to change status");
    }
  }, [apiKey, fetchWebhooks]);

  const handleDelete = useCallback(async (id: string) => {
    if (!apiKey) return;
    if (!window.confirm("Are you sure you want to delete this subscription?")) return;

    // Optimistic update
    setWebhooks(prev => prev.filter(wh => wh.id !== id));
    
    try {
      await closeService.deleteWebhook(apiKey, id);
    } catch (err) {
      console.error("Delete failed", err);
      fetchWebhooks(apiKey);
      alert("Failed to delete webhook");
    }
  }, [apiKey, fetchWebhooks]);

  const handleLogout = () => {
    setApiKey(null);
    setWebhooks([]);
    setError(null);
  };

  // Calculate Stats (Memoized)
  const stats = useMemo(() => ({
    total: webhooks.length,
    active: webhooks.filter(w => w.status === 'active').length,
    paused: webhooks.filter(w => w.status === 'paused').length,
    unhealthy: webhooks.filter(w => w.health_status !== 'healthy').length
  }), [webhooks]);

  if (!apiKey) {
    return <ApiKeyModal onSave={setApiKey} />;
  }

  return (
    <div className="min-h-screen text-slate-200 pb-12 relative">
      
      {/* Navbar */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 animate-fade-in-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20 animate-float">
                <i className="fa-solid fa-cube text-white transform group-hover:rotate-12 transition-transform duration-300"></i>
             </div>
             <h1 className="text-lg font-bold text-white tracking-tight">Close<span className="text-slate-500 font-light">Webhooks</span></h1>
          </div>
          <div className="flex items-center gap-4">
             <button 
               onClick={() => fetchWebhooks(apiKey)}
               className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors active:scale-90 transform duration-150"
               title="Refresh Data from Close"
             >
               <i className={`fa-solid fa-rotate ${loading ? 'fa-spin' : 'hover:rotate-180 transition-transform duration-500'}`}></i>
             </button>
             <button 
               onClick={handleLogout}
               className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-full transition-colors active:scale-90 transform duration-150"
               title="Clear API Key and Logout"
             >
               <i className="fa-solid fa-right-from-bracket"></i>
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up delay-100">
          <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-5 rounded-xl flex items-center justify-between hover:bg-slate-800 transition-colors duration-300" title="Total number of webhook subscriptions in this organization">
             <div>
               <p className="text-sm text-slate-400 font-medium">Total Subscriptions</p>
               <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
             </div>
             <div className="w-10 h-10 bg-slate-700/50 rounded-full flex items-center justify-center text-slate-300">
                <i className="fa-solid fa-cube"></i>
             </div>
          </div>
          <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-5 rounded-xl flex items-center justify-between hover:bg-slate-800 transition-colors duration-300" title="Number of currently active subscriptions sending events">
             <div>
               <p className="text-sm text-slate-400 font-medium">Active</p>
               <p className="text-2xl font-bold text-green-400 mt-1">{stats.active}</p>
             </div>
             <div className="w-10 h-10 bg-green-900/20 rounded-full flex items-center justify-center text-green-400">
                <i className="fa-solid fa-wifi"></i>
             </div>
          </div>
          <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-5 rounded-xl flex items-center justify-between hover:bg-slate-800 transition-colors duration-300" title="Number of paused subscriptions">
             <div>
               <p className="text-sm text-slate-400 font-medium">Paused</p>
               <p className="text-2xl font-bold text-amber-400 mt-1">{stats.paused}</p>
             </div>
             <div className="w-10 h-10 bg-amber-900/20 rounded-full flex items-center justify-center text-amber-400">
                <i className="fa-solid fa-ban"></i>
             </div>
          </div>
          <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-5 rounded-xl flex items-center justify-between hover:bg-slate-800 transition-colors duration-300" title="Subscriptions experiencing delivery failures">
             <div>
               <p className="text-sm text-slate-400 font-medium">Unhealthy</p>
               <p className="text-2xl font-bold text-red-400 mt-1">{stats.unhealthy}</p>
             </div>
             <div className="w-10 h-10 bg-red-900/20 rounded-full flex items-center justify-center text-red-400">
                <i className="fa-solid fa-shield-halved"></i>
             </div>
          </div>
        </div>

        {/* Limits Information Banner */}
        <div 
          className="animate-fade-in-up delay-200 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-lg px-4 py-3 text-sm text-slate-400 gap-3 cursor-help hover:bg-slate-800/70 transition-colors duration-300"
          title="Close imposes a limit of 40 subscriptions per organization, with exceptions for approved automation platforms (up to 500)."
        >
           <div className="flex items-start sm:items-center gap-2">
              <i className="fa-solid fa-circle-info text-blue-400 mt-0.5 sm:mt-0 flex-shrink-0 animate-pulse"></i>
              <span>
                Organization Limit: <strong className={`${stats.total >= 40 ? 'text-red-400' : 'text-slate-200'}`}>{stats.total} / 40</strong> subscriptions used.
                <span className="text-slate-500 block sm:inline sm:ml-2 mt-1 sm:mt-0">
                  (Up to 500 allowed for specific automation platforms)
                </span>
              </span>
           </div>
           <div className="w-full sm:w-32 h-1.5 bg-slate-700 rounded-full overflow-hidden flex-shrink-0">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${stats.total >= 40 ? 'bg-red-500' : 'bg-blue-500'}`} 
                style={{ width: `${Math.min((stats.total / 40) * 100, 100)}%` }}
              />
           </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between animate-fade-in-up delay-200">
          <h2 className="text-xl font-semibold text-white">Your Subscriptions</h2>
          <button 
            onClick={() => { setEditingWebhook(null); setIsModalOpen(true); }}
            disabled={stats.total >= 500} 
            title="Add a new webhook subscription configuration"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg transition-all hover:shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            <i className="fa-solid fa-plus"></i>
            <span className="hidden sm:inline">Add Subscription</span>
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 flex items-center gap-3 animate-fade-in-up">
            <i className="fa-solid fa-circle-exclamation text-red-400 text-xl"></i>
            <span className="text-red-200">{error}</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && webhooks.length === 0 && !error && (
          <div className="text-center py-20 bg-slate-800/30 rounded-xl border border-slate-700/50 border-dashed animate-fade-in-up delay-300">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
              <i className="fa-solid fa-inbox text-2xl"></i>
            </div>
            <h3 className="text-lg font-medium text-white">No subscriptions yet</h3>
            <p className="text-slate-400 mt-1 max-w-sm mx-auto">
              Create your first webhook to start listening for events in your Close organization.
            </p>
            <button 
               onClick={() => { setEditingWebhook(null); setIsModalOpen(true); }}
               className="mt-6 text-blue-400 hover:text-blue-300 font-medium hover:underline"
            >
              Create Subscription
            </button>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in-up delay-300">
           {webhooks.map((webhook) => (
             <WebhookCard 
               key={webhook.id} 
               webhook={webhook} 
               onToggleStatus={handleToggleStatus}
               onDelete={handleDelete}
               onEdit={(w) => { setEditingWebhook(w); setIsModalOpen(true); }}
             />
           ))}
        </div>
        
        {/* Loading State */}
        {loading && (
           <div className="flex justify-center py-12">
             <i className="fa-solid fa-circle-notch fa-spin text-3xl text-blue-500"></i>
           </div>
        )}

      </main>
      
      <Suspense fallback={null}>
        <CreateWebhookModal 
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingWebhook(null); }}
          onSave={handleCreate}
          initialData={editingWebhook}
        />
      </Suspense>
    </div>
  );
};

export default App;
