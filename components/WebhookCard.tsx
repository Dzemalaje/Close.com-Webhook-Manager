import React, { useState, useMemo } from 'react';
import { WebhookSubscription } from '../types';

interface WebhookCardProps {
  webhook: WebhookSubscription;
  onToggleStatus: (id: string, currentStatus: 'active' | 'paused') => void;
  onDelete: (id: string) => void;
  onEdit: (webhook: WebhookSubscription) => void;
}

const WebhookCard: React.FC<WebhookCardProps> = React.memo(({ webhook, onToggleStatus, onDelete, onEdit }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);

  const isActive = webhook.status === 'active';
  const isHealthy = webhook.health_status === 'healthy';

  // Group events by object type for the popover
  const groupedEvents = useMemo(() => {
    const groups: Record<string, string[]> = {};
    webhook.events.forEach(evt => {
      if (!groups[evt.object_type]) groups[evt.object_type] = [];
      groups[evt.object_type].push(evt.action);
    });
    return groups;
  }, [webhook.events]);

  const visibleEvents = webhook.events.slice(0, 3);
  const hiddenCount = webhook.events.length - 3;

  return (
    <div className="bg-slate-800/90 backdrop-blur border border-slate-700 rounded-xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative animate-fade-in-up">
      
      {/* Status Line */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-2.5 h-2.5">
             {isActive && <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"></span>}
             <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-amber-500'}`} title={`Status: ${webhook.status}`}></span>
          </div>
          
          <span 
            className={`text-xs font-semibold px-2 py-0.5 rounded border transition-colors duration-300 ${
            isActive 
              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
          }`}
            title={isActive ? "Webhook is active and sending events" : "Webhook is paused and will not send events"}
          >
            {webhook.status.toUpperCase()}
          </span>
          
          {!isHealthy && (
             <span 
                className="text-xs font-semibold px-2 py-0.5 rounded border bg-red-500/10 border-red-500/20 text-red-400 flex items-center gap-1 cursor-help animate-subtle-pulse"
                title="This webhook has experienced recent delivery failures"
             >
               <i className="fa-solid fa-triangle-exclamation"></i> UNHEALTHY
             </span>
          )}
        </div>

        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-700 transition-all duration-200 active:scale-95"
            title="Actions menu"
          >
            <i className="fa-solid fa-ellipsis text-lg"></i>
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-8 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden animate-zoom-in origin-top-right">
              <button 
                onClick={() => { onEdit(webhook); setShowMenu(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2"
                title="Edit destination URL or event triggers"
              >
                <i className="fa-solid fa-pen-to-square w-4 text-center"></i> Edit Config
              </button>
              <button 
                onClick={() => { onToggleStatus(webhook.id, webhook.status); setShowMenu(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2"
                title={isActive ? "Pause delivery of events" : "Resume delivery of events"}
              >
                <i className={`fa-solid ${isActive ? 'fa-pause' : 'fa-play'} w-4 text-center`}></i>
                {isActive ? 'Pause' : 'Resume'}
              </button>
              <div className="h-px bg-slate-800 my-1" />
              <button 
                onClick={() => { onDelete(webhook.id); setShowMenu(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors flex items-center gap-2"
                title="Permanently delete this webhook"
              >
                <i className="fa-solid fa-trash-can w-4 text-center"></i> Delete
              </button>
            </div>
          )}
          {/* Backdrop to close menu */}
          {showMenu && <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Destination</h3>
          <div className="flex items-center gap-2 text-slate-200 truncate font-mono text-sm bg-slate-900/50 p-2 rounded border border-slate-700/50 hover:border-slate-600 transition-colors duration-300" title={webhook.url}>
             <i className="fa-solid fa-arrow-up-right-from-square text-blue-500 text-xs flex-shrink-0"></i>
             <span className="truncate">{webhook.url}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Events</h3>
                <div className="flex flex-wrap gap-1.5">
                    {visibleEvents.map((evt, i) => (
                        <span key={i} className="inline-flex items-center px-2 py-1 rounded text-[10px] font-medium bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600 transition-colors cursor-default" title={`${evt.object_type} ${evt.action}`}>
                            {evt.object_type} · {evt.action}
                        </span>
                    ))}
                    {hiddenCount > 0 && (
                        <div 
                          className="relative"
                          onMouseEnter={() => setShowAllEvents(true)}
                          onMouseLeave={() => setShowAllEvents(false)}
                        >
                            <span 
                                className="inline-flex items-center px-2 py-1 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-slate-200 transition-colors cursor-help"
                                title="View all configured events"
                            >
                                +{hiddenCount} more
                            </span>
                            
                            {/* Structured Popover */}
                            {showAllEvents && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 animate-zoom-in origin-bottom overflow-hidden">
                                    <div className="bg-slate-800 px-3 py-2 border-b border-slate-700 flex justify-between items-center">
                                        <span className="text-xs font-semibold text-white">All Events</span>
                                        <span className="text-[10px] text-slate-400">{webhook.events.length} total</span>
                                    </div>
                                    <div className="p-2 max-h-48 overflow-y-auto custom-scrollbar">
                                        {Object.entries(groupedEvents).map(([type, actions]) => (
                                            <div key={type} className="mb-2 last:mb-0">
                                                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-0.5 px-1">
                                                    {type}
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {actions.map(action => (
                                                        <span key={action} className="text-[10px] bg-slate-800/50 border border-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                                                            {action}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Arrow */}
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45"></div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="col-span-2 mt-2">
                 <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Created</h3>
                 <div className="flex items-center gap-2 text-xs text-slate-400" title={new Date(webhook.date_created).toString()}>
                    <i className="fa-regular fa-calendar text-slate-500"></i>
                    {new Date(webhook.date_created).toLocaleDateString()}
                 </div>
            </div>
        </div>

        {/* Error Section */}
        {webhook.latest_error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 animate-fade-in-up">
                <div className="flex items-start gap-2">
                    <i className="fa-solid fa-triangle-exclamation text-red-500 mt-0.5 shrink-0 text-sm animate-bounce"></i>
                    <div className="flex-1">
                        <p className="text-xs text-red-300 font-mono break-all mb-2" title={webhook.latest_error}>{webhook.latest_error}</p>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
});

export default WebhookCard;